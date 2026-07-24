import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader';
import { API_URL } from '../config';
import './CompleteProfile.css'; // We can reuse the styling
import Select from './ui/Select';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL', 'ACT', 'VLSI', 'AIML', 'AIDS', 'CYBER', 'AUTO'];

const REQUIRED_FIELDS = ['name', 'registerNumber', 'department', 'mobile'];

const CreateMentorProfile = () => {
  const [formData, setFormData] = useState({
    name: '', registerNumber: '', department: 'CSE',
    mobile: '', alternateEmail: '',
    subRole: 'mentor'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const navigate = useNavigate();

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
    if (name === 'registerNumber' && !formData.registerNumber) return 'ID is required';
    if (name === 'name' && !formData.name) return 'Full name is required';
    return null;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setTouched(Object.fromEntries(REQUIRED_FIELDS.map(f => [f, true])));

    if (REQUIRED_FIELDS.some(f => !formData[f])) {
      setError('Please fill all required fields.');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true); setError('');
    try {
      const payload = {
        ...formData,
        subRole: 'mentor',
        mentorStatus: 'pending'
      };
      
      const res = await axios.put(`${API_URL}/api/auth/profile`, payload, { withCredentials: true });
      if (res.data.success) {
        navigate('/dashboard');
      }
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-wrapper">
      {loading && <Loader fullScreen text="Submitting Request..." />}

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
            <span className="cp-icon-emoji">🧑‍🏫</span>
          </div>
          <h1>Apply as Mentor</h1>
          <p>Complete your profile to join as a Spectrum Mentor</p>
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
              placeholder="e.g. Dr. Arun Kumar" autoComplete="name"
            />
            {getFieldError('name') && <span className="cp-field-error">{getFieldError('name')}</span>}
          </div>

          {/* Register Number / Employee ID */}
          <div className={`cp-field ${touched.registerNumber && !formData.registerNumber ? 'has-error' : formData.registerNumber ? 'has-value' : ''}`}>
            <label className="cp-label">Employee ID / Register No <span className="cp-required">*</span></label>
            <input
              className="cp-input" type="text" name="registerNumber" required
              value={formData.registerNumber} onChange={handleChange} onBlur={handleBlur}
              placeholder="e.g. EMP12345"
            />
            {getFieldError('registerNumber') && <span className="cp-field-error">{getFieldError('registerNumber')}</span>}
          </div>

          {/* Department */}
          <div className="cp-field has-value">
            <label className="cp-label">Department <span className="cp-required">*</span></label>
            <Select className="cp-input cp-select" name="department" value={formData.department} onChange={handleChange} required>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
          </div>

          {/* Mobile */}
          <div className={`cp-field ${touched.mobile && getFieldError('mobile') ? 'has-error' : formData.mobile && /^\d{10}$/.test(formData.mobile) ? 'has-value' : ''}`}>
            <label className="cp-label">Mobile <span className="cp-required">*</span></label>
            <input
              className="cp-input" type="tel" name="mobile" required
              value={formData.mobile} onChange={handleChange} onBlur={handleBlur}
              placeholder="10-digit number" maxLength={10}
            />
            {getFieldError('mobile') && <span className="cp-field-error">{getFieldError('mobile')}</span>}
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

          {/* Mentor — Approval notice */}
          <div className="cp-mentor-notice" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⏳</span>
            <div>
              <strong>Pending Super Admin Approval</strong>
              <p>Your Mentor Dashboard will be activated after a Super Admin reviews and approves your account. You can still access basic features in the meantime.</p>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="cp-submit" disabled={loading}>
            {loading ? (
              <><span className="cp-spin" /> Submitting...</>
            ) : (
              <>
                Submit Application
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Are you a Student?{' '}
          <span 
            onClick={() => navigate('/complete-profile')} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
          >
            Complete your profile here
          </span>
        </div>
      </div>
    </div>
  );
};

export default CreateMentorProfile;
