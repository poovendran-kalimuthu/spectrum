import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ChevronRight, Search, Bell, Check, Plus, AlertCircle, Calendar as CalendarIcon, Users } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import './TopNav.css';

const TopNav = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], events: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Admin Notification Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info' });
  const [isSending, setIsSending] = useState(false);

  const isAdmin = user && ['superadmin', 'admin_t1', 'admin_t2'].includes(user.role);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restrict body scroll when admin modal is open
  useEffect(() => {
    if (showAdminModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showAdminModal]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { withCredentials: true });
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`, {}, { withCredentials: true });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults({ users: [], events: [] });
      setIsSearchOpen(false);
      return;
    }
    setIsSearchOpen(true);
    try {
      const res = await axios.get(`${API_URL}/api/search?q=${q}`, { withCredentials: true });
      if (res.data.success) {
        setSearchResults(res.data.results);
      }
    } catch (err) {
      console.error("Search error", err);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await axios.post(`${API_URL}/api/notifications`, newNotif, { withCredentials: true });
      setShowAdminModal(false);
      setNewNotif({ title: '', message: '', type: 'info' });
      fetchNotifications();
    } catch (err) {
      alert("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.readBy.includes(user?._id)).length;
  const pathnames = location.pathname.split('/').filter(x => x);

  const formatName = (str) => {
    if (str.length > 20 && !str.includes('-')) return 'Detail';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <>
      <nav className="sp-topnav">
        <div className="topnav-left">
          <div className="topnav-breadcrumbs">
            <button onClick={() => navigate('/dashboard')} className="breadcrumb-icon-btn" title="Dashboard">
              <Home size={15} strokeWidth={2.5} />
            </button>
            
            {pathnames.length > 0 && <ChevronRight size={14} className="breadcrumb-sep" />}
            
            {pathnames.map((val, idx) => {
              const isLast = idx === pathnames.length - 1;
              const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
              const name = formatName(val);
              
              return (
                <React.Fragment key={to}>
                  <button 
                    onClick={() => !isLast && navigate(to)}
                    className={`breadcrumb-text ${isLast ? 'active' : ''}`}
                    disabled={isLast}
                  >
                    {name}
                  </button>
                  {!isLast && <ChevronRight size={14} className="breadcrumb-sep" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="topnav-right">
          {/* SEARCH BOX */}
          <div className="topnav-search-container" ref={searchRef}>
            <div className={`topnav-search ${isSearchOpen ? 'active' : ''}`}>
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery.length >= 2 && setIsSearchOpen(true)}
              />
              <div className="search-shortcut">⌘K</div>
            </div>
            
            {isSearchOpen && (
              <div className="topnav-dropdown search-dropdown animate-fade-in-down">
                {searchResults.events.length === 0 && searchResults.users.length === 0 ? (
                  <div className="dropdown-empty">No results found for "{searchQuery}"</div>
                ) : (
                  <>
                    {searchResults.events.length > 0 && (
                      <div className="search-section">
                        <h4><CalendarIcon size={12} /> Events</h4>
                        {searchResults.events.map(ev => (
                          <div key={ev._id} className="search-result-item" onClick={() => { navigate(isAdmin ? `/admin/events/${ev.slug}` : `/events/${ev.slug}`); setIsSearchOpen(false); }}>
                            <div className="search-res-title">{ev.title}</div>
                            <div className="search-res-sub">{ev.type} • {ev.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.users.length > 0 && (
                      <div className="search-section">
                        <h4><Users size={12} /> Users</h4>
                        {searchResults.users.map(u => (
                          <div key={u._id} className="search-result-item" onClick={() => setIsSearchOpen(false)}>
                            <div className="search-res-title">{u.name}</div>
                            <div className="search-res-sub">{u.email} • {u.role}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* NOTIFICATIONS */}
          <div className="topnav-notif-container" ref={notifRef}>
            <button className="topnav-icon-btn" onClick={() => setIsNotifOpen(!isNotifOpen)}>
              <Bell size={16} />
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>
            
            {isNotifOpen && (
              <div className="topnav-dropdown notif-dropdown animate-fade-in-down">
                <div className="dropdown-header">
                  <h3>Notifications {unreadCount > 0 && <span>({unreadCount})</span>}</h3>
                  {isAdmin && (
                    <button className="btn btn-ghost btn-xs" onClick={() => { setIsNotifOpen(false); setShowAdminModal(true); }}>
                      <Plus size={12} /> New
                    </button>
                  )}
                </div>
                
                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="dropdown-empty">You're all caught up!</div>
                  ) : (
                    notifications.map(n => {
                      const isUnread = !n.readBy.includes(user?._id);
                      return (
                        <div key={n._id} className={`notif-item ${isUnread ? 'unread' : ''}`} onClick={() => isUnread && markAsRead(n._id)}>
                          <div className={`notif-icon ${n.type}`}>
                            {n.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                          </div>
                          <div className="notif-content">
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-message">{n.message}</div>
                            <div className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                          </div>
                          {isUnread && <div className="unread-dot"></div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ADMIN NOTIFICATION MODAL */}
      {showAdminModal && isAdmin && createPortal(
        <div className="sp-modal-backdrop" onClick={() => setShowAdminModal(false)}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--clr-text-heading)' }}>
              Send Broadcast Notification
            </h2>
            <form onSubmit={handleSendNotification} className="form-group" style={{ gap: '12px' }}>
              <div>
                <label className="form-label">Title</label>
                <input type="text" className="form-input" required value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} placeholder="e.g., System Maintenance" />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea className="form-textarea" required value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} placeholder="Details..."></textarea>
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-select" value={newNotif.type} onChange={e => setNewNotif({...newNotif, type: e.target.value})}>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error / Urgent</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdminModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSending}>
                  {isSending ? 'Sending...' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TopNav;
