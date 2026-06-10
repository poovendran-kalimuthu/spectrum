import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './ProjectSubmission.css';

const ProjectSubmission = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [formData, setFormData] = useState({
    projectTitle: '',
    problemStatement: '',
    targetUsers: '',
    proposedSolution: '',
    uniqueFactor: '',
    revenueModel: '',
    problemValidation: '',
    feasibility: '',
    workflow: '',
    existingSolutions: '',
    expectedImpact: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      const eventRes = await axios.get(`${API_URL}/api/events/${eventId}`, { withCredentials: true });
      const { event: eventData, isLeader, registration } = eventRes.data;

      // Access Control: Only Team Leaders of Innovators Battle
      const isInnovatorEvent = eventData.title.toLowerCase().includes('innovator');
      
      if (!isLeader || !isInnovatorEvent) {
        setToast({ show: true, message: 'Access Denied: Only team leaders of Innovators Battle can access this page.', type: 'danger' });
        setTimeout(() => navigate('/dashboard'), 3000);
        return;
      }

      setEvent(eventData);

      const submissionRes = await axios.get(`${API_URL}/api/projects/my-submission/${eventId}`, { withCredentials: true });
      if (submissionRes.data._id) {
        const { _id, registration, event, createdAt, updatedAt, __v, ...data } = submissionRes.data;
        setFormData(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to load details.', type: 'danger' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (formData.problemStatement.split('\n').length > 3) return "Problem Statement exceeds 3 lines.";
    if (formData.proposedSolution.split('\n').length > 4) return "Proposed Solution exceeds 4 lines.";
    if (formData.revenueModel.split('\n').length > 1) return "Revenue Model must be 1 line.";
    if (formData.problemValidation.split('\n').length > 2) return "Problem Validation exceeds 2 lines.";
    if (formData.feasibility.split('\n').length > 2) return "Feasibility exceeds 2 lines.";
    if (formData.workflow.split('\n').length > 3) return "Basic Workflow exceeds 3 steps/lines.";
    if (formData.existingSolutions.split('\n').length > 1) return "Existing Solutions & Gap must be 1 line.";
    if (formData.expectedImpact.split('\n').length > 1) return "Expected Impact must be 1 line.";
    
    // Check if any field is empty
    for (const key in formData) {
      if (!formData[key].trim()) return `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required.`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setToast({ show: true, message: error, type: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/projects/submit`, {
        event: event?._id || eventId,
        ...formData
      }, { withCredentials: true });
      
      setToast({ show: true, message: 'Idea Submission updated successfully!', type: 'success' });
      setTimeout(() => navigate(`/events/${eventId}`), 2000);
    } catch (err) {
      setToast({ show: true, message: err.response?.data?.message || 'Submission failed.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="ps-wrapper animate-fade-in">
      <div className="ps-card">
        <div className="ps-header">
          <p>Innovators Battle</p>
          <h2>Idea Submission</h2>
        </div>

        {event && !event.isSubmissionOpen && (
          <div className="ps-locked-banner">
            <span>🔒</span>
            <p>Submission is currently locked by administrators.</p>
          </div>
        )}

        <form className="ps-form" onSubmit={handleSubmit}>
          <div className="ps-field-group">
            <label className="ps-label">Idea Title / Startup Name</label>
            <input 
              name="projectTitle"
              className="ps-input"
              value={formData.projectTitle}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="Enter your Project or Team Name"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Problem Statement <small>Max 3 lines</small></label>
            <textarea 
              name="problemStatement"
              className="ps-textarea"
              value={formData.problemStatement}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="What Problem are you solving?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Target Users</label>
            <input 
              name="targetUsers"
              className="ps-input"
              value={formData.targetUsers}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="Who are your users?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Proposed Solution <small>Max 4 lines</small></label>
            <textarea 
              name="proposedSolution"
              className="ps-textarea"
              value={formData.proposedSolution}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="How does your solution work?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Unique Factor <small>What makes it different?</small></label>
            <textarea 
              name="uniqueFactor"
              className="ps-textarea"
              value={formData.uniqueFactor}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="USP of your project"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Revenue Model <small>1 line</small></label>
            <input 
              name="revenueModel"
              className="ps-input"
              value={formData.revenueModel}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="How will you monetize?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Problem Validation <small>1–2 lines</small></label>
            <textarea 
              name="problemValidation"
              className="ps-textarea"
              value={formData.problemValidation}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="Proof that this is a real problem"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Feasibility <small>1–2 lines</small></label>
            <textarea 
              name="feasibility"
              className="ps-textarea"
              value={formData.feasibility}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="Is it practically possible to build?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Basic Workflow <small>2–3 steps</small></label>
            <textarea 
              name="workflow"
              className="ps-textarea"
              value={formData.workflow}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="In de"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Existing Solutions & Gap <small>1 line</small></label>
            <input 
              name="existingSolutions"
              className="ps-input"
              value={formData.existingSolutions}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="What exists and why is yours better?"
            />
          </div>

          <div className="ps-field-group">
            <label className="ps-label">Expected Impact <small>1 line</small></label>
            <input 
              name="expectedImpact"
              className="ps-input"
              value={formData.expectedImpact}
              onChange={handleChange}
              disabled={!event?.isSubmissionOpen}
              required
              placeholder="What changes after your solution?"
            />
          </div>

          <div className="ps-actions">
            {event?.isSubmissionOpen ? (
              <button 
                type="submit" 
                className="btn btn-primary ps-submit-btn" 
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Save Project Details'}
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-ghost ps-submit-btn" 
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
            )}
          </div>
        </form>
      </div>

      {toast.show && (
        <div className={`ae-toast alert alert-${toast.type} animate-slide-in`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast({ ...toast, show: false })}>✕</button>
        </div>
      )}
    </div>
  );
};

export default ProjectSubmission;
