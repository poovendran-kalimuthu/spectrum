import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import './JuryLogin.css';

const EvaluatorLogin = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/evaluator/login`, 
        { email, pin },
        { withCredentials: true }
      );
      
      if (res.data.success) {
        localStorage.setItem('evaluatorInfo', JSON.stringify(res.data.evaluator));
        navigate('/evaluator/portal');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jury-login-wrapper">
      {/* Decorative Blobs */}
      <div className="jury-bg-blob blob-1"></div>
      <div className="jury-bg-blob blob-2"></div>

      <div className="jury-login-card">
        <div className="jury-logo-area">
          <div className="jury-icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <h1 className="jury-title">Jury Portal</h1>
          <p className="jury-subtitle">Secure access for event evaluators and judges.</p>
        </div>
        
        {error && (
          <div className="jury-error animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="jury-form">
          <div className="jury-input-group">
            <label className="jury-label">Email Identifier</label>
            <div className="jury-input-wrapper">
              <input 
                type="email" 
                required
                className="jury-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@institution.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="jury-input-group">
            <label className="jury-label">Secure Access PIN</label>
            <div className="jury-input-wrapper">
              <input 
                type="password" 
                required
                maxLength={6}
                className="jury-input pin"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="jury-submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <svg className="ae-spin" viewBox="0 0 24 24"></svg>
                Verifying...
              </span>
            ) : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="jury-footer">
          <p>Confidential Evaluation System</p>
          <p style={{ opacity: 0.6 }}>Helix-26 Spectrum Management Platform</p>
        </div>
      </div>
    </div>
  );
};

export default EvaluatorLogin;
