import Select from './ui/Select';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Loader from './Loader';
import { API_URL } from '../config';
import { ToastContainer, useToast } from './Toast';
import {
  Users,
  UserCheck,
  Shield,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  Activity,
  Calendar,
  Filter,
  ArrowLeft,
  Mail,
  UserPlus,
  BookOpen,
  Phone,
  GraduationCap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Tabs / Navigation
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'admins', 'coordinators', 'analytics'

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const tableTopRef = useRef(null);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (tableTopRef.current) {
      // Get the element's position relative to the viewport + current scroll position, minus a 100px offset for the sticky TopNav
      const y = tableTopRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Read ?action= and ?tab= from URL (sidebar deep-links) ──
  useEffect(() => {
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    if (action === 'create') {
      setShowCreateModal(true);
      setSearchParams({}, { replace: true });
    }
    if (tab === 'analytics') {
      setActiveTab('analytics');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);


  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    subRole: 'student', // 'student' | 'mentor'
    assignedMentor: '',
    department: '',
    year: '',
    registerNumber: '',
    mobile: '',
    isProfileComplete: true
  });
  const [submitting, setSubmitting] = useState(false);

  // Available mentors for student assignment
  const [availableMentors, setAvailableMentors] = useState([]);

  const fetchMentors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/mentors`, { withCredentials: true });
      if (res.data.success) setAvailableMentors(res.data.mentors);
    } catch { /* non-critical */ }
  };

  // Toast / Notification
  const { toasts, showToast, removeToast } = useToast();

  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { userId, name }
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ESC key to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowEditModal(false);
        setShowDetailModal(false);
        setDeleteConfirm(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  // Restrict body scroll when any modal is open
  useEffect(() => {
    if (showCreateModal || showEditModal || showDetailModal || deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showCreateModal, showEditModal, showDetailModal, deleteConfirm]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError('');

      // Fetch users
      const usersRes = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
      if (usersRes.data.success) {
        setUsers(usersRes.data.users);
      }

      // Fetch audit logs for recent activity
      try {
        const logsRes = await axios.get(`${API_URL}/api/admin/audit-logs`, { withCredentials: true });
        if (logsRes.data.success) {
          // Filter logs to user-related activities or just show recent system logs
          const userLogs = logsRes.data.logs.filter(log =>
            log.action.includes('USER') ||
            log.action.includes('PROFILE') ||
            log.targetModel === 'User'
          );
          setLogs(userLogs.slice(0, 15)); // Keep latest 15 user logs
        }
      } catch (err) {
        console.warn('Failed to load audit logs. Proceeding without logs.', err);
      }

    } catch (err) {
      setError('Failed to load dashboard data. Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(true);
    setRefreshing(false);
  };

  // Create User Handler
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/users`, formData, { withCredentials: true });
      if (res.data.success) {
        setShowCreateModal(false);
        resetForm();
        showToast('User created successfully', 'success');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit User Handler
  const handleEditUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${selectedUser._id}`, formData, { withCredentials: true });
      if (res.data.success) {
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        showToast('User updated successfully', 'success');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User Handler — opens inline confirm modal first
  const handleDeleteUser = (userId, name) => {
    setDeleteConfirm({ userId, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await axios.delete(`${API_URL}/api/admin/users/${deleteConfirm.userId}`, { withCredentials: true });
      if (res.data.success) {
        showToast(`"${deleteConfirm.name}" was permanently deleted`, 'success');
        setDeleteConfirm(null);
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      subRole: user.subRole || '',
      assignedMentor: user.assignedMentor?._id || user.assignedMentor || '',
      department: user.department || '',
      year: user.year || '',
      registerNumber: user.registerNumber || '',
      mobile: user.mobile || '',
      isProfileComplete: user.isProfileComplete !== undefined ? user.isProfileComplete : true
    });
    if (user.role === 'user' || user.role === 'mentor') fetchMentors();
    setShowEditModal(true);
  };

  const openDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'user',
      subRole: 'student',
      assignedMentor: '',
      department: '',
      year: '',
      registerNumber: '',
      mobile: '',
      isProfileComplete: true
    });
  };

  // Approve / Reject Mentor
  const handleApproveMentor = async (userId, status) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/admin/users/${userId}/mentor-approval`,
        { status },
        { withCredentials: true }
      );
      if (res.data.success) {
        showToast(`Mentor ${status === 'approved' ? 'approved' : 'rejected'} successfully`, status === 'approved' ? 'success' : 'warning');
        fetchDashboardData(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Approval action failed', 'error');
    }
  };

  // Open Create Modal and prefetch mentors list
  const openCreateModal = () => {
    resetForm();
    fetchMentors();
    setShowCreateModal(true);
  };

  // ── Analytics Computations ──
  const totalUsers = users.length;
  const superAdminCount = users.filter(u => u.role === 'superadmin').length;
  const adminT1Count = users.filter(u => u.role === 'admin_t1').length;
  const adminT2Count = users.filter(u => u.role === 'admin_t2').length;
  const standardUserCount = users.filter(u => u.role === 'user').length;

  const completedProfiles = users.filter(u => u.isProfileComplete).length;
  const pendingProfiles = totalUsers - completedProfiles;
  const completionRate = totalUsers > 0 ? Math.round((completedProfiles / totalUsers) * 100) : 0;

  const pendingMentorsCount = users.filter(u => u.subRole === 'mentor' && u.mentorStatus === 'pending').length;

  // New users in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsersCount = users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length;

  // Department distribution logic
  const getDeptStats = () => {
    const counts = {};
    users.forEach(u => {
      const dept = u.department?.trim().toUpperCase() || 'UNSPECIFIED';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    // Sort and return top 5
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const deptStats = getDeptStats();

  // Role Percentage for Donut Chart
  const superAdminPct = totalUsers > 0 ? (superAdminCount / totalUsers) * 100 : 0;
  const adminT1Pct = totalUsers > 0 ? (adminT1Count / totalUsers) * 100 : 0;
  const adminT2Pct = totalUsers > 0 ? (adminT2Count / totalUsers) * 100 : 0;
  const userPct = totalUsers > 0 ? (standardUserCount / totalUsers) * 100 : 0;

  // Get unique departments for filtering
  const allDepartments = Array.from(
    new Set(users.map(u => u.department?.trim().toUpperCase()).filter(Boolean))
  ).sort();

  // ── Filters & Search Execution ──
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.registerNumber && user.registerNumber.toLowerCase().includes(searchLower)) ||
      (user.mobile && user.mobile.includes(searchLower));

    // Role filter
    const matchesRole =
      roleFilter === 'all' ? true : user.role === roleFilter;

    // Tab navigation quick filter
    const matchesTab =
      activeTab === 'all' ? true :
        activeTab === 'superadmins' ? user.role === 'superadmin' :
          activeTab === 'admint1' ? user.role === 'admin_t1' :
            activeTab === 'admint2' ? user.role === 'admin_t2' :
              activeTab === 'approvals' ? (user.subRole === 'mentor' && user.mentorStatus === 'pending') : true;

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ? true :
        statusFilter === 'completed' ? user.isProfileComplete : !user.isProfileComplete;

    // Department filter
    const matchesDept =
      deptFilter === 'all' ? true :
        user.department?.trim().toUpperCase() === deptFilter;

    return matchesSearch && matchesRole && matchesTab && matchesStatus && matchesDept;
  });

  // Sorting Execution
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'name-asc') {
      return (a.name || '').localeCompare(b.name || '');
    }
    if (sortBy === 'name-desc') {
      return (b.name || '').localeCompare(a.name || '');
    }
    if (sortBy === 'completion') {
      return (b.isProfileComplete ? 1 : 0) - (a.isProfileComplete ? 1 : 0);
    }
    return 0;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, deptFilter, activeTab, sortBy]);

  // Pagination Logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  if (loading) return <Loader fullScreen text="Loading user management dashboard..." />;
  if (error) return (
    <div className="ae-error animate-fade-in">
      <AlertTriangle className="ae-error-icon" size={48} />
      <h2>{error}</h2>
      <button className="btn btn-primary" onClick={() => navigate('/admin/events')}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        Back to Admin Panel
      </button>
    </div>
  );

  return (
    <>
      <div className="aud-container page-enter">
        <ToastContainer toasts={toasts} onClose={removeToast} />
        {/* Header */}
        <header className="ae-header animate-fade-in">
          <div className="ae-header-left">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/events')}>
              <ArrowLeft size={14} />
              Events Dashboard
            </button>
            <div>
              <h1 className="ae-title">User Analytics & Management</h1>
              <p className="ae-subtitle">Overview of platform accounts, roles, and statistics</p>
            </div>
          </div>
          <div className="ae-header-right">
            <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw size={14} style={{ marginRight: '4px', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
              {refreshing ? 'Syncing...' : 'Sync'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
              <Plus size={16} />
              Create User
            </button>
          </div>
        </header>

        <section className="aud-stats-grid animate-fade-in-up">
          <div className="aud-stat-card stagger-1">
            <div className="aud-stat-icon"><Users size={22} /></div>
            <div className="aud-stat-content">
              <div className="aud-stat-label">Total Accounts</div>
              <div className="aud-stat-value">{totalUsers}</div>
              <div className="aud-stat-sub">
                <span style={{ color: 'var(--clr-success)', fontWeight: '600' }}>+{newUsersCount}</span> new this week
              </div>
            </div>
          </div>
          <div className="aud-stat-card admin-card stagger-2">
            <div className="aud-stat-icon"><Shield size={22} /></div>
            <div className="aud-stat-content">
              <div className="aud-stat-label">Super Admins</div>
              <div className="aud-stat-value">{superAdminCount}</div>
              <div className="aud-stat-sub">System access control</div>
            </div>
          </div>
          <div className="aud-stat-card coordinator-card stagger-3">
            <div className="aud-stat-icon"><UserCheck size={22} /></div>
            <div className="aud-stat-content">
              <div className="aud-stat-label">Tiered Admins</div>
              <div className="aud-stat-value">{adminT1Count + adminT2Count}</div>
              <div className="aud-stat-sub">Event managers and checkers</div>
            </div>
          </div>
          <div className="aud-stat-card complete-card stagger-4">
            <div className="aud-stat-icon"><Check size={22} /></div>
            <div className="aud-stat-content">
              <div className="aud-stat-label">Profile Setup</div>
              <div className="aud-stat-value">{completionRate}%</div>
              <div className="aud-stat-sub">
                <strong>{completedProfiles}</strong> set / <strong>{pendingProfiles}</strong> pending
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="ae-tabs-container animate-fade-in-up" style={{ margin: '0 0 1.5rem 0' }}>
          <div className="ae-tabs">
            <button
              className={`ae-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Accounts
              <span className="ae-tab-count">{totalUsers}</span>
            </button>
            <button
              className={`ae-tab ${activeTab === 'superadmins' ? 'active' : ''}`}
              onClick={() => setActiveTab('superadmins')}
            >
              Super Admins
              <span className="ae-tab-count">{superAdminCount}</span>
            </button>
            <button
              className={`ae-tab ${activeTab === 'admint1' ? 'active' : ''}`}
              onClick={() => setActiveTab('admint1')}
            >
              Admin T1
              <span className="ae-tab-count">{adminT1Count}</span>
            </button>
            <button
              className={`ae-tab ${activeTab === 'admint2' ? 'active' : ''}`}
              onClick={() => setActiveTab('admint2')}
            >
              Admin T2
              <span className="ae-tab-count">{adminT2Count}</span>
            </button>
            <button
              className={`ae-tab ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              Mentor Approvals
              <span className={`ae-tab-count ${pendingMentorsCount > 0 ? 'limit-reached' : ''}`}>
                {pendingMentorsCount}
              </span>
            </button>
            <button
              className={`ae-tab ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Deep Analytics
              <span className="badge badge-accent" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>Charts</span>
            </button>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        {activeTab === 'analytics' ? (
          <div className="animate-fade-in">
            <div className="aud-analytics-tab-grid">
              {/* Pie/Donut Chart for Roles */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <Shield size={18} />
                    Role Distribution
                  </h3>
                </div>
                <div className="aud-chart-container">
                  <div style={{
                    position: 'relative',
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    background: totalUsers > 0
                      ? `conic-gradient(var(--clr-danger) 0% ${superAdminPct}%, var(--clr-warning) ${superAdminPct}% ${superAdminPct + adminT1Pct}%, #8b5cf6 ${superAdminPct + adminT1Pct}% ${superAdminPct + adminT1Pct + adminT2Pct}%, var(--clr-accent) ${superAdminPct + adminT1Pct + adminT2Pct}% 100%)`
                      : 'var(--clr-surface-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1), var(--shadow-sm)'
                  }}>
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: 'var(--clr-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--clr-text-heading)' }}>
                        {totalUsers}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Accounts
                      </span>
                    </div>
                  </div>

                  <div className="aud-chart-legends">
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-danger)' }} />
                      <span>Super Admin ({superAdminCount})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-warning)' }} />
                      <span>Admin T1 ({adminT1Count})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: '#8b5cf6' }} />
                      <span>Admin T2 ({adminT2Count})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-accent)' }} />
                      <span>Users ({standardUserCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Circular Progress for Profile Completion */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <UserCheck size={18} />
                    Profile Completion
                  </h3>
                </div>
                <div className="aud-chart-container" style={{ minHeight: '228px' }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" className="animate-scale-in">
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="var(--clr-surface-3)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke="var(--clr-success)"
                      strokeWidth="10"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 - (completionRate / 100) * (2 * Math.PI * 50)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                    <text
                      x="60"
                      y="66"
                      textAnchor="middle"
                      fill="var(--clr-text-heading)"
                      fontSize="20"
                      fontWeight="bold"
                      fontFamily="var(--font-heading)"
                    >
                      {completionRate}%
                    </text>
                  </svg>
                  <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--clr-text-subtle)' }}>
                    <div><strong>{completedProfiles}</strong> profiles fully populated</div>
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{pendingProfiles} accounts missing core details</div>
                  </div>
                </div>
              </div>

              {/* Department bar chart */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <BookOpen size={18} />
                    Top Departments
                  </h3>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '228px' }}>
                  {deptStats.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                      No department data set.
                    </div>
                  ) : (
                    <div className="aud-bar-chart">
                      {deptStats.map((dept, index) => {
                        const pct = totalUsers > 0 ? (dept.count / totalUsers) * 100 : 0;
                        return (
                          <div className="aud-bar-row" key={dept.name}>
                            <div className="aud-bar-header">
                              <span>{dept.name}</span>
                              <span style={{ color: 'var(--clr-text-muted)' }}>
                                {dept.count} {dept.count === 1 ? 'user' : 'users'} ({Math.round(pct)}%)
                              </span>
                            </div>
                            <div className="aud-bar-bg">
                              <div
                                className="aud-bar-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: index === 0 ? 'var(--clr-accent)' : index === 1 ? 'var(--clr-accent-2)' : 'var(--clr-text-muted)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Registration activity summary */}
            <div className="aud-card animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              <div className="aud-card-header">
                <h3 className="aud-card-title">
                  <Activity size={18} />
                  User Administration Log (Recent Operations)
                </h3>
              </div>
              <div className="aud-logs-list" style={{ maxHeight: '400px' }}>
                {logs.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                    No recent user-related actions recorded in logs.
                  </div>
                ) : (
                  logs.map(log => (
                    <div className="aud-log-item" key={log._id}>
                      <div className="aud-log-header">
                        <span className="aud-log-action">{log.action}</span>
                        <span className="aud-log-time">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="aud-log-desc">{log.details}</div>
                      <div className="aud-log-user">
                        Actor: {log.user ? `${log.user.name} (${log.user.email})` : 'System'} • IP: {log.ipAddress || 'N/A'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="aud-grid animate-fade-in-up">
            {/* Main User List Card */}
            <div className="aud-card" ref={tableTopRef}>
              {/* Search & Filter Header bar */}
              <div className="aud-filter-bar">
                <div className="aud-search-wrapper">
                  <Search className="aud-search-icon" size={16} />
                  <input
                    type="text"
                    placeholder="Search by name, email, register no., mobile..."
                    className="aud-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--clr-text-muted)' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={14} style={{ color: 'var(--clr-text-muted)' }} />
                  <select
                    className="aud-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Profiles</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Department filter */}
                <select
                  className="aud-select"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                >
                  <option value="all">All Depts</option>
                  {allDepartments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                {/* Sorting filter */}
                <select
                  className="aud-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="completion">Completion</option>
                </select>
              </div>

              {/* User List Table */}
              <div className="aud-table-wrapper">
                <table className="aud-table">
                  <thead>
                    <tr>
                      <th>User Details</th>
                      <th>Role</th>
                      <th>Dept / Year</th>
                      <th>Reg No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshing ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid var(--clr-surface-3)', borderTopColor: 'var(--clr-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '12px' }} />
                          <p style={{ fontWeight: 500 }}>Refreshing user database...</p>
                        </td>
                      </tr>
                    ) : currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                          <Users size={32} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                          <p>No registered users found matching the filter criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user, rowIdx) => {
                        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                        const isMentor = user.role === 'mentor' || user.subRole === 'mentor';
                        const isStudent = user.subRole === 'student';
                        const isPendingMentor = isMentor && user.mentorStatus === 'pending';
                        return (
                          <tr key={user._id} className="aud-table-row" style={{ animationDelay: `${rowIdx * 0.03}s`, position: 'relative' }}>
                            <td className="aud-td-edit" onClick={() => openEditModal(user)} title="Click to edit">
                              <div className="aud-user-info">
                                <div
                                  className="aud-user-avatar aud-avatar-clickable"
                                  onClick={(e) => { e.stopPropagation(); openDetailModal(user); }}
                                  title="View profile"
                                >
                                  {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} onError={(e) => e.target.style.display = 'none'} />
                                  ) : initials}
                                </div>
                                <div className="aud-user-meta">
                                  <span className="aud-user-name">{user.name}</span>
                                  <span className="aud-user-email">{user.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="aud-td-edit" onClick={() => openEditModal(user)} title="Click to edit">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                <span style={{
                                  fontSize: '0.8rem',
                                  fontWeight: '700',
                                  letterSpacing: '0.02em',
                                  color: user.role === 'superadmin' ? '#dc2626'
                                    : user.role === 'admin_t1' ? '#d97706'
                                    : user.role === 'admin_t2' ? '#7c3aed'
                                    : isMentor ? '#10b981'
                                    : '#0ea5e9'
                                }}>
                                  {user.role === 'superadmin' ? 'Super Admin'
                                    : user.role === 'admin_t1' ? 'Admin T1'
                                    : user.role === 'admin_t2' ? 'Admin T2'
                                    : isMentor ? 'Mentor'
                                    : 'Student'}
                                </span>
                                {/* Mentor status pill */}
                                {isMentor && user.mentorStatus && (
                                  <span className={`aud-mentor-status-pill ${user.mentorStatus}`}>
                                    {user.mentorStatus === 'pending' && <Clock size={10} />}
                                    {user.mentorStatus === 'approved' && <CheckCircle size={10} />}
                                    {user.mentorStatus === 'rejected' && <XCircle size={10} />}
                                    {user.mentorStatus}
                                  </span>
                                )}
                                {/* Assigned mentor for students */}
                                {isStudent && user.assignedMentor && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <UserCheck size={10} /> {user.assignedMentor.name || user.assignedMentor}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="aud-td-edit" onClick={() => openEditModal(user)} title="Click to edit">
                              {user.department ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--clr-text-heading)' }}>
                                    {user.department}
                                  </span>
                                  {user.year && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: '500' }}>
                                      Year {user.year}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Not set</span>
                              )}
                            </td>
                            <td className="aud-td-edit" onClick={() => openEditModal(user)} title="Click to edit">
                              {user.registerNumber ? (
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--clr-text-heading)', letterSpacing: '0.02em' }}>
                                  {user.registerNumber}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>—</span>
                              )}
                              {/* Approve/Reject inline for pending mentors */}
                              {isPendingMentor && (
                                <div style={{ display: 'inline-flex', gap: '6px', marginLeft: '10px' }}>
                                  <button
                                    className="aud-row-action-btn approve"
                                    onClick={(e) => { e.stopPropagation(); handleApproveMentor(user._id, 'approved'); }}
                                    title="Approve Mentor"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    className="aud-row-action-btn reject"
                                    onClick={(e) => { e.stopPropagation(); handleApproveMentor(user._id, 'rejected'); }}
                                    title="Reject Mentor"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="aud-pagination">
                  <div className="pagination-info">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, sortedUsers.length)} of {sortedUsers.length} users
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Prev
                    </button>
                    <div className="page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                        if (
                          totalPages <= 7 ||
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} className="page-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Widgets */}
            <aside className="aud-widget">
              {/* Quick Analytics Summary Panel */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <Activity size={16} />
                    Role Distribution
                  </h3>
                </div>
                <div className="aud-chart-container" style={{ padding: '1.25rem' }}>
                  <div style={{
                    position: 'relative',
                    width: '130px',
                    height: '130px',
                    borderRadius: '50%',
                    background: totalUsers > 0
                      ? `conic-gradient(var(--clr-danger) 0% ${superAdminPct}%, var(--clr-warning) ${superAdminPct}% ${superAdminPct + adminT1Pct}%, #8b5cf6 ${superAdminPct + adminT1Pct}% ${superAdminPct + adminT1Pct + adminT2Pct}%, var(--clr-accent) ${superAdminPct + adminT1Pct + adminT2Pct}% 100%)`
                      : 'var(--clr-surface-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.08), var(--shadow-sm)'
                  }}>
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: 'var(--clr-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--clr-text-heading)' }}>
                        {totalUsers}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
                        Accounts
                      </span>
                    </div>
                  </div>

                  <div className="aud-chart-legends" style={{ marginTop: '0.75rem', gap: '8px 12px' }}>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-danger)' }} />
                      <span>Super Admin ({superAdminCount})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-warning)' }} />
                      <span>Admin T1 ({adminT1Count})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: '#8b5cf6' }} />
                      <span>Admin T2 ({adminT2Count})</span>
                    </div>
                    <div className="aud-legend-item">
                      <div className="aud-legend-color" style={{ background: 'var(--clr-accent)' }} />
                      <span>User ({standardUserCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department stats preview */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <BookOpen size={16} />
                    Top Departments
                  </h3>
                </div>
                <div style={{ padding: '1.25rem', minHeight: '120px' }}>
                  {deptStats.length === 0 ? (
                    <p style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>No department data available</p>
                  ) : (
                    <div className="aud-bar-chart" style={{ gap: '8px' }}>
                      {deptStats.slice(0, 3).map((dept, index) => {
                        const pct = totalUsers > 0 ? (dept.count / totalUsers) * 100 : 0;
                        return (
                          <div className="aud-bar-row" key={dept.name} style={{ gap: '2px' }}>
                            <div className="aud-bar-header" style={{ fontSize: '0.75rem' }}>
                              <span>{dept.name}</span>
                              <span>{dept.count}</span>
                            </div>
                            <div className="aud-bar-bg" style={{ height: '6px' }}>
                              <div
                                className="aud-bar-fill"
                                style={{ width: `${pct}%`, background: index === 0 ? 'var(--clr-accent)' : 'var(--clr-accent-2)' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent user log alerts */}
              <div className="aud-card">
                <div className="aud-card-header">
                  <h3 className="aud-card-title">
                    <Activity size={16} />
                    Recent Actions
                  </h3>
                </div>
                <div className="aud-logs-list" style={{ maxHeight: '240px', padding: '0.5rem 1rem' }}>
                  {logs.length === 0 ? (
                    <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.78rem' }}>
                      No user updates log.
                    </div>
                  ) : (
                    logs.slice(0, 5).map(log => (
                      <div className="aud-log-item" key={log._id} style={{ padding: '8px 0' }}>
                        <div className="aud-log-header">
                          <span className="aud-log-action" style={{ fontSize: '0.62rem' }}>{log.action.replace('USER', '').replace('PROFILE', '').trim() || log.action}</span>
                          <span className="aud-log-time" style={{ fontSize: '0.62rem' }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="aud-log-desc" style={{ fontSize: '0.75rem' }}>{log.details}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && createPortal(
        <div className="aud-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="aud-modal aud-delete-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ padding: '2rem 1.5rem 1rem' }}>
              <div className="aud-delete-icon-wrap">
                <Trash2 size={24} style={{ color: 'var(--clr-danger)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--clr-text-heading)', margin: '0.75rem 0 0.375rem' }}>
                Delete Account?
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-subtle)', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
                You are about to permanently delete <strong style={{ color: 'var(--clr-text-heading)' }}>"{deleteConfirm.name}"</strong>. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  style={{ minWidth: '100px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm aud-delete-confirm-btn"
                  onClick={confirmDelete}
                  disabled={deleting}
                  style={{ minWidth: '100px' }}
                >
                  {deleting ? (
                    <><span className="aud-spin" /> Deleting...</>
                  ) : (
                    <><Trash2 size={14} /> Delete Permanently</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        , document.body)}

      {/* CREATE USER MODAL */}
      {showCreateModal && createPortal(
        <div className="aud-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="aud-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aud-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <UserPlus size={20} />
                Create New User
              </h3>
              <button className="aud-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="aud-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                  Manually registered users can bypass standard setup and log in using their matching Google account email.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="e.g. name@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Account Type</label>
                    <Select
                      name="role"
                      value={formData.role === 'user' || formData.role === 'mentor' ? 'user' : formData.role}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({ ...formData, role: val, subRole: val === 'user' ? (formData.subRole || 'student') : '' });
                      }}
                    >
                      <option value="user">Student / Mentor</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin_t1">Admin T1</option>
                      <option value="admin_t2">Admin T2</option>
                    </Select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <Select
                      name="department"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Dept...</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="IT">IT</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="ACT">ACT</option>
                      <option value="VLSI">VLSI</option>
                      <option value="AIML">AIML</option>
                      <option value="AIDS">AIDS</option>
                      <option value="CYBER">CYBER</option>
                      <option value="AUTO">AUTO</option>
                    </Select>
                  </div>
                </div>

                {/* ── Student / Mentor Sub-Role Picker ── */}
                {(formData.role === 'user') && (
                  <div className="aud-subrole-section">
                    <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Select Sub-Role *</label>
                    <div className="aud-subrole-picker">
                      <button
                        type="button"
                        className={`aud-subrole-btn ${formData.subRole === 'student' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, subRole: 'student' })}
                      >
                        <GraduationCap size={20} />
                        <span>Student</span>
                        <small>Learner account, can be placed under a mentor</small>
                      </button>
                      <button
                        type="button"
                        className={`aud-subrole-btn ${formData.subRole === 'mentor' ? 'active mentor' : ''}`}
                        onClick={() => setFormData({ ...formData, subRole: 'mentor', assignedMentor: '' })}
                      >
                        <UserCheck size={20} />
                        <span>Mentor</span>
                        <small>Requires Super Admin approval to access Mentor Dashboard</small>
                      </button>
                    </div>

                    {/* Student — Mentor Assignment */}
                    {formData.subRole === 'student' && (
                      <div className="form-group" style={{ marginTop: '0.75rem' }}>
                        <label className="form-label">
                          Assign Mentor <span style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <Select
                          name="assignedMentor"
                          value={formData.assignedMentor}
                          onChange={e => setFormData({ ...formData, assignedMentor: e.target.value })}
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

                    {/* Mentor — Approval Notice */}
                    {formData.subRole === 'mentor' && (
                      <div className="aud-mentor-notice">
                        <Clock size={16} style={{ flexShrink: 0, color: '#d97706', marginTop: '2px' }} />
                        <div>
                          <strong>Pending Super Admin Approval</strong>
                          <p>After creation, this account will be in <em>pending</em> status. The Mentor Dashboard will only unlock once a Super Admin approves it from the User Management panel.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <Select
                      name="year"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                    >
                      <option value="">Select Year...</option>
                      <option value="I">I (First)</option>
                      <option value="II">II (Second)</option>
                      <option value="III">III (Third)</option>
                      <option value="IV">IV (Fourth)</option>
                      <option value="V">V (Fifth)</option>
                    </Select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Register Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 727624BEA001"
                      value={formData.registerNumber}
                      onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="aud-modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
        , document.body)}

      {/* EDIT USER MODAL */}
      {showEditModal && createPortal(
        <div className="aud-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="aud-modal aud-edit-modal" onClick={(e) => e.stopPropagation()}>

            {/* ── Header ── */}
            <div className="aem-header">
              <span className="aem-title">Edit Information</span>
              <button className="aud-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              <div className="aem-body">

                {/* ── Profile strip ── */}
                <div className="aem-profile-strip">
                  <div className="aem-profile-left">
                    <div className="aem-avatar">
                      {selectedUser?.profilePicture ? (
                        <img src={selectedUser.profilePicture} alt={selectedUser?.name} />
                      ) : (
                        (selectedUser?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <div className="aem-profile-name">{selectedUser?.name || '—'}</div>
                      <div className="aem-profile-sub">{selectedUser?.email || ''}</div>
                    </div>
                  </div>
                  <div className="aem-profile-actions">
                    <button type="button" className="aem-change-btn" title="Change profile photo">
                      <Edit3 size={13} /> Change Profile
                    </button>
                    <button
                      type="button"
                      className="aem-delete-btn"
                      onClick={(e) => { e.preventDefault(); setShowEditModal(false); handleDeleteUser(selectedUser._id, selectedUser.name || selectedUser.email); }}
                      title="Delete account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* ── Two-column fields ── */}
                <div className="aem-fields-grid">

                  <div className="aem-field-group">
                    <label className="aem-label">Full Name *</label>
                    <input
                      type="text"
                      className="aem-input"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Email Address *</label>
                    <input
                      type="email"
                      className="aem-input"
                      required
                      placeholder="e.g. name@gmail.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Role</label>
                    <Select
                      name="role"
                      className="aem-input"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">Student</option>
                      <option value="superadmin">Super Admin</option>
                      <option value="admin_t1">Admin T1</option>
                      <option value="admin_t2">Admin T2</option>
                    </Select>
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Department</label>
                    <Select
                      name="department"
                      className="aem-input"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Dept...</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="IT">IT</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="ACT">ACT</option>
                      <option value="VLSI">VLSI</option>
                      <option value="AIML">AIML</option>
                      <option value="AIDS">AIDS</option>
                      <option value="CYBER">CYBER</option>
                      <option value="AUTO">AUTO</option>
                    </Select>
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Register Number</label>
                    <input
                      type="text"
                      className="aem-input"
                      placeholder="e.g. 727624BEA001"
                      value={formData.registerNumber}
                      onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                    />
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Mobile Number</label>
                    <input
                      type="text"
                      className="aem-input"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>

                  <div className="aem-field-group">
                    <label className="aem-label">Year</label>
                    <Select
                      name="year"
                      className="aem-input"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                    >
                      <option value="">Select Year...</option>
                      <option value="I">I (First)</option>
                      <option value="II">II (Second)</option>
                      <option value="III">III (Third)</option>
                      <option value="IV">IV (Fourth)</option>
                      <option value="V">V (Fifth)</option>
                    </Select>
                  </div>

                  <div className="aem-field-group aem-checkbox-group">
                    <input
                      type="checkbox"
                      id="edit-profile-complete"
                      checked={formData.isProfileComplete}
                      onChange={e => setFormData({ ...formData, isProfileComplete: e.target.checked })}
                    />
                    <label htmlFor="edit-profile-complete" className="aem-label">
                      Profile Complete
                    </label>
                  </div>

                </div>
              </div>

              {/* ── Footer ── */}
              <div className="aem-footer">
                <button type="button" className="aem-cancel-btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="aem-save-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>

          </div>
        </div>
        , document.body)}

      {/* USER DETAIL MODAL */}


      {showDetailModal && selectedUser && createPortal(
        <div className="aud-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="aud-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="aud-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <Eye size={20} />
                User Account Profile
              </h3>
              <button className="aud-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="aud-modal-body">
              <div className="aud-profile-detail">
                {/* Large Avatar */}
                <div className="aud-profile-avatar-lg">
                  {selectedUser.profilePicture ? (
                    <img src={selectedUser.profilePicture} alt={selectedUser.name} />
                  ) : (
                    selectedUser.name ? selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
                  )}
                </div>

                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--clr-text-heading)', margin: '0.25rem 0' }}>{selectedUser.name}</h2>
                  <span className={`aud-role-badge ${selectedUser.role}`}>{selectedUser.role}</span>
                </div>

                <div className="aud-profile-fields">
                  <div className="aud-profile-field">
                    <div className="aud-field-label">Email Address</div>
                    <div className="aud-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} style={{ color: 'var(--clr-text-muted)' }} />
                      {selectedUser.email}
                    </div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Alternative Email</div>
                    <div className="aud-field-value">{selectedUser.alternateEmail || '-'}</div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Register Number</div>
                    <div className="aud-field-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{selectedUser.registerNumber || '-'}</div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Mobile Number</div>
                    <div className="aud-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} style={{ color: 'var(--clr-text-muted)' }} />
                      {selectedUser.mobile || '-'}
                    </div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Department / Year</div>
                    <div className="aud-field-value">
                      {selectedUser.department ? `${selectedUser.department} ${selectedUser.year ? `(Year ${selectedUser.year})` : ''}` : '-'}
                    </div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Section</div>
                    <div className="aud-field-value">{selectedUser.section || '-'}</div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Google Account Link</div>
                    <div className="aud-field-value" style={{ fontSize: '0.78rem' }}>
                      {selectedUser.googleId ? `Linked ID: ${selectedUser.googleId}` : 'Not linked yet'}
                    </div>
                  </div>

                  <div className="aud-profile-field">
                    <div className="aud-field-label">Registration Date</div>
                    <div className="aud-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--clr-text-muted)' }} />
                      {new Date(selectedUser.createdAt).toLocaleDateString()} {new Date(selectedUser.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="aud-modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedUser);
                }}
                style={{ color: 'var(--clr-accent)' }}
              >
                <Edit3 size={14} style={{ marginRight: '4px' }} />
                Edit Profile
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
        , document.body)}
    </>
  );
};

export default AdminUsers;
