import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { API_URL } from '../config';
import { MapPin, Clock, Layers } from 'lucide-react';
import './EventsList.css';
import './EventCard.css';

const EventsList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/events`, { withCredentials: true });
        if (res.data.success) setEvents(res.data.events);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="el-wrapper">
      {/* ── Compact Nav ── */}
      <nav className="el-nav">
        <button className="el-nav-back" onClick={() => navigate('/dashboard')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--clr-text-heading)', letterSpacing: '-0.01em' }}>
          Events
        </span>
        <div style={{ width: 90 }} />
      </nav>

      {/* ── Content ── */}
      <div className="el-content">
        {/* Hero */}
        <header className="el-hero animate-fade-in">
          <span className="el-hero-badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Registration Portal
          </span>
          <h1 className="el-hero-title">
            <span>HELIX</span><span className="text-accent">'26</span>
          </h1>
          <p className="el-hero-subtitle">
            Push the boundaries of innovation. Join us for a high-intensity technical showcase from the ECE Association.
          </p>
        </header>

        {/* Search */}
        <div className="el-search-row animate-fade-in-up">
          <div className="el-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="el-search-icon">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search events or locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="el-search-input"
            />
            {search && (
              <button className="el-search-clear" onClick={() => setSearch('')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
          <span className="el-count">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
            <Loader text="Loading events..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="el-empty animate-fade-in">
            <span>🔍</span>
            <h3>{search ? 'No events match your search' : 'No events published yet'}</h3>
            <p>{search ? 'Try a different keyword' : 'Check back later!'}</p>
          </div>
        ) : (
          <div className="evc-grid animate-fade-in-up">
            {filtered.map((ev) => {
              const dateObj = new Date(ev.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString('default', { month: 'short' });
              const year = dateObj.getFullYear();
              const typeColor =
                ev.eventType === 'macro'    ? '#6366f1' :
                ev.eventType === 'internal' ? '#f59e0b' : '#10b981';
              const subCount = events.filter(sub => sub.parentEvent === ev._id).length;

              return (
                <div
                  key={ev._id}
                  className="evc-card"
                  onClick={() => navigate(`/events/${ev.slug || ev._id}`)}
                >
                  {/* Cover Photo */}
                  <div className="evc-cover">
                    <img 
                      src={ev.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'} 
                      alt={ev.title} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
                      }}
                    />
                    <div className="evc-cover-grad" />
                  </div>

                  {/* Info row with Date column + details column */}
                  <div className="evc-info">
                    <div className="evc-date-col">
                      <span className="evc-date-mon" style={{ color: typeColor }}>{month}</span>
                      <span className="evc-date-day">{day}</span>
                      <span className="evc-date-yr">{year}</span>
                    </div>

                    <div className="evc-detail-col">
                      <div className="evc-labels-row">
                        <span className={`evc-type-lbl ${ev.eventType || 'general'}`}>
                          {ev.eventType === 'macro' ? 'Macro' : ev.eventType === 'internal' ? 'Internal' : 'General'}
                        </span>
                        {ev.category && ev.category !== 'None' && (
                          <span className="evc-category-lbl">{ev.category}</span>
                        )}
                      </div>
                      
                      <h3 className="evc-title" title={ev.title}>{ev.title}</h3>
                      
                      {ev.eventType !== 'macro' && ev.location && (
                        <div className="evc-venue" title={ev.location}>
                          <span className="evc-card-icon-wrap">
                            <MapPin size={13} />
                          </span>
                          {ev.location}
                        </div>
                      )}

                      {ev.eventType !== 'macro' && (
                        <div className="evc-timing">
                          <span className="evc-card-icon-wrap">
                            <Clock size={13} />
                          </span>
                          {ev.session ? (
                            ev.session.toLowerCase().includes('morning') ? '9:00 AM - 1:00 PM' : 
                            ev.session.toLowerCase().includes('afternoon') ? '1:00 PM - 4:30 PM' : 
                            'Time TBA'
                          ) : 'Time TBA'}
                        </div>
                      )}

                      {ev.eventType === 'macro' && subCount > 0 && (
                        <div className="evc-subs-count">
                          <span className="evc-card-icon-wrap">
                            <Layers size={13} />
                          </span>
                          {subCount} {subCount === 1 ? 'Sub-Event' : 'Sub-Events'}
                        </div>
                      )}

                      <div className={`evc-reg-pill ${ev.isRegistrationOpen !== false ? 'open' : 'closed'}`}>
                        <span className="evc-card-icon-wrap">
                          <span className="evc-reg-dot" />
                        </span>
                        {ev.isRegistrationOpen !== false ? 'Registration Open' : 'Closed'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsList;
