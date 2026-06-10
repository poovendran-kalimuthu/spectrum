import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Loader from './Loader';
import { API_URL } from '../config';
import { 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Calendar, 
  User, 
  Clock, 
  Globe, 
  X, 
  Eye, 
  Shield, 
  Copy, 
  Check,
  Filter,
  Activity,
  AlertTriangle,
  Users
} from 'lucide-react';
import './AdminAuditLogs.css';
import Select from './ui/Select';

const AdminAuditLogs = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interaction states
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [actionCategory, setActionCategory] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // ── Deep-link: ?tab= pre-sets the filter ──
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'restrictions') {
      setActionCategory('users'); // filter to user-related operations
      setSearchParams({}, { replace: true });
    } else if (tab === 'restrict-ops') {
      setActionCategory('critical'); // filter to critical/deletions
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/api/admin/audit-logs`, { withCredentials: true });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      setError('Failed to load audit logs. Admin access required.');
    } finally {
      setLoading(false);
    }
  };

  const copyPayloadToClipboard = (payload) => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to categorize log action for badge styling
  const getActionBadgeClass = (action) => {
    if (!action) return 'other';
    const act = String(action).toUpperCase();
    if (act.includes('CREATE')) return 'create';
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('DISQUALIFY')) return 'delete';
    if (act.includes('UPDATE') || act.includes('MOVE') || act.includes('TOGGLE') || act.includes('SHORTLIST') || act.includes('REVERT')) return 'update';
    if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('AUTH')) return 'auth';
    return 'other';
  };

  // ── Metrics computations ──
  const totalLogs = logs.length;
  
  const criticalActionsCount = logs.filter(log => {
    if (!log.action) return false;
    const act = String(log.action).toUpperCase();
    return act.includes('DELETE') || act.includes('DISQUALIFY') || act.includes('REMOVE');
  }).length;

  const uniqueActorsCount = new Set(
    logs.map(log => log.user?._id).filter(Boolean)
  ).size;

  const systemActionsCount = logs.filter(log => !log.user).length;

  // ── Filter & Search Logic ──
  const filteredLogs = logs.filter(log => {
    // 1. Search Query
    const query = searchTerm.toLowerCase();
    const actorName = log.user?.name || '';
    const actorEmail = log.user?.email || '';
    const details = log.details || '';
    const action = log.action || '';
    const targetName = log.targetName || '';
    const ip = log.ipAddress || '';

    const matchesSearch = 
      actorName.toLowerCase().includes(query) ||
      actorEmail.toLowerCase().includes(query) ||
      details.toLowerCase().includes(query) ||
      action.toLowerCase().includes(query) ||
      targetName.toLowerCase().includes(query) ||
      ip.includes(query);

    // 2. Action Category Filter
    let matchesCategory = true;
    if (actionCategory !== 'all') {
      const act = String(action || '').toUpperCase();
      if (actionCategory === 'events') {
        matchesCategory = act.includes('EVENT');
      } else if (actionCategory === 'users') {
        matchesCategory = act.includes('USER') || act.includes('PROFILE');
      } else if (actionCategory === 'registrations') {
        matchesCategory = act.includes('REGISTRATION') || act.includes('SHORTLIST') || act.includes('ROUND') || act.includes('WINNER') || act.includes('DISQUALIFY');
      } else if (actionCategory === 'evaluators') {
        matchesCategory = act.includes('EVALUATOR');
      } else if (actionCategory === 'critical') {
        matchesCategory = act.includes('DELETE') || act.includes('DISQUALIFY');
      }
    }

    // 3. Time Filter
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const logDate = new Date(log.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - logDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeFilter === 'today') {
        matchesTime = logDate.toDateString() === now.toDateString();
      } else if (timeFilter === '3days') {
        matchesTime = diffDays <= 3;
      } else if (timeFilter === '7days') {
        matchesTime = diffDays <= 7;
      }
    }

    return matchesSearch && matchesCategory && matchesTime;
  });

  // Sorting
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  if (loading) return <Loader fullScreen text="Loading audit logs..." />;
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
    <div className="aal-container page-enter">
      {/* Header */}
      <header className="ae-header glass animate-fade-in" style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/events')}>
            <ArrowLeft size={14} />
            Events Dashboard
          </button>
          <div>
            <h1 className="ae-title">Security & Audit Logs</h1>
            <p className="ae-subtitle">Full historical logs of administrative operations and updates</p>
          </div>
        </div>
        <div className="ae-header-right">
          <button className="btn btn-primary btn-sm" onClick={fetchLogs}>
            <RefreshCw size={14} style={{ marginRight: '4px' }} />
            Refresh Logs
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="aal-stats-grid animate-fade-in-up">
        {/* Total logs */}
        <div className="aal-stat-card">
          <div className="aal-stat-icon">
            <Activity size={22} />
          </div>
          <div className="aal-stat-content">
            <div className="aal-stat-label">Total Logged Actions</div>
            <div className="aal-stat-value">{totalLogs}</div>
            <div className="aal-stat-sub">
              Historical changes stored
            </div>
          </div>
        </div>

        {/* Critical Actions */}
        <div className="aal-stat-card security-card">
          <div className="aal-stat-icon">
            <ShieldAlert size={22} />
          </div>
          <div className="aal-stat-content">
            <div className="aal-stat-label">Critical / Deletions</div>
            <div className="aal-stat-value">{criticalActionsCount}</div>
            <div className="aal-stat-sub" style={{ color: 'var(--clr-danger)' }}>
              Requires attention
            </div>
          </div>
        </div>

        {/* Unique Operators */}
        <div className="aal-stat-card actors-card">
          <div className="aal-stat-icon">
            <Users size={22} />
          </div>
          <div className="aal-stat-content">
            <div className="aal-stat-label">Active Operators</div>
            <div className="aal-stat-value">{uniqueActorsCount}</div>
            <div className="aal-stat-sub">
              Admins & Coordinators
            </div>
          </div>
        </div>

        {/* System Operations */}
        <div className="aal-stat-card system-card">
          <div className="aal-stat-icon">
            <Shield size={22} />
          </div>
          <div className="aal-stat-content">
            <div className="aal-stat-label">System Automated</div>
            <div className="aal-stat-value">{systemActionsCount}</div>
            <div className="aal-stat-sub">
              Triggered automatically
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Table Card */}
      <div className="aal-card animate-fade-in-up">
        <div className="aal-filter-bar">
          {/* Search bar */}
          <div className="aal-search-wrapper">
            <Search className="aal-search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by actor, email, action, detail, target, IP..." 
              className="aal-search-input"
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

          {/* Action Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--clr-text-muted)' }} />
            <Select 
              className="aal-select"
              value={actionCategory}
              onChange={(e) => setActionCategory(e.target.value)}
            >
              <option value="all">All Action Types</option>
              <option value="events">Event Configurations</option>
              <option value="users">User Accounts</option>
              <option value="registrations">Registrations & Scoring</option>
              <option value="evaluators">Evaluators</option>
              <option value="critical">Critical (Deletions)</option>
            </Select>
          </div>

          {/* Time Filter */}
          <Select 
            className="aal-select"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="all">All Historical Logs</option>
            <option value="today">Today</option>
            <option value="3days">Last 3 Days</option>
            <option value="7days">Last 7 Days</option>
          </Select>

          {/* Sort Filter */}
          <Select 
            className="aal-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </Select>
        </div>

        {/* Table wrapper */}
        <div className="aal-table-wrapper">
          <table className="aal-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator (Actor)</th>
                <th>Action Code</th>
                <th>Operation details</th>
                <th>IP Address</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                    <Activity size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>No audit logs match your filtering criteria.</p>
                  </td>
                </tr>
              ) : (
                sortedLogs.map(log => (
                  <tr key={log._id} onClick={() => setSelectedLog(log)}>
                    <td className="aal-timestamp">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      {log.user ? (
                        <div className="aal-actor-cell">
                          <span className="aal-actor-name">{log.user.name}</span>
                          <span className="aal-actor-email">{log.user.email}</span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: '600', color: 'var(--clr-warning)' }}>SYSTEM</span>
                      )}
                    </td>
                    <td>
                      <span className={`aal-action-badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <div className="aal-details-text" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="aal-ip-address">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Globe size={12} />
                        {log.ipAddress || '-'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn btn-ghost btn-icon-sm"
                          title="View Details JSON"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="aal-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="aal-modal glass" onClick={e => e.stopPropagation()}>
            <div className="aal-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <Shield size={20} />
                Operation Audit Details
              </h3>
              <button className="aal-modal-close" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="aal-modal-body">
              {/* Info Grid */}
              <div className="aal-detail-section">
                <div className="aal-detail-grid">
                  <div className="aal-detail-field">
                    <span className="aal-field-label">Action / Operation Code</span>
                    <span className="aal-field-value" style={{ display: 'flex', alignItems: 'center', marginTop: '3px' }}>
                      <span className={`aal-action-badge ${getActionBadgeClass(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                    </span>
                  </div>

                  <div className="aal-detail-field">
                    <span className="aal-field-label">Timestamp</span>
                    <span className="aal-field-value">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="aal-detail-field">
                    <span className="aal-field-label">Operator (Actor)</span>
                    <span className="aal-field-value">
                      {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System'}
                    </span>
                  </div>

                  <div className="aal-detail-field">
                    <span className="aal-field-label">IP Address</span>
                    <span className="aal-field-value">{selectedLog.ipAddress || 'Unknown'}</span>
                  </div>

                  <div className="aal-detail-field">
                    <span className="aal-field-label">Target Name</span>
                    <span className="aal-field-value">{selectedLog.targetName || 'N/A'}</span>
                  </div>

                  <div className="aal-detail-field">
                    <span className="aal-field-label">Target Reference</span>
                    <span className="aal-field-value">
                      {selectedLog.targetModel ? `${selectedLog.targetModel} ID: ` : 'N/A'}
                      <code style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>
                        {selectedLog.targetId || 'None'}
                      </code>
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--clr-border-subtle)' }}>
                  <span className="aal-field-label">Operational Details</span>
                  <span className="aal-field-value" style={{ display: 'block', color: 'var(--clr-text-heading)', marginTop: '4px', lineHeight: '1.5' }}>
                    {selectedLog.details}
                  </span>
                </div>
              </div>

              {/* JSON Payload Display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="aal-field-label" style={{ margin: 0 }}>Payload Data</span>
                {selectedLog.payload && (
                  <button 
                    className="btn btn-ghost btn-xs"
                    onClick={() => copyPayloadToClipboard(selectedLog.payload)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copied ? <Check size={12} style={{ color: 'var(--clr-success)' }} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                )}
              </div>

              {selectedLog.payload ? (
                <pre className="aal-payload-pre">
                  {(() => {
                    let data = selectedLog.payload;
                    if (typeof data === 'string') {
                      try { data = JSON.parse(data); } catch (e) { /* keep as string if not JSON */ }
                    }
                    return JSON.stringify(data, null, 2);
                  })()}
                </pre>
              ) : (
                <div style={{ padding: '2rem', background: 'var(--clr-surface-2)', borderRadius: 'var(--radius-md)', color: 'var(--clr-text-muted)', fontStyle: 'italic', textAlign: 'center', border: '1px solid var(--clr-border-subtle)' }}>
                  No payload content recorded for this system action.
                </div>
              )}
            </div>

            <div className="aal-modal-footer">
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedLog(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogs;
