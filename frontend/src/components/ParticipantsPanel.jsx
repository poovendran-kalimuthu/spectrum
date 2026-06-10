import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import './ParticipantsPanel.css';

const ParticipantsPanel = ({ eventId, eventTitle, onClose }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'table' | 'shortlisted'
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ text: '', type: 'info' });
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (text, type = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: 'info' }), 3000);
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    // Prepare CSV data
    const headers = ['Team Name', 'Is Shortlisted', 'Leader Name', 'Leader Roll No', 'Leader Email', 'Members (Roll Nos)', 'Registration Date'];
    
    const rows = registrations.map(reg => {
      const membersStr = reg.members.map(m => m.user?.registerNumber || '').join(', ');
      return [
        `"${reg.teamName || 'Unnamed'}"`,
        reg.isShortlisted ? 'Yes' : 'No',
        `"${reg.teamLeader?.name || ''}"`,
        `"${reg.teamLeader?.registerNumber || ''}"`,
        `"${reg.teamLeader?.email || ''}"`,
        `"${membersStr}"`,
        `"${new Date(reg.createdAt).toLocaleDateString()}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${eventTitle.replace(/\s+/g, '_')}_Participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/events/${eventId}/registrations`, { withCredentials: true });
      if (res.data.success) setRegistrations(res.data.registrations);
    } catch { showToast('Failed to fetch participants.', 'error'); }
    finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const matchesSearch = (reg) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = reg.teamName || '';
    const leader = reg.teamLeader;
    return (
      name.toLowerCase().includes(q) ||
      leader?.name?.toLowerCase().includes(q) ||
      leader?.registerNumber?.toLowerCase().includes(q) ||
      reg.members.some(m =>
        m.user?.name?.toLowerCase().includes(q) ||
        m.user?.registerNumber?.toLowerCase().includes(q)
      )
    );
  };

  const filteredRegs = registrations.filter(r => {
    const matchTab = activeTab !== 'shortlisted' || r.isShortlisted;
    return matchTab && matchesSearch(r);
  });

  const allSelectedOnPage = filteredRegs.length > 0 && filteredRegs.every(r => selected.has(r._id));

  const toggleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelected(prev => { const n = new Set(prev); filteredRegs.forEach(r => n.delete(r._id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); filteredRegs.forEach(r => n.add(r._id)); return n; });
    }
  };

  const toggleSelect = id => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkShortlist = async (shortlist) => {
    if (selected.size === 0) return showToast('Select at least one team first.', 'error');
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/admin/registrations/bulk-shortlist`, { regIds: [...selected], shortlist }, { withCredentials: true });
      showToast(`${selected.size} team(s) ${shortlist ? 'added to shortlist ⭐' : 'removed from shortlist'}.`, 'success');
      setSelected(new Set());
      fetchRegistrations();
    } catch { showToast('Action failed.', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleToggleOne = async (reg) => {
    const willShortlist = !reg.isShortlisted;
    try {
      await axios.patch(`${API_URL}/api/admin/registrations/${reg._id}/shortlist`, {}, { withCredentials: true });
      showToast(willShortlist ? '⭐ Team shortlisted!' : 'Removed from shortlist.', willShortlist ? 'success' : 'info');
      fetchRegistrations();
    } catch { showToast('Toggle failed.', 'error'); }
  };
  
  const handleDeleteRegistration = async (regId) => {
    if (!window.confirm("Are you sure you want to delete this registration? All score data for this team will also be removed. This action cannot be undone.")) return;
    
    setActionLoading(true);
    try {
       await axios.delete(`${API_URL}/api/admin/registrations/${regId}`, { withCredentials: true });
       showToast('Registration deleted successfully', 'success');
       fetchRegistrations();
    } catch (err) {
       showToast(err.response?.data?.message || 'Failed to delete registration', 'error');
    } finally {
       setActionLoading(false);
    }
  };

  const shortlistedCount = registrations.filter(r => r.isShortlisted).length;
  const totalTeams = registrations.length;
  const totalParticipants = registrations.reduce((sum, r) => sum + r.members.length, 0);

  // Derive bulk bar context  
  const selectedRegs = [...selected].map(id => registrations.find(r => r._id === id)).filter(Boolean);
  const anySelected = selected.size > 0;
  const allSelectedAreShortlisted = anySelected && selectedRegs.every(r => r.isShortlisted);
  const noneSelectedAreShortlisted = anySelected && selectedRegs.every(r => !r.isShortlisted);

  const MemberChip = ({ member, isLeader }) => (
    <div className={`pp-member-chip ${isLeader ? 'leader-chip' : ''}`}>
      <div className="pp-member-avatar">{member?.name?.[0] || '?'}</div>
      <div className="pp-member-info">
        <strong>{member?.name || 'Unknown'}</strong>
        <code>{member?.registerNumber || '—'}</code>
        <span>{member?.department} · {member?.year}</span>
      </div>
      {isLeader && <span className="pp-leader-tag">Leader</span>}
    </div>
  );

  return (
    <div className="pp-backdrop" onClick={onClose}>
      <div className="pp-panel animate-scale-in" onClick={e => e.stopPropagation()}>

        {/* Toast */}
        {toast.text && (
          <div className={`pp-toast status-alert ${toast.type}`}>{toast.text}</div>
        )}

        {/* ── Header ── */}
        <div className="pp-header">
          <div className="pp-header-info">
            <div className="pp-title-row">
              <h2>Registered Participants</h2>
              <button className="btn btn-ghost btn-sm pp-close" onClick={onClose}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="pp-event-name">📌 {eventTitle}</p>
          </div>
          <div className="pp-stats">
            <div className="pp-stat"><strong>{totalTeams}</strong><span>Teams</span></div>
            <div className="pp-stat"><strong>{totalParticipants}</strong><span>Participants</span></div>
            <div className="pp-stat pp-stat-shortlisted"><strong>{shortlistedCount}</strong><span>Shortlisted</span></div>
            <button className="btn btn-outline btn-sm" onClick={handleExportCSV} style={{ margin: 'auto 0 auto 15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="pp-toolbar">
          <div className="pp-tabs">
            {[
              { id: 'teams', label: '👥 Team View' },
              { id: 'table', label: '📋 Table View' },
              { id: 'shortlisted', label: `⭐ Shortlisted (${shortlistedCount})` },
            ].map(t => (
              <button key={t.id} className={`pp-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id); setSelected(new Set()); }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="pp-toolbar-right">
            <div className="pp-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pp-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search teams, names, roll no..." value={search} onChange={e => setSearch(e.target.value)} className="pp-search-input" />
              {search && <button className="pp-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>
        </div>

        {/* ── Bulk bar — only when something is selected ── */}
        {anySelected && (
          <div className="pp-bulk-bar animate-fade-in">
            <span>{selected.size} team{selected.size > 1 ? 's' : ''} selected</span>
            <div className="pp-bulk-actions">
              {/* Only show Shortlist button if NOT all already shortlisted */}
              {!allSelectedAreShortlisted && (
                <button className="btn btn-success btn-sm" onClick={() => handleBulkShortlist(true)} disabled={actionLoading}>
                  ⭐ Shortlist Selected
                </button>
              )}
              {/* Only show Remove button if NOT all already un-shortlisted */}
              {!noneSelectedAreShortlisted && (
                <button className="btn btn-danger btn-sm" onClick={() => handleBulkShortlist(false)} disabled={actionLoading}>
                  ✕ Remove from Shortlist
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Deselect All</button>
            </div>
          </div>
        )}

        {/* ── Content ── */}
        <div className="pp-content-wrap">
          {loading ? (
            <div className="pp-loading"><div className="pp-spin" /><span>Loading participants...</span></div>
          ) : filteredRegs.length === 0 ? (
            <div className="pp-empty">
              <span>{activeTab === 'shortlisted' ? '⭐' : '📭'}</span>
              <p>{activeTab === 'shortlisted' ? 'No shortlisted teams yet' : search ? 'No results for your search' : 'No registrations yet'}</p>
            </div>
          ) : activeTab === 'teams' || activeTab === 'shortlisted' ? (
            /* ────── TEAM VIEW ────── */
            <div className="pp-teams-grid">
              {filteredRegs.map((reg, i) => (
                <div key={reg._id} className={`pp-team-card animate-fade-in-up stagger-${Math.min(i + 1, 5)} ${reg.isShortlisted ? 'is-shortlisted' : ''}`}>
                  <div className="pp-team-card-header">
                    <div className="pp-team-meta">
                      <div className="pp-team-select">
                        <label className="pp-checkbox-wrap" title="Select for bulk action">
                          <input type="checkbox" checked={selected.has(reg._id)} onChange={() => toggleSelect(reg._id)} className="pp-checkbox" />
                          <span className="pp-checkmark" />
                        </label>
                        <div className="pp-team-number">#{i + 1}</div>
                      </div>
                      <div>
                        <h3 className="pp-team-name">
                          {reg.teamName?.trim() || <span className="pp-no-name">Unnamed Team</span>}
                        </h3>
                        <p className="pp-team-sub">
                          {reg.members.length} member{reg.members.length !== 1 ? 's' : ''} · Registered {new Date(reg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pp-team-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {reg.isShortlisted
                          ? <span className="badge badge-success">⭐ Shortlisted</span>
                          : <span className="badge badge-muted">Registered</span>}
                        <button 
                          className="btn btn-ghost btn-sm pp-delete-reg" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteRegistration(reg._id); }}
                          title="Delete Registration"
                          style={{ color: '#dc2626', padding: '4px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pp-members-grid">
                    {reg.members.map((m, mi) => (
                      <MemberChip
                        key={m.user?._id || mi}
                        member={m.user}
                        isLeader={m.user?._id === reg.teamLeader?._id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ────── TABLE VIEW ────── */
            <div className="pp-table-wrap">
              <table className="pp-table">
                <thead>
                  <tr>
                    <th>
                      <label className="pp-checkbox-wrap">
                        <input type="checkbox" checked={allSelectedOnPage} onChange={toggleSelectAll} className="pp-checkbox" />
                        <span className="pp-checkmark" />
                      </label>
                    </th>
                    <th>#</th>
                    <th>Team Name</th>
                    <th>Leader</th>
                    <th>Roll No</th>
                    <th>Members</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegs.map((reg, i) => (
                    <tr key={reg._id} className={`pp-row ${selected.has(reg._id) ? 'selected' : ''} ${reg.isShortlisted ? 'shortlisted' : ''}`}>
                      <td>
                        <label className="pp-checkbox-wrap">
                          <input type="checkbox" checked={selected.has(reg._id)} onChange={() => toggleSelect(reg._id)} className="pp-checkbox" />
                          <span className="pp-checkmark" />
                        </label>
                      </td>
                      <td className="pp-idx">{i + 1}</td>
                      <td>
                        <span className="pp-tname">
                          {reg.teamName?.trim() || <em style={{ color: 'var(--clr-text-muted)', fontWeight: 400 }}>Unnamed</em>}
                        </span>
                      </td>
                      <td className="pp-leader">
                        <div className="pp-leader-avatar">{reg.teamLeader?.name?.[0] || '?'}</div>
                        <div>
                          <strong>{reg.teamLeader?.name || 'Unknown'}</strong>
                          <span>{reg.teamLeader?.email}</span>
                        </div>
                      </td>
                      <td><code className="pp-roll">{reg.teamLeader?.registerNumber || '—'}</code></td>
                      <td>
                        <div className="pp-member-pills">
                          {reg.members.map((m, mi) => (
                            <span
                              key={m.user?._id || mi}
                              className={`pp-pill ${m.user?._id === reg.teamLeader?._id ? 'pill-leader' : 'pill-member'}`}
                              title={m.user?.name}
                            >
                              {m.user?.registerNumber || '—'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="pp-date">{new Date(reg.createdAt).toLocaleDateString()}</td>
                      <td>
                        {reg.isShortlisted
                          ? <span className="badge badge-success">⭐ Shortlisted</span>
                          : <span className="badge badge-muted">Registered</span>}
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleDeleteRegistration(reg._id)}
                          title="Delete Registration"
                          style={{ color: '#dc2626' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="pp-footer">
          <span>Showing {filteredRegs.length} of {totalTeams} teams · {totalParticipants} total participants</span>
          {shortlistedCount > 0 && activeTab !== 'shortlisted' && (
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('shortlisted')}>
              View {shortlistedCount} Shortlisted →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantsPanel;
