import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../config';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  History,
  FileText,
  UserCheck,
  LogOut,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Shield,
  BarChart3,
  Bell,
  Settings,
  BookOpen,
  ClipboardList,
  Award,
  Scan,
  FolderOpen,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Video,
  CalendarSync,
  UsersRound,
  UserPlus,
  PieChart,
  Ban,
  ShieldOff,
  FilePlus,
  FileSearch,
  ClipboardCheck,
  TicketCheck,
  BarChart2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import './Sidebar.css';

const NAV_STRUCTURE = (role) => {
  const isAdmin = ['superadmin', 'admin_t1', 'admin_t2'].includes(role);
  const isSuperAdmin = role === 'superadmin';

  return [
    // ── User section ──
    {
      section: null,
      items: [
        { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: '/events', label: 'Events', icon: Calendar },
        { key: '/feedback', label: 'Feedback', icon: MessageSquare },
      ],
    },
    // ── Admin section ──
    ...(isAdmin ? [{
      section: 'Administration',
      items: [
        {
          key: '/admin/dashboard',
          label: 'Overview',
          icon: BarChart3,
          sub: [
            { key: '/admin/dashboard', label: 'Dashboard', icon: BarChart2 },
            { key: '/admin/dashboard?action=schedule-meet', label: 'Schedule a Meet', icon: Video },
            { key: '/admin/dashboard?action=sync-calendar', label: 'Sync Calendar', icon: CalendarSync },
          ],
        },
        ...(isSuperAdmin ? [{
          key: '/admin/team',
          label: 'Team Management',
          icon: Shield,
          sub: [
            { key: '/admin/team', label: 'All Teams', icon: UsersRound },
            { key: '/admin/team?action=create', label: 'Create Group', icon: UserPlus },
          ],
        }] : []),
        {
          key: '/admin/events',
          label: 'Manage Events',
          icon: Calendar,
          sub: [
            { key: '/admin/events', label: 'All Events' },
            { key: '/admin/events?tab=attendance', label: 'Attendance' },
            { key: '/admin/events?tab=evaluators', label: 'Evaluators' },
            { key: '/admin/events?tab=winners', label: 'Winners Board' },
          ],
        },
        {
          key: '/admin/users',
          label: 'Manage Users',
          icon: Users,
          sub: [
            { key: '/admin/users', label: 'All Users' },
            { key: '/admin/users?action=create', label: 'Create User', icon: UserPlus },
            { key: '/admin/users?tab=analytics', label: 'Analytics', icon: PieChart },
          ],
        },
        {
          key: '/admin/audit',
          label: 'Audit Logs',
          icon: History,
          sub: [
            { key: '/admin/audit', label: 'All Logs' },
            { key: '/admin/audit?tab=restrictions', label: 'User Restrictions', icon: ShieldOff },
            { key: '/admin/audit?tab=restrict-ops', label: 'Restrict Operation', icon: Ban },
          ],
        },
        {
          key: '/admin/feedback',
          label: 'Feedback',
          icon: ClipboardList,
          sub: [
            { key: '/admin/feedback', label: 'All Feedback' },
            { key: '/admin/feedback?tab=review', label: 'Pending Review', icon: ClipboardCheck },
          ],
        },
        {
          key: '/admin/documents',
          label: 'Documents',
          icon: FolderOpen,
          sub: [
            { key: '/admin/documents', label: 'All Documents' },
            { key: '/admin/documents?action=new', label: 'New Document', icon: FilePlus },
            { key: '/admin/documents?tab=approvals', label: 'Approvals', icon: TicketCheck },
          ],
        },
      ],
    }] : []),
    // ── Misc ──
    {
      section: 'General',
      items: [
        { key: '/edit-profile', label: 'My Profile', icon: UserCheck },
        { key: '/settings', label: 'Settings', icon: Settings },
        { key: '/help', label: 'Help & Support', icon: HelpCircle },
      ],
    },
  ];
};


const Sidebar = ({ user, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // collapsed = icon-only rail; open = full expanded (mobile drawer too)
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubs, setOpenSubs] = useState({});
  const [serverStatus, setServerStatus] = useState('online');
  const sidebarRef = useRef(null);

  // Sync collapsed state with AppLayout
  useEffect(() => {
    onCollapse?.(collapsed);
    // update CSS var so main content shifts correctly
    document.documentElement.style.setProperty('--sb-width', collapsed ? '64px' : '260px');
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (mobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [mobileOpen]);

  // isActive: compare pathname only (strip ?query from key for pathname check)
  const isActive = (key) => {
    const keyPath = key.split('?')[0];
    const keySearch = key.includes('?') ? key.split('?')[1] : null;
    if (keyPath === '/dashboard') return location.pathname === '/dashboard' && !keySearch;
    // For sub-items with query params: match both path + search params
    if (keySearch) {
      return location.pathname.startsWith(keyPath) && location.search === `?${keySearch}`;
    }
    // For items without query params: match path but NOT if currently on a deeper query
    return location.pathname.startsWith(keyPath) && !location.search;
  };

  // handleNavigation: navigate to full URL (supports ?query strings)
  const handleNavigation = (key) => {
    const [path, search] = key.split('?');
    navigate({ pathname: path, search: search ? `?${search}` : '' });
  };

  const toggleSub = (key) => setOpenSubs((prev) => ({ ...prev, [key]: !prev[key] }));

  const formatRole = (role) => {
    const map = { superadmin: 'Super Admin', admin_t1: 'Admin T1', admin_t2: 'Admin T2', mentor: 'Mentor', user: 'Student' };
    return map[role] || role || 'Student';
  };

  const handleLogout = () => { window.location.href = `${API_URL}/api/auth/logout`; };

  const [isHovered, setIsHovered] = useState(false);

  const navStructure = NAV_STRUCTURE(user?.role);

  const effectivelyCollapsed = collapsed && !isHovered;

  // Always keep labels mounted so CSS can animate them smoothly!
  const showLabels = true;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-mobile-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Mobile hamburger toggle (only shows on small screens) */}
      <button
        className="sb-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <PanelLeftOpen size={20} />
      </button>

      <aside
        ref={sidebarRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`sp-sidebar ${effectivelyCollapsed ? 'sp-collapsed' : ''} ${mobileOpen ? 'sp-mobile-open' : ''} ${collapsed && isHovered ? 'sp-hover-expanded' : ''}`}
      >
        {/* ── Logo + collapse toggle ── */}
        <div className="sb-logo-row">
          <div className="sb-logo" onClick={() => navigate('/dashboard')} title="Spectrum">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            {showLabels && <span className="sb-logo-text">Spectrum</span>}
          </div>

          {/* Desktop collapse toggle */}
          <button
            className="sb-collapse-btn desktop-only"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>

          {/* Mobile close button */}
          <button
            className="sb-collapse-btn mobile-only"
            onClick={() => setMobileOpen(false)}
            title="Close sidebar"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="sb-nav">
          {navStructure.map((group, gi) => (
            <div key={gi} className="sb-group">
              {group.section && showLabels && (
                <div className="sb-section-label">{group.section}</div>
              )}
              {!showLabels && group.section && (
                <div className="sb-section-divider" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.key);
                const hasSub = item.sub?.length > 0;
                const subOpen = openSubs[item.key];

                return (
                  <div key={item.key} className="sb-item-wrap">
                    <button
                      className={`sb-item ${active ? 'active' : ''} ${hasSub ? 'has-sub' : ''}`}
                      onClick={() => {
                        if (hasSub) {
                          if (!collapsed) toggleSub(item.key);
                          else { setCollapsed(false); toggleSub(item.key); }
                        } else {
                          handleNavigation(item.key);
                        }
                      }}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sb-item-left">
                        <Icon size={17} className="sb-icon" />
                        {showLabels && <span className="sb-label">{item.label}</span>}
                      </span>
                      {showLabels && hasSub && (
                        <span className="sb-chevron">
                          {subOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                      )}
                      {showLabels && item.badge !== undefined && item.badge !== null && (
                        <span className="sb-badge">{item.badge}</span>
                      )}

                      {/* Tooltip in collapsed mode */}
                      {collapsed && (
                        <span className="sb-tooltip">{item.label}</span>
                      )}
                    </button>

                    {/* Sub items */}
                    {hasSub && showLabels && subOpen && (
                      <div className="sb-sub-list">
                        {item.sub.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.key}
                              className={`sb-sub-item ${isActive(sub.key) ? 'active' : ''}`}
                              onClick={() => handleNavigation(sub.key)}
                            >
                              {SubIcon
                                ? <SubIcon size={13} className="sb-sub-icon" />
                                : <span className="sb-sub-dot" />}
                              <span className="sb-sub-label">{sub.label}</span>
                              {sub.badge != null && (
                                <span className="sb-badge">{sub.badge}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Sub tooltip in collapsed mode */}
                    {hasSub && collapsed && (
                      <div className="sb-sub-tooltip">
                        <div className="sb-sub-tooltip-title">{item.label}</div>
                        {item.sub.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <button
                              key={sub.key}
                              className={`sb-sub-tooltip-item ${isActive(sub.key) ? 'active' : ''}`}
                              onClick={() => handleNavigation(sub.key)}
                            >
                              {SubIcon && <SubIcon size={13} style={{ flexShrink: 0, opacity: 0.7 }} />}
                              {sub.label}
                              {sub.badge != null && <span className="sb-badge">{sub.badge}</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="sb-footer">
          {user && (
            <button
              className="sb-user-card"
              onClick={() => navigate('/edit-profile')}
              title={collapsed ? `${user.name || user.email} · ${formatRole(user.role)}` : undefined}
            >
              <div className="sb-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="avatar" />
                ) : (
                  (user.name || 'U').substring(0, 2).toUpperCase()
                )}
              </div>
              {showLabels && (
                <div className="sb-user-info">
                  <span className="sb-user-name">{user.name || user.email}</span>
                  <span className="sb-user-role">{formatRole(user.role)}</span>
                </div>
              )}
              {showLabels && (
                <button
                  className="sb-logout-btn"
                  onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              )}
              {collapsed && <span className="sb-tooltip">{user.name || user.email}</span>}
            </button>
          )}

          <div className={`sb-status ${showLabels ? '' : 'icon-only'}`} title={collapsed ? 'System Online' : undefined}>
            <div className={`sb-status-dot ${serverStatus}`} />
            {showLabels && (
              <>
                <span className="sb-status-text">
                  {serverStatus === 'online' ? 'System Online' : serverStatus === 'offline' ? 'Offline' : 'Checking...'}
                </span>
                <button
                  className="sb-refresh-btn"
                  onClick={() => { setServerStatus('checking'); setTimeout(() => setServerStatus('online'), 600); }}
                >
                  <RefreshCw size={11} />
                </button>
              </>
            )}
            {collapsed && <span className="sb-tooltip">System Online</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
