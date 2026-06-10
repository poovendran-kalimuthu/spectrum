import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useToast, ToastContainer } from './Toast';
import { useSearchParams } from 'react-router-dom';
import { Shield, Search, Edit2, CheckCircle, X, Filter, Upload, BadgeCheck, ChevronLeft, MoreVertical, Mail } from 'lucide-react';
import imgAllMembers from '../assets/illustrations/team_pana.svg';
import imgEditorial from '../assets/illustrations/writing_pana.svg';
import imgNewsletter from '../assets/illustrations/email_pana.svg';
import imgReport from '../assets/illustrations/report_pana.svg';
import imgSuperadmin from '../assets/illustrations/security_pana.svg';
import './AdminTeam.css';

const TEAMS = ['Editorial', 'Newsletter/Magazine', 'Report', 'Unassigned'];
const ROLES = [
  'PRESIDENT',
  'VICE PRESIDENT',
  'MENTOR',
  'SECRETARY',
  'JOINT SECRETARY',
  'TREASURER',
  'MEDIA COORDINATOR',
  'MAGAZINE COORDINATOR',
  'NEWSLETTER COORDINATOR',
  'EDITING COORDINATOR',
  'ALUMNI COORDINATOR',
  'IIC & RADIO COORDINATOR',
  'R&I COORDINATOR',
  'REPORT COORDINATOR',
  'Office Bearer',
  'Member'
];

const AdminTeam = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('All');
  const [viewMode, setViewMode] = useState('groups');
  const [activeTab, setActiveTab] = useState('All Groups');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);

  // ── Deep-link: ?action=create → jump to members view for assignment ──
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setViewMode('members');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);
  const [editForm, setEditForm] = useState({
    adminTeam: 'Unassigned',
    adminPosition: 'Member',
    role: 'user',
    profilePicture: ''
  });

  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
      if (res.data.success) {
        // Only show users who have an admin role OR an assigned team/position
        const teamMembers = res.data.users.filter(u =>
          ['superadmin', 'admin_t1', 'admin_t2'].includes(u.role) ||
          (u.adminTeam && u.adminTeam !== 'Unassigned') ||
          (u.adminPosition && u.adminPosition !== 'Member')
        );
        // Also if we want to allow searching ANY user to add them, we might need all users. 
        // For now, let's keep all users but default view to Team Members.
        setUsers(res.data.users);
      }
    } catch (error) {
      showToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditForm({
      adminTeam: user.adminTeam || 'Unassigned',
      adminPosition: user.adminPosition || 'Member',
      role: user.role || 'user',
      profilePicture: user.profilePicture || ''
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const TARGET_SIZE = 412;
        let size = Math.min(img.width, img.height);
        
        // Calculate crop coordinates for center crop
        let sourceX = (img.width - size) / 2;
        let sourceY = (img.height - size) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        
        // Draw the center cropped image onto the 412x412 canvas
        ctx.drawImage(img, sourceX, sourceY, size, size, 0, 0, TARGET_SIZE, TARGET_SIZE);

        const base64Str = canvas.toDataURL('image/jpeg', 0.8);
        setEditForm(f => ({ ...f, profilePicture: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${editingUser._id}`, editForm, { withCredentials: true });
      if (res.data.success) {
        showToast('success', 'Team member updated successfully!');
        setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...editForm } : u));
        closeEditModal();
      }
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Failed to update member');
    }
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesTeam = true;
    if (filterTeam === 'Super Admins') {
      matchesTeam = u.role === 'superadmin';
    } else if (filterTeam !== 'All') {
      matchesTeam = u.adminTeam === filterTeam;
    }

    // Default: only show users with admin privileges OR specific team assignments, 
    // UNLESS they are specifically searching.
    const isTeamMember = ['superadmin', 'admin_t1', 'admin_t2'].includes(u.role) ||
      (u.adminTeam && u.adminTeam !== 'Unassigned') ||
      (u.adminPosition && u.adminPosition !== 'Member');

    if (searchTerm.length > 2) return matchesSearch; // Show anyone if searching deeply
    return matchesSearch && matchesTeam && isTeamMember;
  });

  const teamStats = [
    { name: 'All Members', count: users.filter(u => ['superadmin', 'admin_t1', 'admin_t2'].includes(u.role) || (u.adminTeam && u.adminTeam !== 'Unassigned') || (u.adminPosition && u.adminPosition !== 'Member')).length, type: 'PUBLIC', image: imgAllMembers },
    { name: 'Editorial', count: users.filter(u => u.adminTeam === 'Editorial').length, type: 'TEAM', image: imgEditorial },
    { name: 'Newsletter/Magazine', count: users.filter(u => u.adminTeam === 'Newsletter/Magazine').length, type: 'TEAM', image: imgNewsletter },
    { name: 'Report', count: users.filter(u => u.adminTeam === 'Report').length, type: 'TEAM', image: imgReport },
    { name: 'Super Admins', count: users.filter(u => u.role === 'superadmin').length, type: 'CORE', image: imgSuperadmin }
  ];

  const handleGroupClick = (groupName) => {
    setFilterTeam(groupName === 'All Members' ? 'All' : groupName);
    setViewMode('members');
  };

  return (
    <div className="adm-team-container">
      {viewMode === 'groups' ? (
        <div className="groups-view">
          <div className="groups-header">
            <h1 className="groups-title">Groups</h1>
            <div className="groups-tabs">
              <span className={`group-tab ${activeTab === 'All Groups' ? 'active' : ''}`} onClick={() => setActiveTab('All Groups')}>
                All Groups <span className="tab-count">{teamStats.length}</span>
              </span>
              <span className={`group-tab ${activeTab === 'My Groups' ? 'active' : ''}`} onClick={() => setActiveTab('My Groups')}>
                My Groups <span className="tab-count">1</span>
              </span>
            </div>
          </div>

          <div className="groups-grid">
            {teamStats.map((team, idx) => {
              const Icon = team.icon;
              return (
                <div key={idx} className="group-card" onClick={() => handleGroupClick(team.name)}>
                  <div className="group-card-header">
                    <span className={`group-pill ${team.type.toLowerCase()}`}>{team.type} GROUP</span>
                    <button className="group-more-btn" onClick={(e) => e.stopPropagation()}><MoreVertical size={18}/></button>
                  </div>
                  <h3 className="group-name">{team.name}</h3>
                  <p className="group-meta">Active 7 days ago • {team.count} Members</p>
                  
                  <div className="group-illustration">
                    <img src={team.image} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="members-view">
          <button className="back-to-groups-btn" onClick={() => setViewMode('groups')}>
            <ChevronLeft size={20} /> Back to Groups
          </button>
          
          <div className="adm-team-hero">
            <div className="hero-pill">{filterTeam.toUpperCase()}</div>
        <h2>We Build <span className="text-green">Leaders</span> Through <span className="text-green">Service.</span></h2>
        <p>Driven by a shared vision of excellence, service, and leadership, our team leads with purpose.<br/>Together, we strive to create meaningful and sustainable impact in the community.</p>
      </div>

      <div className="adm-team-controls">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search any user to assign a role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <Filter size={18} />
          <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
            <option value="All">All Teams</option>
            {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="adm-team-grid">
        {loading ? (
          <div className="loading-state">Loading team...</div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <div key={user._id} className="team-card-minimal">
              <div className="tcm-image-area">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} />
                ) : (
                  <div className="tcm-placeholder">
                    <span>{(user.name || 'U').substring(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div className="tcm-gradient"></div>
              </div>
              
              <div className="tcm-info-area">
                <h3 className="tcm-name">
                  {user.name} 
                  {user.role === 'superadmin' && <BadgeCheck size={18} className="verified-icon-minimal" />}
                </h3>
                <p className="tcm-role">
                  {user.adminPosition && user.adminPosition !== 'Member' ? user.adminPosition : 'Dedicated team member focused on collaboration.'}
                </p>
                <div className="tcm-footer">
                  <div className="tcm-stats">
                    <div className="tcm-stat"><Mail size={16} /> {user.email.split('@')[0]}</div>
                  </div>
                  <button className="tcm-edit-btn" onClick={() => openEditModal(user)}>
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">No team members found matching your criteria.</div>
        )}
      </div>
      </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content team-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Team Role</h3>
              <button className="btn-icon" onClick={closeEditModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="user-context">
                <strong>{editingUser.name}</strong> ({editingUser.email})
              </div>

              <div className="form-group">
                <label>Profile Picture</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div className="tc-avatar" style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', background: 'var(--clr-surface-alt)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editForm.profilePicture ? (
                      <img src={editForm.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{(editingUser.name || 'U').substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <Upload size={14} /> Upload Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                    </label>
                    <p style={{ margin: '5px 0 0', fontSize: '12px', color: 'var(--clr-text-muted)' }}>Recommended: Square image, max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>System Access Level</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">Standard User (No Admin Panel Access)</option>
                  <option value="admin_t2">Admin Tier 2 (Basic Events)</option>
                  <option value="admin_t1">Admin Tier 1 (Advanced Access)</option>
                  <option value="superadmin">Super Admin (Full Access)</option>
                </select>
                <small>Determines what they can see in the dashboard.</small>
              </div>

              <div className="form-group">
                <label>Assigned Team</label>
                <select
                  value={editForm.adminTeam}
                  onChange={e => setEditForm({ ...editForm, adminTeam: e.target.value })}
                >
                  {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Office Position</label>
                <select
                  value={editForm.adminPosition}
                  onChange={e => setEditForm({ ...editForm, adminPosition: e.target.value })}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default AdminTeam;
