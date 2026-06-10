import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Star, 
  Send, 
  ArrowLeft, 
  CheckCircle, 
  Lightbulb,
  Globe,
  Trophy,
  Heart,
  ThumbsUp,
  Sparkles
} from 'lucide-react';
import { API_URL } from '../config';
import Loader from './Loader';
import './Dashboard.css';
import Select from './ui/Select';

const Feedback = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    eventId: '',
    eventRating: 5,
    siteRating: 5,
    eventComments: '',
    siteComments: '',
    siteTechnicalIssues: '',
    suggestions: '',
    overallSatisfaction: 5,
    recommendation: 5,
    preferredNextEvent: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserEvents();
  }, []);

  const fetchUserEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/feedback/user-events`);
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const setRating = (name, val) => {
    setFormData({ ...formData, [name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(`${API_URL}/api/feedback`, formData);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Thank you! Your feedback has been recorded.' });
        setTimeout(() => navigate('/dashboard'), 2500);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit feedback' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader fullScreen text="Preparing your feedback form..." />;

  const StarRating = ({ value, name, label, color, icon: Icon = Star }) => (
    <div className="rating-container" style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.8rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', fontWeight: '500' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(name, star)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              padding: '5px',
              transition: 'transform 0.2s',
              transform: star <= value ? 'scale(1.15)' : 'scale(1)'
            }}
          >
            <Icon 
              size={24} 
              fill={star <= value ? color : 'transparent'} 
              stroke={star <= value ? color : 'rgba(255,255,255,0.2)'} 
              style={{ filter: star <= value ? `drop-shadow(0 0 8px ${color}44)` : 'none' }}
            />
          </button>
        ))}
        <span style={{ marginLeft: '8px', fontSize: '1.1rem', fontWeight: '800', color: starRatingColor(value), minWidth: '40px' }}>
          {value}/5
        </span>
      </div>
    </div>
  );

  const starRatingColor = (val) => {
    if (val >= 4) return '#10b981';
    if (val >= 3) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="feedback-page-wrapper db-wrapper" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.05), transparent 40%)' }}>

      <div className="feedback-container container" style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <div className="feedback-card glass animate-fade-in-up" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '1.2rem', color: '#818cf8', marginBottom: '1rem' }}>
              <MessageSquare size={32} />
            </div>
            <h1 className="feedback-title" style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '0.5rem', color: '#fff' }}>Help Us Grow 🚀</h1>
            <p className="feedback-subtitle" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Your insights shape the future of Spectrum.</p>
          </div>

          {message.text && (
            <div className="animate-fade-in" style={{ marginBottom: '2rem', padding: '1rem', borderRadius: '0.8rem', background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {message.type === 'success' ? <CheckCircle size={18} color="#10b981" /> : <div style={{color: '#ef4444'}}>⚠️</div>}
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Section 1: Event Experience */}
            <div className="form-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <Trophy size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8' }}>Event Experience</h3>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', display: 'block' }}>Which event did you participate in?</label>
                <div style={{ position: 'relative' }}>
                  <Select 
                    name="eventId" 
                    className="form-control glass" 
                    value={formData.eventId} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', appearance: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    <option value="" style={{background: '#0a0a0a'}}>Platform Feedback Only</option>
                    {events.map(event => (
                      <option key={event._id} value={event._id} style={{background: '#0a0a0a'}}>{event.title}</option>
                    ))}
                  </Select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {formData.eventId && (
                <div className="animate-fade-in">
                  <StarRating 
                    label="Rate the event organization" 
                    name="eventRating" 
                    value={formData.eventRating} 
                    color="#818cf8"
                  />
                  <div className="form-group">
                     <textarea 
                      name="eventComments" 
                      className="form-control glass" 
                      rows="3" 
                      placeholder="Best parts? Technical issues?"
                      value={formData.eventComments}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', fontSize: '0.9rem' }}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Platform Feedback */}
            <div className="form-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <Globe size={18} color="#a855f7" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7' }}>Platform & Website</h3>
              </div>
              
              <StarRating 
                label="Overall website experience" 
                name="siteRating" 
                value={formData.siteRating} 
                color="#a855f7"
              />

              <div className="form-group">
                <textarea 
                  name="siteComments" 
                  className="form-control glass" 
                  rows="3" 
                  placeholder="How was the dashboard and registration?"
                  value={formData.siteComments}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', fontSize: '0.9rem' }}
                ></textarea>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <textarea 
                  name="siteTechnicalIssues" 
                  className="form-control glass" 
                  rows="2" 
                  placeholder="Any technical issues or bugs encountered?"
                  value={formData.siteTechnicalIssues}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', fontSize: '0.9rem' }}
                ></textarea>
              </div>
            </div>

            {/* Section 3: Overall Satisfaction (NEW) */}
            <div className="form-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <Heart size={18} color="#ec4899" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899' }}>Overall Feel</h3>
              </div>
              
              <StarRating 
                label="Overall satisfaction with HELIX'26" 
                name="overallSatisfaction" 
                value={formData.overallSatisfaction} 
                color="#ec4899"
                icon={Heart}
              />

              <StarRating 
                label="How likely are you to recommend Spectrum to others?" 
                name="recommendation" 
                value={formData.recommendation} 
                color="#10b981"
                icon={ThumbsUp}
              />
            </div>

            {/* Section 4: Vision */}
            <div className="form-section animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <Lightbulb size={18} color="#fbbf24" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24' }}>Suggestions & Vision</h3>
              </div>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem', display: 'block' }}>What kind of events would you like to see next time?</label>
                <input 
                  type="text"
                  name="preferredNextEvent"
                  className="form-control glass"
                  placeholder="e.g., Robotics Workshop, Hackathon, AI Panel..."
                  value={formData.preferredNextEvent}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem' }}
                />
              </div>

              <div className="form-group">
                 <textarea 
                  name="suggestions" 
                  className="form-control glass" 
                  rows="3" 
                  placeholder="Any other improvements for us?"
                  value={formData.suggestions}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', borderRadius: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'none', fontSize: '0.9rem' }}
                ></textarea>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block animate-fade-in-up" 
              disabled={submitting}
              style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontSize: '1.1rem', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              {submitting ? 'Submitting...' : (
                <>
                  Send Feedback <Send size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .feedback-container {
            margin: 1rem auto !important;
          }
          .feedback-card {
            padding: 1.5rem !important;
            border-radius: 1rem !important;
          }
          .feedback-title {
            font-size: 1.6rem !important;
          }
          .hide-mobile {
            display: none !important;
          }
          .rating-container label {
            font-size: 0.8rem !important;
          }
          .rating-container span {
            font-size: 0.9rem !important;
          }
        }
        .rating-container button:hover {
          transform: scale(1.2) !important;
        }
        .form-control:focus {
           background: rgba(255,255,255,0.06) !important;
           border-color: rgba(129, 140, 248, 0.4) !important;
           outline: none;
        }
      `}} />
    </div>
  );
};

export default Feedback;
