import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from './Loader';
import { API_URL } from '../config';
import './CompleteProfile.css'; // Reusing for styling

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/${id}`, { withCredentials: true });
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        setError('Failed to load user profile or user not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <Loader fullScreen text="Loading Profile..." />;

  if (error || !user) {
    return (
      <div className="cp-wrapper">
        <div className="cp-card">
          <div className="cp-header">
            <h1>Error</h1>
            <p>{error || 'User not found'}</p>
          </div>
          <button onClick={() => navigate(-1)} className="cp-submit">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-wrapper">
      <div className="cp-card animate-scale-in">
        <div className="cp-header">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" style={{ width: 80, height: 80, borderRadius: '50%', marginBottom: 15 }} />
          ) : (
            <div className="cp-icon">👤</div>
          )}
          <h1>{user.name}</h1>
          <p>{user.registerNumber}</p>
        </div>

        <div className="cp-form">
          <div className="cp-form-row">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" type="text" value={user.department || 'Not Provided'} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Year & Section</label>
              <input className="form-input" type="text" value={(user.year && user.section) ? `${user.year} - ${user.section}` : 'Not Provided'} disabled />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={user.email || 'Not Provided'} disabled />
          </div>

          <button onClick={() => navigate(-1)} className="cp-submit">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
