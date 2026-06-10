import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import AttendanceScanner from './AttendanceScanner';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, Clock, Users, MapPin } from 'lucide-react';
import './EventDetails.css';
import './EventsList.css';
import Loader from './Loader';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [isLeader, setIsLeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [usersList, setUsersList] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [subEvents, setSubEvents] = useState([]);

  const [teamName, setTeamName] = useState('');
  const [selectedTeammates, setSelectedTeammates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('event');
  const [showScanner, setShowScanner] = useState(false);
  const [showCheckinQR, setShowCheckinQR] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // Fetch Event details
      const res = await axios.get(`${API_URL}/api/events/${id}`, { withCredentials: true });
      if (res.data.success) {
        setEventData(res.data.event);
        if (res.data.event && res.data.event.title) {
          document.title = `${res.data.event.title} | Spectrum`;
        }
        setRegistration(res.data.registration || null);
        setIsLeader(res.data.isLeader || false);
        if (res.data.registration?.teamName) {
          setTeamName(res.data.registration.teamName);
        }
      }

      // Fetch all events to extract sub-events
      const allRes = await axios.get(`${API_URL}/api/events`, { withCredentials: true });
      if (allRes.data.success && res.data.event) {
        const subs = allRes.data.events.filter(e => e.parentEvent === res.data.event._id);
        setSubEvents(subs);
      }

      // Fetch current User
      const userRes = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      if (userRes.data.success) {
        setCurrentUser(userRes.data.user);
      }

      // Fetch all eligible users
      if (res.data.event) {
        const usersRes = await axios.get(`${API_URL}/api/events/data/users?eventId=${res.data.event._id}`, { withCredentials: true });
        if (usersRes.data.success) {
          setUsersList(usersRes.data.users);
        }
      }

    } catch (err) {
      if (err.response?.status === 404) {
        setError('Event not found.');
      } else {
        setError('Failed to load event details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Team name is always required
    if (!teamName.trim()) {
      setStatusMessage({ text: 'Please enter a team name before registering.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatusMessage({ text: 'Registering...', type: 'info' });

    try {
      let regResult = registration;
      if (!regResult) {
        // Pass selectedTeammates as members to the registration endpoint
        const res = await axios.post(`${API_URL}/api/events/${id}/register`, {
          teamName,
          members: selectedTeammates
        }, { withCredentials: true });

        if (res.data.success) {
          regResult = res.data.registration;
          setRegistration(regResult);
          setIsLeader(true);
          setStatusMessage({ text: 'Successfully registered for the event!', type: 'success' });
          fetchDetails();
          setSelectedTeammates([]);
          setSearchTerm('');
        }
      } else {
        // If already registered and just adding more teammates (if allowed)
        setStatusMessage({ text: 'Adding teammates...', type: 'info' });
        for (const teammateId of selectedTeammates) {
          try {
            await axios.post(`${API_URL}/api/events/${id}/teammates`, { teammateId }, { withCredentials: true });
          } catch (tErr) {
            console.error("Failed to add teammate:", teammateId, tErr);
          }
        }
        setStatusMessage({ text: 'Team updated successfully!', type: 'success' });
        fetchDetails();
        setSelectedTeammates([]);
        setSearchTerm('');
      }
    } catch (err) {
      setStatusMessage({ text: err.response?.data?.message || 'Failed to register', type: 'error' });
    } finally {
      // Intentionally keep loading state slightly longer for smooth transition
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
      }, 500);
    }
  };

  const handleTeammateAdd = (teammateId) => {
    if (!selectedTeammates.includes(teammateId)) {
      setSelectedTeammates([...selectedTeammates, teammateId]);
      setSearchTerm(''); // clear search after selection
    }
  };

  const removeSelectedTeammate = (teammateId) => {
    setSelectedTeammates(selectedTeammates.filter(id => id !== teammateId));
  };

  const handleRemoveRegisteredTeammate = async (teammateId) => {
    if (!window.confirm("Remove this teammate?")) return;
    try {
      setLoading(true);
      setStatusMessage({ text: 'Removing teammate...', type: 'info' });
      await axios.post(`${API_URL}/api/events/${id}/teammates/remove`, { teammateId }, { withCredentials: true });
      fetchDetails();
    } catch (err) {
      alert("Failed to remove teammate.");
      setLoading(false);
    }
  };

  const handleUpdateTeamName = async () => {
    if (!teamName.trim()) {
      setStatusMessage({ text: 'Team name cannot be empty.', type: 'error' });
      return;
    }
    if (teamName.trim() === registration.teamName) {
      setIsEditingTeamName(false);
      return;
    }

    try {
      setLoading(true);
      setStatusMessage({ text: 'Updating team name...', type: 'info' });
      const res = await axios.put(`${API_URL}/api/events/${id}/teamName`, { teamName }, { withCredentials: true });
      if (res.data.success) {
        setStatusMessage({ text: 'Team name updated successfully!', type: 'success' });
        setRegistration(prev => ({ ...prev, teamName: res.data.teamName }));
        setIsEditingTeamName(false);
      }
    } catch (err) {
      setStatusMessage({ text: err.response?.data?.message || 'Failed to update team name', type: 'error' });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 5000);
      }, 500);
    }
  };

  if (loading && !eventData) return <Loader fullScreen={true} text="Loading Event..." />;

  if (error) {
    return (
      <div className="event-error-page">
        <h2>{error}</h2>
        <button onClick={() => navigate('/dashboard')} className="btn-return">Return to Dashboard</button>
      </div>
    );
  }

  // Intercept and render a dedicated page for Macro events (Containers)
  if (eventData && eventData.eventType === 'macro') {
    return (
      <div className="el-wrapper" style={{ minHeight: '100vh', background: '#090d16' }}>
        {/* Nav */}
        <nav className="el-nav">
          <button className="el-nav-back" onClick={() => navigate('/events')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            All Events
          </button>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#fff', letterSpacing: '-0.01em' }}>
            {eventData.title}
          </span>
          <div style={{ width: 90 }} />
        </nav>

        {/* Content */}
        <div className="el-content" style={{ padding: '2rem 1.5rem 4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Dynamic Hero banner with the Macro Event Title */}
          <header className="el-hero animate-fade-in" style={{ textAlign: 'center', marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="el-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '1rem' }}>
              ⚡ Flagship Campaign Container
            </span>
            <h1 className="el-hero-title" style={{ fontSize: '3rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', margin: '0 0 1rem 0', textTransform: 'uppercase', background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {eventData.title}
            </h1>
            <p className="el-hero-subtitle" style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '700px', lineHeight: '1.6', margin: 0 }}>
              {eventData.description}
            </p>
          </header>

          {/* Sub-events program header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Micro/Sub-Events ({subEvents.length})
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              📅 {eventData.noOfDays && eventData.noOfDays > 1 ? (
                <span>
                  {eventData.noOfDays} Days: {(eventData.dates || []).map(d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).join(', ')}
                </span>
              ) : (
                <span>
                  Date: {new Date(eventData.date || eventData.dates?.[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </span>
          </div>

          {/* Sub-events grid layout */}
          {subEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>No sub-events scheduled yet</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Check back later to register for micro-events under this flagship.</p>
            </div>
          ) : (
            <div className="el-grid">
              {subEvents.map((sub, i) => (
                <div 
                  key={sub._id}
                  className={`el-card-premium animate-fade-in-up stagger-${Math.min(i + 1, 5)}`}
                  onClick={() => {
                    navigate(`/events/${sub._id}`);
                    window.scrollTo(0, 0);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Image */}
                  <div className="el-card-image-wrap">
                    <div className="el-card-session-badge">
                      {sub.session && sub.session !== 'none' ? `${sub.session} Session` : 'General'}
                    </div>
                    <div className="el-card-date-badge">
                      <span className="el-date-d">{new Date(sub.date).getDate()}</span>
                      <span className="el-date-m">{new Date(sub.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <img src={sub.imageUrl || '/hero.png'} alt="Event Cover" className="el-card-cover" />
                    <div className="el-card-image-overlay" />
                  </div>

                  {/* Body */}
                  <div className="el-card-body">
                    <div className="el-reg-badge" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {sub.isRegistrationOpen !== false
                        ? <span className="badge badge-success">Open</span>
                        : <span className="badge badge-danger">Closed</span>
                      }
                      <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        Micro Event
                      </span>
                      {sub.category && sub.category !== 'None' && (
                        <span className="badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                          {sub.category}
                        </span>
                      )}
                    </div>
                    <h3 className="el-card-title">{sub.title}</h3>
                    <p className="el-card-desc">
                      {sub.description && sub.description.length > 90 ? sub.description.slice(0, 90) + '…' : sub.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="el-card-footer">
                    <div className="el-card-meta">
                      <div className="meta-icon-group">
                        <span>📍 {sub.location}</span>
                      </div>
                      <div className="meta-icon-group">
                        <span style={{ color: 'var(--clr-accent)', fontWeight: '700' }}>Register Now →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentMembersCount = registration ? registration.members.length : 1;
  const totalSlots = eventData.teamSizeLimit;
  const availableInviteSlots = totalSlots - currentMembersCount - selectedTeammates.length;

  const filteredUsers = searchTerm.trim() === '' ? [] : usersList.filter(u => {
    const isRegInCurrentTeam = registration?.members.some(m => m.user?._id === u._id);
    const isSelected = selectedTeammates.includes(u._id);

    // Hide if already in current team or already selected or is current user
    if (isRegInCurrentTeam || isSelected || u._id === currentUser?._id) return false;

    const searchLower = searchTerm.toLowerCase();
    return (u?.name || '').toLowerCase().includes(searchLower) || (u?.registerNumber && u.registerNumber.toLowerCase().includes(searchLower));
  }).slice(0, 5);

  return (
    <div className="event-page-wrapper">
      {/* Attendance Scanner Modal */}
      {showScanner && (
        <div
          className="db-scanner-overlay"
          onClick={(e) => {
            if (e.target.className === 'db-scanner-overlay') setShowScanner(false);
          }}
        >
          <div>
            <AttendanceScanner
              eventId={id}
              onComplete={(msg) => {
                setShowScanner(false);
                fetchDetails();
              }}
              onCancel={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {loading && <Loader fullScreen={true} text={statusMessage.text || "Processing..."} />}

      {/* Top Banner Section */}
      <section className="event-top-section">
        <div className="event-top-content">
          <div className="event-brand">SPECTRUM</div>
          <div className="event-top-grid">

            <div className="event-info-left">
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span className="tag-technical" style={{ textTransform: 'capitalize' }}>
                  {eventData.eventType === 'macro' ? 'Flagship Container' : eventData.category && eventData.category !== 'None' ? eventData.category : 'General'}
                </span>
                {eventData.eventType === 'macro' && (
                  <span className="tag-technical" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
                    Macro Event
                  </span>
                )}
                {eventData.eventType === 'internal' && (
                  <span className="tag-technical" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    Internal Restricted
                  </span>
                )}
              </div>
              <h1>{eventData.title}</h1>
              <p className="event-short-desc">
                {eventData.description && eventData.description.length > 200 ? eventData.description.substring(0, 200) + '...' : eventData.description}
              </p>

              <div className="event-meta-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className="meta-item">
                  <span className="meta-icon"><Calendar size={18} /></span>
                  {new Date(eventData.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="meta-item">
                  <span className="meta-icon"><Clock size={18} /></span>
                  {eventData.session ? (
                    eventData.session.toLowerCase().includes('morning') ? '9:00 AM - 1:00 PM' : 
                    eventData.session.toLowerCase().includes('afternoon') ? '1:00 PM - 4:30 PM' : 
                    'Time TBA'
                  ) : 'Time TBA'}
                </div>
                {eventData.eventType === 'macro' ? (
                  <div className="meta-item">
                    <span className="meta-icon"><Users size={18} /></span>
                    Sub-events: {subEvents.length} / {eventData.macroCountLimit || 5}
                  </div>
                ) : (
                  <div className="meta-item">
                    <span className="meta-icon"><Users size={18} /></span>
                    Max Team Size: {eventData.teamSizeLimit}
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-icon"><MapPin size={18} /></span>
                  {eventData.location}
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button 
                  className="btn btn-accent" 
                  onClick={() => navigate(`/events/${id}/winners`)}
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none', boxShadow: '0 4px 15px rgba(79, 209, 197, 0.4)' }}
                >
                  🏆 View Winners Board
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Bottom Content Section */}
      <section className="event-bottom-section">
        <div className="event-bottom-content">

          <div className="event-details-left">
            {eventData.eventType !== 'macro' && (
              <div className="tabs-container">
                <button className={`tab ${activeTab === 'event' ? 'active-tab' : 'inactive-tab'}`} onClick={() => setActiveTab('event')}>Event</button>
                <button className={`tab ${activeTab === 'attendance' ? 'active-tab' : 'inactive-tab'}`} onClick={() => setActiveTab('attendance')}>
                  Attendance
                  {eventData?.activeAttendance?.sessionToken && <span className="tab-pulse-dot"></span>}
                </button>
              </div>
            )}

            {activeTab === 'event' ? (
              <div className="tab-content glass-panel animate-fade-in">
                <h3>Event description :</h3>
                <p>{eventData.description}</p>

                <h3 className="rules-title">Rules and the regulations :</h3>
                <ul className="rules-list">
                  <li>One member must act as the team leader for communication purposes.</li>
                  <li>Teams once registered cannot be changed or replaced.</li>
                  <li>Participants must adhere strictly to the time limits given for each round.</li>
                  <li>Latecomers will not be permitted to participate and will be disqualified.</li>
                  <li>All participants must be present at the correct venue at least 15 minutes before the event starts.</li>
                  <li>Use of unfair means or plagiarism will lead to immediate disqualification.</li>
                  <li>Collaborations and joint participation are welcomed, provided all collaborating teams or individuals register officially.</li>
                  <li>All participants (Leaders and Teammates) must mark their own attendance via QR.</li>
                </ul>
              </div>
            ) : (
              <div className="tab-content glass-panel animate-fade-in">
                <div className="attendance-student-view">
                  <h3>Your Attendance Status</h3>

                  {/* Admin Scan Mode: Show Student QR */}
                  {(eventData?.attendanceMode === 'admin_scan' || eventData?.attendanceMode === 'both') && registration && (
                    <div className="admin-scan-box glass-strong mb-4" style={{ padding: '1rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                      <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--clr-text-muted)' }}>
                        Admin needs to scan your code? Click below:
                      </p>
                      <button className="btn btn-accent btn-sm" onClick={() => setShowCheckinQR(true)}>
                        🆔 Show My Check-in QR
                      </button>
                    </div>
                  )}

                  <div className="attendance-round-list">
                    {[...Array(eventData?.rounds || 0)].map((_, i) => {
                      const rNum = i + 1;
                      const attended = registration?.attendance?.find(a =>
                        a.round === rNum &&
                        (a.user._id || a.user).toString() === currentUser?._id?.toString()
                      );
                      return (
                        <div key={i} className="attendance-round-item glass">
                          <div className="round-info">
                            <span className="round-label">Round {rNum}</span>
                            <span className={`status-badge ${attended ? 'present' : 'absent'}`}>
                              {attended ? '✓ Present' : '✕ Absent'}
                            </span>
                          </div>
                          {attended && (
                            <small className="log-time">Logged at: {new Date(attended.timestamp).toLocaleString()}</small>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(eventData?.attendanceMode === 'student_scan' || eventData?.attendanceMode === 'both') && eventData?.activeAttendance?.sessionToken && (
                    <div className="checkin-prompt glass-strong animate-pulse-subtle">
                      <h4>Attendance Session Active</h4>
                      <p>Round {eventData.activeAttendance.round} is now accepting check-ins.</p>
                      <button className="btn btn-primary btn-block" onClick={() => setShowScanner(true)}>
                        📷 Click to Scan QR Code
                      </button>
                    </div>
                  )}
                </div>

                {/* Student Check-in QR Modal */}
                {showCheckinQR && (
                  <div className="db-scanner-overlay" onClick={() => setShowCheckinQR(false)}>
                    <div className="qr-modal-content glass-strong" onClick={e => e.stopPropagation()} style={{ padding: '2rem', borderRadius: '24px', textAlign: 'center', maxWidth: '320px', margin: 'auto' }}>
                      <h3 style={{ marginBottom: '0.5rem' }}>Your Check-in QR</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: '1.5rem' }}>
                        Show this to the event admin to mark your attendance.
                      </p>
                      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <QRCodeCanvas
                          value={JSON.stringify({ type: 'participant', registrationId: registration._id, eventId: eventData._id })}
                          size={200}
                          level="H"
                        />
                      </div>
                      <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ fontWeight: '700', marginBottom: '2px' }}>{registration.teamName}</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Team ID: {registration._id.substring(0, 8)}</p>
                      </div>
                      <button className="btn btn-ghost btn-block mt-4" onClick={() => setShowCheckinQR(false)}>Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="event-registration-right">
            {eventData.eventType === 'macro' ? (
              <div className="registration-card glass-panel" style={{ textAlign: 'left' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Micro/Sub-Events</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1.25rem' }}>
                  This is a flagship Macro Event container. Choose and register for individual contests below:
                </p>
                {subEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
                    No sub-events scheduled yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {subEvents.map(sub => (
                      <div 
                        key={sub._id}
                        style={{
                          padding: '12px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{sub.title}</h4>
                        {sub.category && sub.category !== 'None' && (
                          <span style={{ fontSize: '0.725rem', color: 'var(--clr-accent)', fontWeight: '600' }}>
                            {sub.category}
                          </span>
                        )}
                        <button 
                          className="btn btn-accent btn-xs"
                          style={{ marginTop: '4px', width: 'fit-content' }}
                          onClick={() => {
                            navigate(`/events/${sub._id}`);
                            window.scrollTo(0, 0);
                          }}
                        >
                          View & Register →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="registration-card glass-panel">
                {isLeader && registration && (eventData?.title?.toLowerCase()?.includes('innovator') || eventData?.roundConfig?.some(r => r.evaluationType === 'jury')) && (
                  <div className="project-submission-prompt glass-strong" style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                    <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>🚀 Project Submission</h4>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', lineHeight: '1.4' }}>
                      Team Leader: Please provide your project's problem statement, solution, and impact details for the jury.
                    </p>
                    <button type="button" className="btn btn-accent btn-block btn-sm" onClick={() => navigate(`/events/${id}/project-submission`)}>
                      Manage Project Details
                    </button>
                  </div>
                )}
                <h2>Registration Form</h2>

                {statusMessage.text && statusMessage.type && (
                  <div className={`form-alert ${statusMessage.type}`}>
                    {statusMessage.text}
                  </div>
                )}

                <form className="reg-form" onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={currentUser?.name || ''} disabled className="disabled-input" />
                  </div>
                  <div className="form-group">
                    <label>E-Mail:</label>
                    <input type="text" value={currentUser?.email || ''} disabled className="disabled-input" />
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Phone:</label>
                      <input type="text" value={currentUser?.mobile || 'Not Provided'} disabled className="disabled-input" />
                    </div>
                    <div className="form-group half">
                      <label>Dept:</label>
                      <input type="text" value={currentUser?.department || 'Not Provided'} disabled className="disabled-input" />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group half">
                      <label>Class:</label>
                      <input type="text" value={(currentUser?.year && currentUser?.section) ? `${currentUser.year} - ${currentUser.section}` : 'Not Provided'} disabled className="disabled-input" />
                    </div>
                    <div className="form-group half">
                      <label>Roll No:</label>
                      <input type="text" value={currentUser?.registerNumber || 'Not Provided'} disabled className="disabled-input" />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ marginBottom: 0 }}>Team Name :</label>
                      {!!registration && isLeader && eventData?.isTeamChangeAllowed !== false && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditingTeamName) {
                              handleUpdateTeamName();
                            } else {
                              setIsEditingTeamName(true);
                            }
                          }}
                          className="btn-edit-team-name"
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--clr-accent-2)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            padding: '4px 12px',
                            borderRadius: '99px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {isEditingTeamName ? 'Save' : 'Edit'}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your Team name (Required)"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      disabled={!!registration && !isEditingTeamName}
                      required={totalSlots > 1}
                      className="team-name-input"
                    />
                  </div>

                  {totalSlots > 1 && (
                    <div className="form-group teammates-group">
                      <div className="teammates-header">
                        <label>Teammates</label>
                        <span className="slots-badge">{currentMembersCount + selectedTeammates.length}/{totalSlots} Filled</span>
                      </div>

                      {/* Active / Registered Members */}
                      <div className="teammates-list">
                        <div
                          className="teammate-row owner"
                          onClick={() => navigate(`/profile/${currentUser?._id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <span>{currentUser?.registerNumber} - {currentUser?.name} (You)</span>
                        </div>
                        {registration?.members.map(member => {
                          if (member.user?._id === currentUser?._id) return null;
                          return (
                            <div
                              key={member.user?._id || Math.random()}
                              className="teammate-row registered"
                            >
                              <span
                                onClick={() => navigate(`/profile/${member.user?._id}`)}
                                style={{ cursor: 'pointer', flex: 1 }}
                              >
                                {member.user?.registerNumber} - {member.user?.name}
                              </span>
                              {isLeader && eventData?.isTeamChangeAllowed !== false && (
                                <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveRegisteredTeammate(member.user?._id); }}>✕</button>
                              )}
                            </div>
                          )
                        })}

                        {/* Selected (Pre-registration) Members */}
                        {selectedTeammates.map(tId => {
                          const u = usersList.find(u => u._id === tId);
                          return (
                            <div key={tId} className="teammate-row pending">
                              <span
                                onClick={() => navigate(`/profile/${tId}`)}
                                style={{ cursor: 'pointer', flex: 1 }}
                              >
                                {u?.registerNumber} - {u?.name} <span className="pending-tag">Pending</span>
                              </span>
                              {eventData?.isTeamChangeAllowed !== false && (
                                <button type="button" className="remove-btn" onClick={(e) => { e.stopPropagation(); removeSelectedTeammate(tId); }}>✕</button>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Add Teammate UI */}
                      {availableInviteSlots > 0 && (!registration || isLeader) && eventData?.isTeamChangeAllowed !== false && (
                        <div className="add-teammate-wrapper">
                          <label className="sub-label">Add Teammate (Search by Roll No or Name)</label>
                          <input
                            type="text"
                            className="teammate-search-input"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <p className="search-info-msg" style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                            * Users should be signed up on our platform to be listed.
                          </p>
                          {searchTerm.trim() !== '' && (
                            <div className="search-results-dropdown">
                              {filteredUsers.length > 0 ? (
                                filteredUsers.map(u => (
                                  <div
                                    key={u._id}
                                    className={`search-result-item ${u.isAlreadyRegistered ? 'already-registered' : ''}`}
                                    onClick={() => !u.isAlreadyRegistered && handleTeammateAdd(u._id)}
                                    style={u.isAlreadyRegistered ? { cursor: 'not-allowed', opacity: 0.8 } : {}}
                                  >
                                    <div className="user-info">
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <strong>{u.registerNumber}</strong>
                                        {u.isAlreadyRegistered && (
                                          <span style={{
                                            fontSize: '0.7rem',
                                            background: u.registrationStatus?.includes('Same Session') ? '#fff7ed' : '#fee2e2',
                                            color: u.registrationStatus?.includes('Same Session') ? '#c2410c' : '#dc2626',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontWeight: '600',
                                            border: `1px solid ${u.registrationStatus?.includes('Same Session') ? '#ffedd5' : '#fecaca'}`
                                          }}>
                                            {u.registrationStatus || 'Already Registered'}
                                          </span>
                                        )}
                                      </div>
                                      <span>{u.name}</span>
                                    </div>
                                    <button type="button" className="add-btn" disabled={u.isAlreadyRegistered}>
                                      {u.isAlreadyRegistered ? '✕' : '+'}
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="search-result-empty">No eligible users found</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-actions">
                    {!registration && (
                      <button type="submit" className="btn-register" disabled={loading || eventData?.isRegistrationOpen === false || availableInviteSlots > 0 || !teamName.trim()}>
                        {eventData?.isRegistrationOpen === false
                          ? 'Registrations Closed'
                          : availableInviteSlots > 0
                            ? `Select ${availableInviteSlots} more teammate(s)`
                            : !teamName.trim()
                              ? 'Enter a Team Name to Register'
                              : 'REGISTER NOW'}
                      </button>
                    )}
                    {registration && isLeader && availableInviteSlots >= 0 && selectedTeammates.length > 0 && (
                      <button type="submit" className="btn-register update" disabled={loading || eventData?.isTeamChangeAllowed === false || availableInviteSlots > 0}>
                        {eventData?.isTeamChangeAllowed === false
                          ? 'Team Modifications Locked'
                          : availableInviteSlots > 0
                            ? `Select ${availableInviteSlots} more teammate(s) to update`
                            : 'UPDATE TEAM'}
                      </button>
                    )}
                    {registration && (!isLeader || (availableInviteSlots === 0 && selectedTeammates.length === 0)) && (
                      <button type="button" className="btn-register success" disabled>
                        ✓ TEAM FILLED & REGISTERED
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default EventDetails;
