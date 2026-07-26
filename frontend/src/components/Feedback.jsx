import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Sparkles,
  ClipboardList,
  Upload
} from 'lucide-react';
import { API_URL } from '../config';
import Loader from './Loader';
import './Dashboard.css';
import Select from './ui/Select';

const Feedback = () => {
  const [events, setEvents] = useState([]);
  const [allEventsList, setAllEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [formData, setFormData] = useState({
    eventId: eventIdParam || '',
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

  useEffect(() => {
    if (eventIdParam) {
      setFormData(prev => ({ ...prev, eventId: eventIdParam }));
    }
  }, [eventIdParam]);

  const fetchUserEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/feedback/user-events`);
      if (res.data.success) {
        setEvents(res.data.data || []);
        if (res.data.allEvents) setAllEventsList(res.data.allEvents);
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

  const [templateAnswers, setTemplateAnswers] = useState({});
  const [templateErrors, setTemplateErrors] = useState({});

  const combinedEvents = [...events];
  allEventsList.forEach(ae => {
    if (!combinedEvents.some(e => e._id === ae._id)) {
      combinedEvents.push(ae);
    }
  });

  const selectedEvent = combinedEvents.find(e => e._id === formData.eventId);
  const mappedTemplate = selectedEvent?.feedbackTemplate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      if (mappedTemplate && mappedTemplate.fields?.length > 0) {
        // Validate required template fields
        const errors = {};
        mappedTemplate.fields.forEach(field => {
          if (field.required) {
            const ans = templateAnswers[field.id];
            if (ans === undefined || ans === null || (typeof ans === 'string' && ans.trim() === '')) {
              errors[field.id] = 'This field is required';
            }
          }
        });

        if (Object.keys(errors).length > 0) {
          setTemplateErrors(errors);
          setMessage({ type: 'error', text: 'Please complete all required fields.' });
          setSubmitting(false);
          return;
        }
        setTemplateErrors({});

        const res = await axios.post(`${API_URL}/api/feedback`, {
          eventId: formData.eventId,
          template: mappedTemplate._id,
          templateAnswers,
          siteRating: formData.siteRating || 5
        });

        if (res.data.success) {
          setMessage({ type: 'success', text: 'Thank you! Your feedback for this event has been recorded.' });
          setTimeout(() => navigate('/dashboard'), 2500);
        }
      } else {
        const res = await axios.post(`${API_URL}/api/feedback`, formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Thank you! Your feedback has been recorded.' });
          setTimeout(() => navigate('/dashboard'), 2500);
        }
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
            {/* Event Selector */}
            <div className="form-section animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' }}>
                <Trophy size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#818cf8' }}>Select Event</h3>
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
                    {events.length > 0 && (
                      <optgroup label="Your Registered Events" style={{ background: '#0a0a0a', color: '#818cf8', fontWeight: 'bold' }}>
                        {events.map(event => (
                          <option key={event._id} value={event._id} style={{background: '#0a0a0a', color: '#fff'}}>
                            {event.title} {event.feedbackTemplate ? '📋 (Custom Form Mapped)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {allEventsList.filter(ae => !events.some(e => e._id === ae._id)).length > 0 && (
                      <optgroup label="Other Platform Events" style={{ background: '#0a0a0a', color: '#94a3b8', fontWeight: 'bold' }}>
                        {allEventsList.filter(ae => !events.some(e => e._id === ae._id)).map(event => (
                          <option key={event._id} value={event._id} style={{background: '#0a0a0a', color: '#fff'}}>
                            {event.title} {event.feedbackTemplate ? '📋 (Custom Form Mapped)' : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </Select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              {mappedTemplate && (
                <div style={{ background: 'rgba(99, 102, 241, 0.12)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#c7d2fe', fontSize: '0.82rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} /> Mapped Feedback Form: <strong>{mappedTemplate.title}</strong> ({mappedTemplate.fields?.length || 0} questions)
                </div>
              )}
            </div>

            {selectedEvent && selectedEvent.isFeedbackOpen === false ? (
              <div className="animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '2.5rem', borderRadius: '1.2rem', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#fff', textAlign: 'center', margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.4))' }}>🔒</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#fca5a5' }}>Feedback Submissions Suspended</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.92rem', lineHeight: '1.6', maxWidth: '460px', margin: '0' }}>
                  Feedback submissions for <strong>{selectedEvent.title}</strong> are closed or suspended by the organizers.
                </p>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setFormData(prev => ({ ...prev, eventId: '' }))}
                  style={{ marginTop: '15px', padding: '0.5rem 1rem', borderRadius: '0.67rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}
                >
                  Go Back to Platform Feedback
                </button>
              </div>
            ) : (
              <>
                {/* DYNAMIC TEMPLATE QUESTIONS (IF MAPPED) */}
                {mappedTemplate && mappedTemplate.fields?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {mappedTemplate.fields.map((field, idx) => {
                  const val = templateAnswers[field.id];
                  const error = templateErrors[field.id];
                  const totalFields = mappedTemplate.fields.length;

                  return (
                    <div key={field.id} className="ref-step-card animate-fade-in" style={error ? { borderColor: '#ef4444' } : {}}>
                      <div className="ref-progress-row">
                        {Array.from({ length: totalFields }, (_, pIdx) => (
                          <div key={pIdx} className={`ref-progress-bar ${pIdx <= idx ? 'active' : ''}`} />
                        ))}
                      </div>

                      <label className="ref-question-title" style={{ color: '#0f172a' }}>
                        {field.label || `Question ${idx + 1}`} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>

                      <div style={{ marginTop: '0.8rem' }}>
                        {/* 1-5 RATING STAR TILES */}
                        {field.type === 'rating' && (
                          <div className="ref-rating-container">
                            <div className="ref-rating-squares">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  type="button"
                                  key={star}
                                  className={`ref-rating-square ${val === star ? 'active' : ''}`}
                                  onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: star })}
                                >
                                  {star}
                                </button>
                              ))}
                            </div>
                            <div className="ref-star-indicator">
                              <Star size={16} fill="#10b981" stroke="#10b981" />
                              <span>{val ? `${val} Stars` : 'Stars'}</span>
                            </div>
                          </div>
                        )}

                        {/* RATING SCALE */}
                        {field.type === 'rating_scale' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
                              <button
                                type="button"
                                key={n}
                                className={`ref-rating-square ${val === n ? 'active' : ''}`}
                                style={{ width: '38px', height: '38px', borderRadius: '8px', border: val === n ? '2px solid #6366f1' : '1.5px solid #cbd5e1', background: val === n ? '#eef2ff' : '#ffffff', color: val === n ? '#4f46e5' : '#1e293b', fontWeight: '700', cursor: 'pointer' }}
                                onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: n })}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* EMOJI RATING */}
                        {field.type === 'emoji_rating' && (
                          <div style={{ display: 'flex', gap: '16px', fontSize: '1.75rem' }}>
                            {['😞', '😐', '😊'].map((emoji, i) => (
                              <button
                                type="button"
                                key={i}
                                style={{ background: val === emoji ? 'rgba(99, 102, 241, 0.2)' : 'none', border: val === emoji ? '2px solid #6366f1' : 'none', borderRadius: '50%', cursor: 'pointer', padding: '4px' }}
                                onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: emoji })}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* SLIDER */}
                        {field.type === 'slider' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input 
                              type="range" 
                              min={field.min ?? 0} 
                              max={field.max ?? 10} 
                              step={field.step ?? 1} 
                              value={val ?? (field.min ?? 0)} 
                              onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: Number(e.target.value) })} 
                              style={{ width: '100%', accentColor: '#6366f1' }} 
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                              <span>Min: {field.min ?? 0}</span>
                              <span style={{ fontWeight: '700', color: '#4f46e5' }}>Selected: {val ?? (field.min ?? 0)}</span>
                              <span>Max: {field.max ?? 10}</span>
                            </div>
                          </div>
                        )}

                        {/* NPS SCORE (0-10) */}
                        {field.type === 'nps' && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {Array.from({ length: 11 }, (_, i) => i).map(n => (
                              <button 
                                type="button" 
                                key={n} 
                                style={{ width: '36px', height: '36px', borderRadius: '50%', border: val === n ? '2px solid #6366f1' : '1.5px solid #cbd5e1', background: val === n ? '#eef2ff' : '#ffffff', color: val === n ? '#4f46e5' : '#1e293b', fontWeight: '700', cursor: 'pointer' }} 
                                onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: n })}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* YES / NO TOGGLE */}
                        {field.type === 'yes_no' && (
                          <div style={{ display: 'flex', gap: '12px' }}>
                            {['Yes', 'No'].map(opt => (
                              <button 
                                type="button" 
                                key={opt} 
                                style={{ padding: '8px 24px', borderRadius: '999px', border: val === opt ? '2px solid #6366f1' : '1.5px solid #cbd5e1', background: val === opt ? '#eef2ff' : '#ffffff', color: val === opt ? '#4f46e5' : '#1e293b', fontWeight: val === opt ? '700' : '500', cursor: 'pointer' }} 
                                onClick={() => setTemplateAnswers({ ...templateAnswers, [field.id]: opt })}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* DROPDOWN */}
                        {field.type === 'dropdown' && (
                          <Select 
                            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.6rem', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }}
                            value={val || ''} 
                            onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                          >
                            <option value="">-- Select Option --</option>
                            {(field.options || ['Option 1', 'Option 2']).map((o, i) => (
                              <option key={i} value={o}>{o}</option>
                            ))}
                          </Select>
                        )}

                        {/* RADIO / CHECKBOX / MULTIPLE CHOICE */}
                        {(field.type === 'radio' || field.type === 'checkbox' || field.type === 'multiple_choice') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
                              const isChecked = field.type === 'radio' ? val === opt : (Array.isArray(val) && val.includes(opt));
                              return (
                                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#1e293b' }}>
                                  <input
                                    type={field.type === 'radio' ? 'radio' : 'checkbox'}
                                    name={field.id}
                                    checked={!!isChecked}
                                    onChange={e => {
                                      if (field.type === 'radio') setTemplateAnswers({ ...templateAnswers, [field.id]: opt });
                                      else {
                                        const currentArr = Array.isArray(val) ? val : [];
                                        setTemplateAnswers({
                                          ...templateAnswers,
                                          [field.id]: e.target.checked ? [...currentArr, opt] : currentArr.filter(x => x !== opt)
                                        });
                                      }
                                    }}
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* TEXT / SHORT TEXT / EMAIL / PHONE / URL / NUMBER */}
                        {['text', 'short_text', 'email', 'phone', 'url', 'number'].includes(field.type) && (
                          <input
                            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem',
                              borderRadius: '0.6rem',
                              border: '1.5px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            placeholder={field.placeholder || `Enter ${field.label || 'your answer'}...`}
                            value={val || ''}
                            onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                          />
                        )}

                        {/* TEXTAREA / LONG TEXT */}
                        {['long_text', 'textarea'].includes(field.type) && (
                          <textarea
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.8rem 1rem',
                              borderRadius: '0.6rem',
                              border: '1.5px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0f172a',
                              fontSize: '0.9rem',
                              outline: 'none',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                            placeholder={field.placeholder || `Enter detailed response for ${field.label || 'question'}...`}
                            value={val || ''}
                            onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })}
                          />
                        )}

                        {/* DATE */}
                        {field.type === 'date' && (
                          <input 
                            type="date" 
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }}
                            value={val || ''} 
                            onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })} 
                          />
                        )}

                        {/* TIME */}
                        {field.type === 'time' && (
                          <input 
                            type="time" 
                            style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.9rem' }}
                            value={val || ''} 
                            onChange={e => setTemplateAnswers({ ...templateAnswers, [field.id]: e.target.value })} 
                          />
                        )}

                        {/* FILE UPLOAD */}
                        {field.type === 'file_upload' && (
                          <div style={{ padding: '16px', border: '2px dashed #cbd5e1', borderRadius: '0.6rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', color: '#475569', fontSize: '0.85rem' }}>
                            <input 
                              type="file" 
                              id={`file_${field.id}`}
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files[0];
                                if (file) {
                                  setTemplateAnswers({ ...templateAnswers, [field.id]: file.name });
                                }
                              }}
                            />
                            <label htmlFor={`file_${field.id}`} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              <Upload size={20} color="#6366f1" />
                              <span>{val ? `Attached: ${val}` : 'Click to attach file or screenshot'}</span>
                            </label>
                          </div>
                        )}

                        {/* LIKERT SCALE */}
                        {field.type === 'likert' && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '6px', textAlign: 'left', color: '#475569' }}>Scale</th>
                                  {(field.scaleLabels || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']).map((lbl, i) => (
                                    <th key={i} style={{ padding: '6px', textAlign: 'center', color: '#475569' }}>{lbl}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td style={{ padding: '6px', fontWeight: '600', color: '#1e293b' }}>Rating</td>
                                  {(field.scaleLabels || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']).map((lbl, i) => (
                                    <td key={i} style={{ textAlign: 'center', padding: '6px' }}>
                                      <input 
                                        type="radio" 
                                        name={field.id} 
                                        checked={val === lbl} 
                                        onChange={() => setTemplateAnswers({ ...templateAnswers, [field.id]: lbl })} 
                                      />
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* MATRIX / GRID */}
                        {field.type === 'matrix' && (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.82rem' }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: '6px', textAlign: 'left', color: '#475569' }}>Aspect</th>
                                  {(field.columns || ['Poor', 'Average', 'Good', 'Excellent']).map((col, i) => (
                                    <th key={i} style={{ padding: '6px', textAlign: 'center', color: '#475569' }}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {(field.rows || ['Aspect 1']).map((row, rIdx) => {
                                  const matrixVal = (val && typeof val === 'object') ? val[row] : '';
                                  return (
                                    <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '6px', fontWeight: '500', color: '#1e293b' }}>{row}</td>
                                      {(field.columns || ['Poor', 'Average', 'Good', 'Excellent']).map((col, cIdx) => (
                                        <td key={cIdx} style={{ textAlign: 'center', padding: '6px' }}>
                                          <input 
                                            type="radio" 
                                            name={`${field.id}_${rIdx}`} 
                                            checked={matrixVal === col} 
                                            onChange={() => {
                                              const currentMatrix = (val && typeof val === 'object') ? { ...val } : {};
                                              currentMatrix[row] = col;
                                              setTemplateAnswers({ ...templateAnswers, [field.id]: currentMatrix });
                                            }} 
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {error && <small style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>⚠️ {error}</small>}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DEFAULT GENERAL FEEDBACK SECTIONS */
              <>
                {formData.eventId && (
                  <div className="animate-fade-in" style={{ marginBottom: '2.5rem' }}>
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
                </div>
              </>
            )}

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
          </>
        )}
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
