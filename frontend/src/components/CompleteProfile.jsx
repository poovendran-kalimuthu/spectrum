import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader';
import { API_URL } from '../config';
import './CompleteProfile.css';
import Select from './ui/Select';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL', 'ACT', 'VLSI', 'AIML', 'AIDS', 'CYBER', 'AUTO'];
const YEARS = ['Second', 'Third'];

const REQUIRED_FIELDS = ['name', 'registerNumber', 'department', 'year', 'section', 'mobile'];

const CompleteProfile = () => {
  const [formData, setFormData] = useState({
    name: '', registerNumber: '', department: 'CSE', year: 'Second',
    section: '', mobile: '', alternateEmail: '',
    subRole: 'student', assignedMentor: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const [availableMentors, setAvailableMentors] = useState([]);
  const navigate = useNavigate();

  // Fetch approved mentors for student assignment
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/mentors`, { withCredentials: true });
        if (res.data.success) setAvailableMentors(res.data.mentors);
      } catch { /* non-critical */ }
    };
    fetchMentors();
  }, []);

  const handleChange = e => {
    setFormData(f => ({ ...f, [e.target.name]: e.target.value }));
    setTouched(t => ({ ...t, [e.target.name]: true }));
  };

  const handleBlur = e => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  };

  // Progress: count filled required fields
  const filledRequired = REQUIRED_FIELDS.filter(f => formData[f] && formData[f].trim() !== '').length;
  const progress = Math.round((filledRequired / REQUIRED_FIELDS.length) * 100);

  const getFieldError = (name) => {
    if (!touched[name]) return null;
    if (name === 'mobile') {
      if (!formData.mobile) return 'Mobile number is required';
      if (!/^\d{10}$/.test(formData.mobile)) return 'Enter a valid 10-digit number';
    }
    if (name === 'registerNumber' && !formData.registerNumber) return 'Register number is required';
    if (name === 'name' && !formData.name) return 'Full name is required';
    if (name === 'section' && !formData.section) return 'Section is required';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map(f => [f, true])));

    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true); setError('');
    try {
      const res = await axios.put(`${API_URL}/api/auth/profile`, formData, { withCredentials: true });
      if (res.data.success) navigate('/dashboard');
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-wrapper">
      {loading && <Loader fullScreen text="Saving Profile..." />}

      {/* Background decorations */}
      <div className="cp-bg-decoration">
        <div className="cp-bg-orb cp-bg-orb-1" />
        <div className="cp-bg-orb cp-bg-orb-2" />
        <div className="cp-bg-grid" />
      </div>

      <div className="cp-card animate-scale-in">
        {/* Header */}
        <div className="cp-header">
          <div className="cp-icon-wrap">
            <span className="cp-icon-emoji">🎓</span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Fill in your details to access all Spectrum features</p>
        </div>

        {/* Progress */}
        <div className="cp-progress-section">
          <div className="cp-progress-track">
            <div className="cp-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="cp-progress-label">
            <span>{filledRequired} of {REQUIRED_FIELDS.length} required fields</span>
            <span className={`cp-progress-pct ${progress === 100 ? 'done' : ''}`}>{progress}%</span>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="cp-error animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="cp-form" noValidate>
          {/* Full Name */}
          <div className={`cp-field ${touched.name && !formData.name ? 'has-error' : formData.name ? 'has-value' : ''}`}>
            <label className="cp-label">Full Name <span className="cp-required">*</span></label>
            <input
              className="cp-input" type="text" name="name" required
              value={formData.name} onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. Arun Kumar" autoComplete="name"
            />
            {getFieldError('name') && <span className="cp-field-error">{getFieldError('name')}</span>}
          </div>

          {/* Register Number */}
          <div className={`cp-field ${touched.registerNumber && !formData.registerNumber ? 'has-error' : formData.registerNumber ? 'has-value' : ''}`}>
            <label className="cp-label">Register / Roll Number <span className="cp-required">*</span></label>
            <input
              className="cp-input" type="text" name="registerNumber" required
              value={formData.registerNumber} onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. 727624BEC001"
            />
            {getFieldError('registerNumber') && <span className="cp-field-error">{getFieldError('registerNumber')}</span>}
          </div>

          {/* Department + Year */}
          <div className="cp-row">
            <div className="cp-field has-value">
              <label className="cp-label">Department <span className="cp-required">*</span></label>
              <Select className="cp-input cp-select" name="department" value={formData.department} onChange={handleChange} required>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <div className="cp-field has-value">
              <label className="cp-label">Year <span className="cp-required">*</span></label>
              <Select className="cp-input cp-select" name="year" value={formData.year} onChange={handleChange} required>
                {YEARS.map(y => <option key={y} value={y}>{y} Year</option>)}
              </Select>
            </div>
          </div>

          {/* Section + Mobile */}
          <div className="cp-row">
            <div className={`cp-field ${touched.section && !formData.section ? 'has-error' : formData.section ? 'has-value' : ''}`}>
              <label className="cp-label">Section <span className="cp-required">*</span></label>
              <input
                className="cp-input" type="text" name="section" required
                value={formData.section} onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g. A" maxLength={3}
              />
              {getFieldError('section') && <span className="cp-field-error">{getFieldError('section')}</span>}
            </div>
            <div className={`cp-field ${touched.mobile && getFieldError('mobile') ? 'has-error' : formData.mobile && /^\d{10}$/.test(formData.mobile) ? 'has-value' : ''}`}>
              <label className="cp-label">Mobile <span className="cp-required">*</span></label>
              <input
                className="cp-input" type="tel" name="mobile" required
                value={formData.mobile} onChange={handleChange} onBlur={handleBlur}
                placeholder="10-digit number" maxLength={10}
              />
              {getFieldError('mobile') && <span className="cp-field-error">{getFieldError('mobile')}</span>}
            </div>
          </div>

          {/* Alternate Email */}
          <div className={`cp-field ${formData.alternateEmail ? 'has-value' : ''}`}>
            <label className="cp-label">Alternate Email <span className="cp-optional">Optional</span></label>
            <input
              className="cp-input" type="email" name="alternateEmail"
              value={formData.alternateEmail} onChange={handleChange}
              placeholder="personal@example.com"
            />
          </div>

          {/* ── Role Type Picker ── */}
          <div className="cp-subrole-section">
            <label className="cp-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
              I am joining as <span className="cp-required">*</span>
            </label>
            <div className="cp-subrole-picker">
              <button
                type="button"
                className={`cp-subrole-btn ${formData.subRole === 'student' ? 'active' : ''}`}
                onClick={() => setFormData(f => ({ ...f, subRole: 'student' }))}
              >
                <span className="cp-subrole-icon">🎓</span>
                <span className="cp-subrole-title">Student</span>
                <span className="cp-subrole-desc">I am a learner participating in events</span>
              </button>
              <button
                type="button"
                className={`cp-subrole-btn mentor ${formData.subRole === 'mentor' ? 'active' : ''}`}
                onClick={() => setFormData(f => ({ ...f, subRole: 'mentor', assignedMentor: '' }))}
              >
                <span className="cp-subrole-icon">🧑‍🏫</span>
                <span className="cp-subrole-title">Mentor</span>
                <span className="cp-subrole-desc">I will guide and mentor students</span>
              </button>
            </div>

            {/* Student — Mentor picker */}
            {formData.subRole === 'student' && (
              <div className="cp-field" style={{ marginTop: '0.875rem' }}>
                <label className="cp-label">
                  Assign a Mentor <span className="cp-optional">Optional</span>
                </label>
                <Select
                  className="cp-input cp-select" name="assignedMentor"
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
                  <p>Your Mentor Dashboard will be activated after a Super Admin reviews and approves your account. You can still browse events in the meantime.</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className="cp-submit" disabled={loading}>
            {loading ? (
              <><span className="cp-spin" /> Saving Profile...</>
            ) : (
              <>
                Complete Profile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
