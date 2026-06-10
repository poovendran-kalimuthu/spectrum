import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Search, Bell, Book, Video, Calendar as CalIcon, MessageSquare, Plus, ArrowRight, ArrowUpRight } from 'lucide-react';
import './MentorDashboard.css';

const MentorDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Example data since we don't have a fully populated mentee endpoint yet
  // We will simulate fetching the mentees assigned to this mentor.
  useEffect(() => {
    const fetchMentees = async () => {
      try {
        // Fetch users who have this mentor assigned
        const res = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
        if (res.data.success) {
          const myMentees = res.data.users.filter(u => 
            u.assignedMentor && (u.assignedMentor._id === user._id || u.assignedMentor === user._id)
          );
          setMentees(myMentees.slice(0, 3)); // Show top 3
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentees();
  }, [user._id]);

  // Dummy activity data for the bar chart
  const activityData = [
    { day: 'Mon', hours: 4, active: false },
    { day: 'Tue', hours: 6, active: false },
    { day: 'Wed', hours: 8, active: true }, // Max / active
    { day: 'Thu', hours: 5, active: false },
    { day: 'Fri', hours: 7, active: false },
    { day: 'Sat', hours: 3, active: false },
    { day: 'Sun', hours: 2, active: false },
  ];

  // Calendar setup
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dates = [6, 7, 8, 9, 10, 11, 12]; // Example week
  const activeDate = 9;

  return (
    <div className="md-wrapper animate-fade-in">
      {/* Header */}
      <header className="md-header">
        <div className="md-welcome">
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'Mentor'}</h1>
          <p>Track your mentees, monitor progress & schedule sessions</p>
        </div>
        
        <div className="md-header-right">
          <div className="md-search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search mentees or sessions..." />
          </div>
          
          <button className="md-profile-btn" onClick={() => navigate('/edit-profile')}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" />
            ) : (
              <span style={{ fontWeight: 'bold', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                {(user?.name || 'M').charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="md-grid">
        
        {/* Left Column */}
        <div className="md-col-left" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Your Mentees Card */}
          <div className="md-card">
            <div className="md-card-header">
              <h2 className="md-card-title">Your Mentees</h2>
              <button className="md-view-all" onClick={() => navigate('/events')}>View All</button>
            </div>
            
            <div className="md-mentee-list">
              {loading ? (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Loading mentees...</p>
              ) : mentees.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '16px' }}>
                  <span style={{ fontSize: '2rem', marginBottom: '8px', display: 'block' }}>🌱</span>
                  <h4 style={{ margin: '0 0 4px', color: '#334155' }}>No Mentees Yet</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Students will appear here once assigned.</p>
                </div>
              ) : (
                mentees.map((mentee, i) => {
                  const pct = Math.floor(Math.random() * 40) + 40; // Simulated progress 40-80%
                  const isPurple = i % 2 === 0;
                  return (
                    <div className="md-mentee-item" key={mentee._id}>
                      <div className="md-mentee-info">
                        <div className={`md-mentee-icon ${isPurple ? 'purple' : 'orange'}`}>
                          {isPurple ? <Book size={20} /> : <Video size={20} />}
                        </div>
                        <div className="md-mentee-details">
                          <h4>{mentee.name}</h4>
                          <p>{mentee.department} · Year {mentee.year}</p>
                        </div>
                      </div>
                      
                      <div className="md-mentee-meta">
                        <div className="md-mentee-time">
                          <span>Pending Task</span>
                          <strong>{Math.floor(Math.random() * 3) + 1}h {Math.floor(Math.random() * 59)}m</strong>
                        </div>
                        
                        <div className="md-progress-ring" style={{ '--pct': `${pct}%`, '--ring-color': isPurple ? '#9333ea' : '#ea580c' }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Hours Activity Card */}
          <div className="md-card">
            <div className="md-card-header">
              <h2 className="md-card-title">Mentorship Activity</h2>
              <select style={{ border: 'none', background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', color: '#4f46e5', fontWeight: '600', outline: 'none' }}>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            
            <div className="md-hours-chart">
              {activityData.map((d, i) => (
                <div className="md-chart-col" key={i}>
                  <div className="md-bar-wrap">
                    <div className={`md-bar ${d.active ? 'active' : ''}`} style={{ height: `${(d.hours / 10) * 100}%` }} />
                  </div>
                  <span className="md-chart-label" style={{ color: d.active ? '#0f172a' : '#94a3b8', fontWeight: d.active ? '700' : '500' }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="md-col-right" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Accent Card */}
          <div className="md-accent-card">
            <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', padding: '6px', backdropFilter: 'blur(4px)' }}>
              <ArrowUpRight size={18} />
            </div>
            <h3 className="md-accent-title">Host a Live Guidance Session</h3>
            <div className="md-accent-footer">
              <span className="md-discount">+15 XP points</span>
              <button className="md-join-btn">Schedule</button>
            </div>
          </div>

          {/* Daily Schedule (Mini Calendar & Classes) */}
          <div className="md-card">
            <div className="md-card-header" style={{ marginBottom: '1rem' }}>
              <h2 className="md-card-title">Daily Schedule</h2>
              <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <CalendarIcon size={18} />
              </button>
            </div>
            
            <div className="md-calendar-grid" style={{ marginBottom: '1.5rem' }}>
              {days.map((d, i) => <div key={i} className="md-cal-day">{d}</div>)}
              {dates.map((d, i) => (
                <div key={i} className={`md-cal-date ${d === activeDate ? 'active' : ''} ${d === 11 ? 'has-event' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="md-card-header" style={{ marginBottom: '0.75rem', marginTop: '1rem' }}>
              <h2 className="md-card-title" style={{ fontSize: '0.95rem' }}>Upcoming Meetings</h2>
              <button style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <Plus size={12} /> Add New
              </button>
            </div>

            <div className="md-classes-list">
              <div className="md-class-item">
                <div className="md-class-time">10:00<span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>AM</span></div>
                <div className="md-class-info">
                  <h5>Project Review Sync</h5>
                  <p><CalIcon size={12} /> Google Meet</p>
                </div>
              </div>
              <div className="md-class-item">
                <div className="md-class-time">02:30<span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>PM</span></div>
                <div className="md-class-info">
                  <h5>Resume Building Mentoring</h5>
                  <p><CalIcon size={12} /> Lab 4, IT Block</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

// Extracted to avoid import collision
const CalendarIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export default MentorDashboard;
