import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import { ToastContainer, useToast } from './Toast';
import './AdminProjectReview.css';

const AdminProjectReview = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => { fetchData(); }, [eventId]);

  const fetchData = async () => {
    try {
      const [eventRes, subRes] = await Promise.all([
        axios.get(`${API_URL}/api/events/${eventId}`, { withCredentials: true }),
        axios.get(`${API_URL}/api/projects/event/${eventId}`, { withCredentials: true })
      ]);
      setEvent(eventRes.data.event);
      setSubmissions(subRes.data);
    } catch {
      showToast('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e) => {
    const isOpen = e.target.checked;
    setToggling(true);
    try {
      await axios.patch(`${API_URL}/api/projects/toggle-submission/${eventId}`, { isOpen }, { withCredentials: true });
      setEvent({ ...event, isSubmissionOpen: isOpen });
      showToast(`Submission window ${isOpen ? 'opened' : 'closed'}.`, 'success');
    } catch {
      showToast('Failed to update status.', 'error');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="apr-loading">
        <Loader text="Loading project submissions..." />
      </div>
    );
  }

  return (
    <div className="apr-wrapper page-enter">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* ── Controls Bar ── */}
      <div className="apr-controls">
        <div className="apr-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigate(`/admin/events/${event?.slug || event?._id || eventId}`)}
              style={{ padding: '6px 10px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
            <h2>Project Review</h2>
          </div>
          <p>{event?.title} &bull; <strong>{submissions.length}</strong> submission{submissions.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="apr-toggle-box">
          <span className="apr-toggle-label">Allow Edits & Submissions</span>
          <label className="switch" title={toggling ? 'Updating...' : (event?.isSubmissionOpen ? 'Click to close' : 'Click to open')}>
            <input
              type="checkbox"
              checked={!!event?.isSubmissionOpen}
              onChange={handleToggle}
              disabled={toggling}
            />
            <span className="slider round" />
          </label>
          <span className={`badge ${event?.isSubmissionOpen ? 'badge-success' : 'badge-muted'}`}>
            {event?.isSubmissionOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* ── Tile Grid ── */}
      <div className="apr-tile-grid">
        {submissions.map(sub => (
          <div key={sub._id} className="apr-tile animate-fade-in" onClick={() => setSelectedProject(sub)}>
            <div className="apr-tile-header">
              <div className="apr-tile-team">{sub.projectTitle || sub.registration?.teamName}</div>
              <span className="badge badge-accent">R{sub.registration?.currentRound}</span>
            </div>

            <div className="apr-tile-meta">
              <div className="apr-tile-leader">
                <strong>{sub.registration?.teamName}</strong> &bull; {sub.registration?.teamLeader?.name}
              </div>
              <p className="apr-tile-preview">{sub.problemStatement}</p>
            </div>

            <div className="apr-tile-footer">
              <span className="apr-tile-hint">Click to view full details</span>
              <button className="btn btn-secondary btn-xs" onClick={e => { e.stopPropagation(); setSelectedProject(sub); }}>
                View →
              </button>
            </div>
          </div>
        ))}

        {submissions.length === 0 && (
          <div className="apr-empty">
            <span>📭</span>
            <p>No projects submitted yet.</p>
          </div>
        )}
      </div>

      {/* ── Project Detail Modal ── */}
      {selectedProject && (
        <div className="apr-modal-overlay" onClick={() => setSelectedProject(null)}>
          <div className="apr-modal animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="apr-modal-header">
              <div className="apr-modal-title">
                <h3>{selectedProject.projectTitle || selectedProject.registration?.teamName}</h3>
                <p className="apr-leader">
                  Team: <strong>{selectedProject.registration?.teamName}</strong> &bull; Leader: {selectedProject.registration?.teamLeader?.name}
                </p>
              </div>
              <button className="apr-close-btn" onClick={() => setSelectedProject(null)} aria-label="Close">✕</button>
            </div>
            <div className="apr-modal-body">
              <div className="apr-section full">
                <span className="apr-section-label">Problem Statement</span>
                <p className="apr-section-content">{selectedProject.problemStatement}</p>
              </div>
              <div className="apr-section full">
                <span className="apr-section-label">Proposed Solution</span>
                <p className="apr-section-content">{selectedProject.proposedSolution}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Target Users</span>
                <p className="apr-section-content">{selectedProject.targetUsers}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Unique Factor</span>
                <p className="apr-section-content">{selectedProject.uniqueFactor}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Revenue Model</span>
                <p className="apr-section-content">{selectedProject.revenueModel}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Validation</span>
                <p className="apr-section-content">{selectedProject.problemValidation}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Feasibility</span>
                <p className="apr-section-content">{selectedProject.feasibility}</p>
              </div>
              <div className="apr-section">
                <span className="apr-section-label">Existing Solutions</span>
                <p className="apr-section-content">{selectedProject.existingSolutions}</p>
              </div>
              <div className="apr-section full">
                <span className="apr-section-label">Workflow Steps</span>
                <p className="apr-section-content">{selectedProject.workflow}</p>
              </div>
              <div className="apr-section full">
                <span className="apr-section-label">Expected Impact</span>
                <p className="apr-section-content">{selectedProject.expectedImpact}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjectReview;
