import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader';
import { API_URL } from '../config';
import './CompleteProfile.css';
import Select from './ui/Select';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL', 'ACT', 'VLSI', 'AIML', 'AIDS', 'CYBER', 'AUTO'];
const YEARS = ['Second', 'Third'];

const EditProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', registerNumber: '', department: 'CSE', year: 'Second',
    section: '', mobile: '', alternateEmail: '',
    subRole: 'student', assignedMentor: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableMentors, setAvailableMentors] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (location.state?.user) { populate(location.state.user); }
      else {
        try {
          const res = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
          if (res.data.success) populate(res.data.user); else navigate('/login');
        } catch { navigate('/login'); }
      }
      setFetchLoading(false);
    };
    init();

    // Fetch approved mentors
    const fetchMentors = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/mentors`, { withCredentials: true });
        if (res.data.success) setAvailableMentors(res.data.mentors);
      } catch { /* non-critical */ }
    };
    fetchMentors();
  }, []);

  const populate = u => setFormData({
    name: u.name || '',
    registerNumber: u.registerNumber || '',
    department: u.department || 'CSE',
    year: u.year || 'Second',
    section: u.section || '',
    mobile: u.mobile || '',
    alternateEmail: u.alternateEmail || '',
    subRole: u.subRole || 'student',
    assignedMentor: u.assignedMentor?._id || u.assignedMentor || ''
  });

  const handleChange = e => setFormData(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, formData, { withCredentials: true });
      if (res.data.success) navigate('/dashboard');
    } catch { setError('Failed to update. Please try again.'); }
    finally { setLoading(false); }
  };

  if (fetchLoading) return <Loader fullScreen text="Loading Profile..." />;

  return (
    <div className="cp-wrapper">
      {loading && <Loader fullScreen text="Saving Changes..." />}
      <div className="cp-card animate-scale-in">
        <div className="cp-back-btn">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </button>
        </div>

        <div className="cp-header">
          <div className="cp-icon">✏️</div>
          <h1>Edit Profile</h1>
          <p>Update your information below</p>
        </div>

        <form onSubmit={handleSubmit} className="cp-form">
          {error && <div className="cp-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" type="text" name="name" required value={formData.name} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Register / Roll Number *</label>
            <input className="form-input" type="text" name="registerNumber" required value={formData.registerNumber} onChange={handleChange} />
          </div>

          <div className="cp-form-row">
            <div className="form-group">
              <label className="form-label">Department *</label>
              <Select className="form-select" name="department" value={formData.department} onChange={handleChange} required>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="form-group">
              <label className="form-label">Year *</label>
              <Select className="form-select" name="year" value={formData.year} onChange={handleChange} required>
                {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
              </Select>
            </div>
          </div>

          <div className="cp-form-row">
            <div className="form-group">
              <label className="form-label">Section *</label>
              <input className="form-input" type="text" name="section" required value={formData.section} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile *</label>
              <input className="form-input" type="tel" name="mobile" required value={formData.mobile} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Alternate Email</label>
            <input className="form-input" type="email" name="alternateEmail" value={formData.alternateEmail} onChange={handleChange} />
          </div>

          {/* ── Role Type Picker ── */}
          <div className="cp-subrole-section">
            <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
              My Role
            </label>
            <div className="cp-subrole-picker">
              <button
                type="button"
                className={`cp-subrole-btn ${formData.subRole === 'student' ? 'active' : ''}`}
                onClick={() => setFormData(f => ({ ...f, subRole: 'student' }))}
              >
                <span className="cp-subrole-icon">🎓</span>
                <span className="cp-subrole-title">Student</span>
                <span className="cp-subrole-desc">Learner participating in events</span>
              </button>
              <button
                type="button"
                className={`cp-subrole-btn mentor ${formData.subRole === 'mentor' ? 'active' : ''}`}
                onClick={() => setFormData(f => ({ ...f, subRole: 'mentor', assignedMentor: '' }))}
              >
                <span className="cp-subrole-icon">🧑‍🏫</span>
                <span className="cp-subrole-title">Mentor</span>
                <span className="cp-subrole-desc">Guide and support students</span>
              </button>
            </div>

            {/* Student — Mentor picker */}
            {formData.subRole === 'student' && (
              <div className="form-group" style={{ marginTop: '0.875rem' }}>
                <label className="form-label">
                  Assigned Mentor <span style={{ fontWeight: 400, color: 'var(--clr-text-muted)', fontSize: '0.75rem' }}>(optional)</span>
                </label>
                <Select
                  className="form-select" name="assignedMentor"
                  value={formData.assignedMentor}
                  onChange={e => setFormData(f => ({ ...f, assignedMentor: e.target.value }))}
                >
                  <option value="">— No mentor assigned —</option>
                  {availableMentors.length === 0 ? (
                    <option disabled>No approved mentors available yet</option>
                  ) : (
                    availableMentors.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name}{m.department ? ` (${m.department})` : ''} — {m.email}
                      </option>
                    ))
                  )}
                </Select>
              </div>
            )}

            {/* Mentor — Approval notice */}
            {formData.subRole === 'mentor' && (
              <div className="cp-mentor-notice">
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⏳</span>
                <div>
                  <strong>Pending Super Admin Approval</strong>
                  <p>Mentor Dashboard access is granted only after Super Admin approval. If you were previously approved, your status is preserved.</p>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="cp-submit" disabled={loading}>
            {loading ? <><span className="cp-spin" /> Saving...</> : <>Save Changes <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
