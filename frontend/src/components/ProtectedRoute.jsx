import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
        if (res.data.success) {
          setAuthenticated(true);
        } else {
          handleUnauthenticated();
        }
      } catch (error) {
        handleUnauthenticated();
      } finally {
        setLoading(false);
      }
    };

    const handleUnauthenticated = () => {
      // Save the current path to redirect back after login
      sessionStorage.setItem('authRedirectUrl', location.pathname + location.search);
      setAuthenticated(false);
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return <Loader fullScreen text="Verifying authentication..." />;
  }

  if (!authenticated) {
    // Show a quick alert before navigating (optional, but requested by user)
    // In a real app, a toast would be better. For now, we'll just redirect.
    // The user specifically asked to "show you are not logged in"
    alert("You are not logged in. Redirecting to login page...");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
