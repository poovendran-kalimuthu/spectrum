import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Loader from './Loader';
import { API_URL } from '../config';
import './AppLayout.css';

const AppLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      if (res.data.success) {
        setUser(res.data.user);
        fetchPendingCount(res.data.user);
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async (currentUser) => {
    try {
      const docsRes = await axios.get(`${API_URL}/api/documents`, { withCredentials: true });
      if (docsRes.data.success) {
        const count = docsRes.data.documents.filter(d =>
          d.status === 'Pending' &&
          d.approvers.some(a => (a._id || a).toString() === currentUser._id.toString()) &&
          !d.approvalsReceived.some(ar => (ar._id || ar).toString() === currentUser._id.toString())
        ).length;
        setPendingApprovalsCount(count);
      }
    } catch {
      // silently fail — badge stays at 0
    }
  };

  if (loading) return <Loader fullScreen text="Loading..." />;

  return (
    <div className={`apl-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar user={user} onCollapse={setSidebarCollapsed} pendingApprovalsCount={pendingApprovalsCount} />
      <main className="apl-main page-enter">
        <TopNav user={user} />
        <div className="apl-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
