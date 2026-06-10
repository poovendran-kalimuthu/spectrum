import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import './AdminEvents.css';

const AdminEvaluators = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluators, setEvaluators] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New Evaluator Form
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', pin: '', assignedRounds: [] });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evRes, evalsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/events`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/evaluators`, { withCredentials: true })
      ]);

      if (evRes.data.success) {
        const foundEvent = evRes.data.events.find(e => e._id === id || e.slug === id);
        setEvent(foundEvent);
      }
      if (evalsRes.data.success) {
        // Filter evaluators assigned to AT LEAST ONE round in THIS event
        const assignedHere = evalsRes.data.evaluators.filter(ev => 
          ev.assignedRounds.some(ar => {
            const evId = ar.event?._id || ar.event;
            const evSlug = ar.event?.slug;
            return evId === id || evSlug === id;
          })
        );
        setEvaluators(assignedHere);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRound = (roundNum) => {
    setFormData(prev => {
      const exists = prev.assignedRounds.includes(roundNum);
      if (exists) {
        return { ...prev, assignedRounds: prev.assignedRounds.filter(r => r !== roundNum) };
      } else {
        return { ...prev, assignedRounds: [...prev.assignedRounds, roundNum] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.assignedRounds.length === 0) return alert('Assign at least one round');
    if (!event) return alert('Event details not loaded yet');
    
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        assignedRounds: formData.assignedRounds.map(r => ({ event: event._id, roundNumber: r }))
      };
      await axios.post(`${API_URL}/api/admin/evaluators`, payload, { withCredentials: true });
      setFormOpen(false);
      setFormData({ name: '', email: '', phone: '', pin: '', assignedRounds: [] });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating evaluator');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evalId) => {
    if (!window.confirm('Are you sure you want to remove this evaluator?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/evaluators/${evalId}`, { withCredentials: true });
      setEvaluators(prev => prev.filter(e => e._id !== evalId));
    } catch (err) {
      alert('Failed to delete evaluator');
    }
  };

  // Remove full-screen early return
  // if (loading) return <Loader fullScreen text="Loading evaluators..." />;
  if (!loading && !event) return <div className="ae-error"><h2>Event not found</h2><button onClick={() => navigate('/admin/events')}>Back</button></div>;

  // Find Jury rounds for this event
  const juryRounds = event?.roundConfig?.filter(r => r.evaluationType === 'jury') || [];

  return (
    <div className="ae-wrapper">
      <header className="ae-header glass">
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/participants`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Participants
          </button>
          <h1 className="ae-title">Manage Jury Evaluators</h1>
          <p className="ae-subtitle">{event?.title}</p>
        </div>
        {!formOpen && (
          <button className="btn btn-accent" onClick={() => setFormOpen(true)}>
            + Add Evaluator
          </button>
        )}
      </header>

      {loading && (
        <div style={{ padding: '4rem 0' }}>
          <Loader text="Fetching jury assignments..." />
        </div>
      )}

      {juryRounds.length === 0 && (
        <div className="ae-toast status-alert warning" style={{ position: 'relative', marginBottom: '1rem', transform: 'none', left: 0 }}>
          This event has no rounds configured for "Jury" evaluation. You must set evaluation type to Jury in Event Details first.
        </div>
      )}

      {formOpen && juryRounds.length > 0 && (
        <div className="ae-form-card glass-strong animate-fade-in" style={{ marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff' }}>New Evaluator</h3>
          <form onSubmit={handleSubmit} className="ae-form">
            <div className="ae-form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Login ID) *</label>
                <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
            </div>
            <div className="ae-form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">6-Digit Login PIN *</label>
                <input type="text" pattern="\d{4,6}" title="4 to 6 digits" className="form-input" required value={formData.pin} onChange={e => setFormData({ ...formData, pin: e.target.value })} placeholder="e.g. 123456" />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label mb-2">Assign to Rounds *</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {juryRounds.map(r => (
                  <label key={r.roundNumber} className={`ae-member-pill ${formData.assignedRounds.includes(r.roundNumber) ? 'leader' : ''}`} style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.85rem' }}>
                    <input type="checkbox" style={{ display: 'none' }} checked={formData.assignedRounds.includes(r.roundNumber)} onChange={() => handleToggleRound(r.roundNumber)} />
                    Round {r.roundNumber} {r.name && `- ${r.name}`}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create & Assign'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {evaluators.length === 0 && !loading && !formOpen && (
        <div className="ae-empty">
          <span>🧑‍⚖️</span>
          <p>No external evaluators assigned to this event yet.</p>
        </div>
      )}

      {evaluators.length > 0 && (
        <div className="ae-table-wrapper glass">
          <table className="ae-table">
            <thead>
              <tr>
                <th>Evaluator Name</th>
                <th>Contact</th>
                <th>Assigned Rounds</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {evaluators.map(ev => {
                // Filter rounds assigned specifically to this event
                const roundsHere = ev.assignedRounds.filter(ar => {
                  const evId = ar.event?._id || ar.event;
                  return evId === event?._id || evId === id;
                });
                return (
                  <tr key={ev._id}>
                    <td>
                      <div className="ae-leader-info">
                        <strong>{ev.name}</strong>
                        <small>Created by {ev.createdBy?.name || 'Admin'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="ae-status-stack">
                        <span style={{ fontSize: '0.85rem' }}>📧 {ev.email}</span>
                        {ev.phone && <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>📞 {ev.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="ae-member-pills">
                        {roundsHere.map(ar => (
                          <span key={ar.roundNumber} className="ae-member-pill">Round {ar.roundNumber}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-xs btn-outline" style={{ color: '#f87171', borderColor: '#f87171' }} onClick={() => handleDelete(ev._id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEvaluators;
