import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import { ToastContainer, useToast } from './Toast';
import Select from './ui/Select';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Users,
  Search,
  Plus,
  X,
  FileBox,
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Bookmark,
  CalendarClock,
  Calendar as CalendarIcon,
  Globe,
  Lock,
  FileUp,
  Trash2
} from 'lucide-react';
import './AdminDocuments.css';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker using unpkg to guarantee version matching
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

// ── Inline DatePicker (matches Event Configuration style) ──────────────────
const DocDatePicker = ({ value, onChange, placeholder = 'Select Date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popStyle, setPopStyle] = useState({});
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const p = value.split('-');
      if (p.length === 3) return new Date(parseInt(p[0]), parseInt(p[1]) - 1, 1);
    }
    return new Date();
  });
  const wrapRef = useRef(null);
  const popRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        popRef.current  && !popRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!isOpen && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const vw   = window.innerWidth;
      const POP_W = 300;
      let left = rect.left;
      if (left + POP_W > vw - 8) left = vw - POP_W - 8;
      setPopStyle({ top: rect.bottom + 6, left });
    }
    setIsOpen(o => !o);
  };

  const fmtDisplay = (str) => {
    if (!str) return '';
    const p = str.split('-');
    if (p.length !== 3) return str;
    return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]))
      .toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const selectDay = (day) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setTimeout(() => setIsOpen(false), 120);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <input
          type="text" readOnly placeholder={placeholder}
          value={fmtDisplay(value)}
          className={`form-input datepicker-display-input ${isOpen ? 'active' : ''}`}
          style={{ width: '100%', cursor: 'pointer', paddingRight: '40px',
            borderColor: isOpen ? 'var(--clr-accent)' : 'var(--clr-border)',
            boxShadow: isOpen ? 'var(--shadow-focus)' : 'none' }}
        />
        <CalendarIcon size={16} style={{ position: 'absolute', right: '14px',
          color: isOpen ? 'var(--clr-accent)' : 'var(--clr-text-muted)', pointerEvents: 'none' }} />
      </div>
      {isOpen && createPortal(
        <div
          ref={popRef}
          className="datepicker-popover glass-strong"
          style={{ position: 'fixed', top: popStyle.top, left: popStyle.left, width: '300px', zIndex: 99999 }}
        >
          <div className="datepicker-header">
            <button type="button" className="btn btn-ghost btn-xs" style={{ padding: '4px', minHeight: 'unset' }}
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-text-heading)' }}>{MONTHS[month]} {year}</span>
            <button type="button" className="btn btn-ghost btn-xs" style={{ padding: '4px', minHeight: 'unset' }}
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
          </div>
          <div className="datepicker-weekdays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}</div>
          <div className="datepicker-days">
            {days.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} />;
              const isSel = selected && selected.getDate() === day && selected.getMonth() === month && selected.getFullYear() === year;
              const today = new Date();
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              return (
                <button key={day} type="button" onClick={() => selectDay(day)}
                  className={`datepicker-day-btn ${isSel ? 'active' : ''} ${isToday ? 'today' : ''}`}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Inline TimePicker (matches Event Configuration style) ──────────────────
const DocTimePicker = ({ value, onChange, placeholder = 'Select Time' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [popStyle, setPopStyle] = useState({});
  const wrapRef = useRef(null);
  const popRef  = useRef(null);

  let initH = 9, initM = 0, initAP = 'AM';
  if (value) {
    const [h, m] = value.split(':');
    let hr = parseInt(h);
    initM = parseInt(m);
    if (hr >= 12) { initAP = 'PM'; if (hr > 12) hr -= 12; }
    else if (hr === 0) hr = 12;
    initH = hr;
  }
  const [hour, setHour]   = useState(initH);
  const [minute, setMinute] = useState(initM);
  const [ampm, setAmPm]   = useState(initAP);

  useEffect(() => {
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        popRef.current  && !popRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!isOpen && wrapRef.current) {
      const rect  = wrapRef.current.getBoundingClientRect();
      const vw    = window.innerWidth;
      const POP_W = 284;
      // Right-align the popup relative to the input's right edge; clamp to viewport
      let left = rect.right - POP_W;
      if (left < 8) left = 8;
      if (left + POP_W > vw - 8) left = vw - POP_W - 8;
      setPopStyle({ top: rect.bottom + 6, left });
    }
    setIsOpen(o => !o);
  };

  const emit = (h, m, ap) => {
    let hr24 = h;
    if (ap === 'PM' && h !== 12) hr24 += 12;
    if (ap === 'AM' && h === 12) hr24 = 0;
    onChange(`${String(hr24).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  };

  const display = value ? `${hour}:${String(minute).padStart(2,'0')} ${ampm}` : '';
  const btnStyle  = (active) => ({ flex: 1, padding: '0.5rem', borderRadius: '6px', background: active ? '#0f172a' : '#f8fafc', color: active ? '#fff' : '#0f172a', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' });
  const cellStyle = (active) => ({ padding: '6px 0', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', background: active ? '#0f172a' : 'transparent', color: active ? '#fff' : '#0f172a', border: active ? '1px solid #0f172a' : '1px solid #e2e8f0' });

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <div onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        <input type="text" readOnly placeholder={placeholder} value={display}
          className={`form-input datepicker-display-input ${isOpen ? 'active' : ''}`}
          style={{ width: '100%', cursor: 'pointer', paddingRight: '40px',
            borderColor: isOpen ? 'var(--clr-accent)' : 'var(--clr-border)',
            boxShadow: isOpen ? 'var(--shadow-focus)' : 'none' }} />
        <Clock size={16} style={{ position: 'absolute', right: '14px',
          color: isOpen ? 'var(--clr-accent)' : 'var(--clr-text-muted)', pointerEvents: 'none' }} />
      </div>
      {isOpen && createPortal(
        <div
          ref={popRef}
          className="datepicker-popover glass-strong"
          style={{ position: 'fixed', top: popStyle.top, left: popStyle.left, width: '284px', padding: '1rem', zIndex: 99999 }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button type="button" style={btnStyle(ampm === 'AM')} onClick={() => { setAmPm('AM'); emit(hour, minute, 'AM'); }}>AM</button>
            <button type="button" style={btnStyle(ampm === 'PM')} onClick={() => { setAmPm('PM'); emit(hour, minute, 'PM'); }}>PM</button>
          </div>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hour</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '4px', marginBottom: '1.25rem' }}>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
              <button key={h} type="button" style={cellStyle(hour === h)}
                onClick={() => { setHour(h); emit(h, minute, ampm); }}>{h}</button>
            ))}
          </div>
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minute</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px', marginBottom: '1.25rem' }}>
            {[0,15,30,45].map(m => (
              <button key={m} type="button" style={cellStyle(minute === m)}
                onClick={() => { setMinute(m); emit(hour, m, ampm); }}>{String(m).padStart(2,'0')}</button>
            ))}
          </div>
          <button type="button"
            style={{ width:'100%', padding:'0.75rem', background:'#0f172a', color:'#fff', border:'none', borderRadius:'6px', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}
            onClick={() => setTimeout(() => setIsOpen(false), 100)}>Confirm Time</button>
        </div>,
        document.body
      )}
    </div>
  );
};


const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return Math.floor(seconds) + " seconds ago";
};

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const approvalsRef = useRef(null);

  // ── Deep-link: ?action=new opens upload; ?tab=approvals scrolls there ──
  useEffect(() => {
    const action = searchParams.get('action');
    const tab = searchParams.get('tab');
    if (action === 'new') {
      setShowUploadModal(true);
      setSearchParams({}, { replace: true });
    }
    if (tab === 'approvals') {
      setTimeout(() => approvalsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);
  
  // Upload Form State
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('Report');
  const [dueDateStr, setDueDateStr] = useState('');   // YYYY-MM-DD
  const [dueTimeStr, setDueTimeStr] = useState('');   // HH:MM (24h)
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [approverSearch, setApproverSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Review & Timeline State
  const [reviewDoc, setReviewDoc] = useState(null);
  const [timelineDoc, setTimelineDoc] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Custom PDF Viewer State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const { toasts, showToast, removeToast } = useToast();

  // Escape key to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowUploadModal(false);
        setReviewDoc(null);
        setTimelineDoc(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch User
    try {
      const userRes = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      setCurrentUser(userRes.data.user);
    } catch (err) {
      console.error('Failed to load user:', err);
    }

    // Fetch Documents
    try {
      const docsRes = await axios.get(`${API_URL}/api/documents`, { withCredentials: true });
      if (docsRes.data.success) {
        setDocuments(docsRes.data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      showToast('Failed to load documents.', 'error');
    }

    // Fetch Admins
    try {
      const adminsRes = await axios.get(`${API_URL}/api/admin/users`, { withCredentials: true });
      if (adminsRes.data.success) {
        const adminUsers = adminsRes.data.users.filter(u => ['superadmin', 'admin_t1', 'admin_t2'].includes(u.role));
        setAdmins(adminUsers);
      }
    } catch (err) {
      console.error('Failed to load admins:', err);
      showToast('Failed to load admins.', 'error');
    }
    
    setLoading(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a PDF file.', 'error');
      return;
    }
    if (selectedApprovers.length === 0) {
      showToast('Please select at least one approver.', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('documentType', docType);
    formData.append('approvers', selectedApprovers.join(','));
    formData.append('isPublic', isPublic);
    if (dueDateStr) {
      const combined = dueTimeStr ? `${dueDateStr}T${dueTimeStr}` : `${dueDateStr}T00:00`;
      formData.append('dueDate', new Date(combined).toISOString());
    }

    try {
      const res = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        showToast('Document uploaded successfully!', 'success');
        setShowUploadModal(false);
        setFile(null);
        setTitle('');
        setDocType('Report');
        setDueDateStr('');
        setDueTimeStr('');
        setIsPublic(false);
        setSelectedApprovers([]);
        setApproverSearch('');
        fetchData();
      }
    } catch (err) {
      showToast('Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAction = async (docId, action) => {
    try {
      const payload = action === 'approve' || action === 'reject' ? { comment: commentText } : {};
      const endpoint = action === 'comment' ? 'comments' : action;
      const method = action === 'comment' ? axios.post : axios.patch;

      const res = await method(`${API_URL}/api/documents/${docId}/${endpoint}`, payload, { withCredentials: true });
      
      if (res.data.success) {
        showToast(action === 'comment' ? 'Comment added.' : `Document ${action}d successfully.`, 'success');
        setCommentText('');
        fetchData();
        
        // Update reviewDoc in real-time so they see their new comment without closing the modal
        if (reviewDoc && reviewDoc._id === docId) {
          setReviewDoc(res.data.document);
        }
      }
    } catch (err) {
      showToast(`Failed to ${action} document.`, 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to permanently delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      const res = await axios.delete(`${API_URL}/api/documents/${docId}`, { withCredentials: true });
      if (res.data.success) {
        showToast('Document deleted successfully.', 'success');
        fetchData();
        if (reviewDoc?._id === docId) setReviewDoc(null);
        if (timelineDoc?._id === docId) setTimelineDoc(null);
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      showToast(err.response?.data?.message || 'Failed to delete document.', 'error');
    }
  };

  const toggleApprover = (adminId) => {
    if (selectedApprovers.includes(adminId)) {
      setSelectedApprovers(prev => prev.filter(id => id !== adminId));
    } else {
      setSelectedApprovers(prev => [...prev, adminId]);
    }
  };

  if (loading) return <Loader text="Loading Documents..." />;

  // Separate documents
  const pendingApprovals = documents.filter(d => 
    d.status === 'Pending' && 
    d.approvers.some(a => a._id === currentUser?._id) && 
    !d.approvalsReceived.some(ar => ar._id === currentUser?._id)
  );

  const mySubmissions = documents.filter(d => d.sender._id === currentUser?._id);

  return (
    <div className="adm-wrapper page-enter">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <div className="adm-header">
        <div>
          <h2>Docs & Approvals</h2>
          <p>Manage Newsletters, Magazines, and Reports</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <UploadCloud size={16} /> Upload Document
        </button>
      </div>

      <div className="adm-content">
        {/* Needs Approval Section */}
        {pendingApprovals.length > 0 && (
          <div className="adm-section" ref={approvalsRef}>
            <h3 className="section-title"><Clock size={18} /> Action Required</h3>
            <div className="adm-grid">
              {pendingApprovals.map(doc => (
                <div className="adm-job-card" key={doc._id}>
                  <div className="ajc-header">
                    <div className="ajc-avatars">
                      {doc.approvers && doc.approvers.slice(0, 3).map((approver, idx) => (
                        <img 
                          key={approver._id} 
                          src={approver.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(approver.name)}&background=random`} 
                          alt={approver.name} 
                          className="ajc-avatar" 
                          style={{ zIndex: 10 - idx }} 
                          title={approver.name}
                        />
                      ))}
                      {doc.approvers && doc.approvers.length > 3 && (
                        <div className="ajc-avatar ajc-avatar-more" style={{ zIndex: 1 }}>
                          +{doc.approvers.length - 3}
                        </div>
                      )}
                    </div>
                    <button className="ajc-save-btn">
                      <Bookmark size={13} /> Save
                    </button>
                  </div>

                  <div className="ajc-body">
                    <div className="ajc-meta">
                      <span className="ajc-sender">{doc.sender?.name || 'Unknown User'}</span>
                      <span className="ajc-dot">·</span>
                      <span className="ajc-time">{timeAgo(doc.createdAt)}</span>
                    </div>
                    <h3 className="ajc-title">{doc.title}</h3>
                    <div className="ajc-tags">
                      <span className="ajc-tag ajc-tag-type">{doc.documentType}</span>
                      <span className="ajc-tag ajc-tag-warning">Pending Review</span>
                    </div>
                  </div>

                  <div className="ajc-footer">
                    <div className="ajc-progress-wrap">
                      <div className="ajc-progress-bar">
                        <div className="ajc-progress-fill" style={{ width: `${doc.approvers?.length ? (doc.approvalsReceived?.length / doc.approvers.length) * 100 : 0}%` }} />
                      </div>
                      <span className="ajc-progress-label">{doc.approvalsReceived?.length || 0}/{doc.approvers?.length || 0} approved</span>
                    </div>
                    <div className="ajc-actions">
                      <button className="ajc-btn ajc-btn-ghost" onClick={() => setTimelineDoc(doc)}>
                        <Clock size={13} /> Timeline
                      </button>
                      <button className="ajc-btn ajc-btn-primary" onClick={() => setReviewDoc(doc)}>
                        <Eye size={13} /> Review
                      </button>
                      {(doc.sender?._id === currentUser?._id || ['superadmin', 'admin_t1', 'admin_t2'].includes(currentUser?.role)) && (
                        <button 
                          className="ajc-btn ajc-btn-danger" 
                          onClick={() => handleDeleteDocument(doc._id)}
                          title="Delete Document"
                          style={{ padding: '6px 8px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Submissions Section */}
        <div className="adm-section">
          <h3 className="section-title"><FileBox size={18} /> My Submissions</h3>
          {mySubmissions.length === 0 ? (
            <div className="adm-empty">
              <FileText size={32} />
              <p>You haven't uploaded any documents yet.</p>
            </div>
          ) : (
            <div className="adm-grid">
              {mySubmissions.map(doc => {
                const approved = doc.status === 'Approved';
                const rejected = doc.status === 'Rejected';
                const progressPct = doc.approvers?.length ? (doc.approvalsReceived?.length / doc.approvers.length) * 100 : 0;
                return (
                  <div className="adm-job-card" key={doc._id}>
                    <div className="ajc-header">
                      <div className="ajc-avatars">
                        {doc.approvers && doc.approvers.slice(0, 3).map((approver, idx) => (
                          <img 
                            key={approver._id} 
                            src={approver.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(approver.name)}&background=random`} 
                            alt={approver.name} 
                            className="ajc-avatar" 
                            style={{ zIndex: 10 - idx }} 
                            title={approver.name}
                          />
                        ))}
                        {doc.approvers && doc.approvers.length > 3 && (
                          <div className="ajc-avatar ajc-avatar-more" style={{ zIndex: 1 }}>
                            +{doc.approvers.length - 3}
                          </div>
                        )}
                      </div>
                      <button className="ajc-save-btn">
                        <Bookmark size={13} /> Save
                      </button>
                    </div>

                    <div className="ajc-body">
                      <div className="ajc-meta">
                        <span className="ajc-sender">{doc.sender?.name || 'Me'}</span>
                        <span className="ajc-dot">·</span>
                        <span className="ajc-time">{timeAgo(doc.createdAt)}</span>
                      </div>
                      <h3 className="ajc-title">{doc.title}</h3>
                      <div className="ajc-tags">
                        <span className="ajc-tag ajc-tag-type">{doc.documentType}</span>
                        <span className={`ajc-tag ${approved ? 'ajc-tag-success' : rejected ? 'ajc-tag-danger' : 'ajc-tag-warning'}`}>
                          {doc.status}
                        </span>
                      </div>
                      {doc.dueDate && (
                        <div className="ajc-due-date">
                          <CalendarClock size={11} />
                          Due {new Date(doc.dueDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      )}
                    </div>

                    <div className="ajc-footer">
                      <div className="ajc-progress-wrap">
                        <div className="ajc-progress-bar">
                          <div className={`ajc-progress-fill ${approved ? 'fill-success' : rejected ? 'fill-danger' : ''}`} style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="ajc-progress-label">{doc.approvalsReceived?.length || 0}/{doc.approvers?.length || 0} approved</span>
                      </div>
                      <div className="ajc-actions">
                        <button className="ajc-btn ajc-btn-ghost" onClick={() => setTimelineDoc(doc)}>
                          <Clock size={13} /> Timeline
                        </button>
                        <button className="ajc-btn ajc-btn-primary" onClick={() => setReviewDoc(doc)}>
                          <Eye size={13} /> View
                        </button>
                        {(doc.sender?._id === currentUser?._id || ['superadmin', 'admin_t1', 'admin_t2'].includes(currentUser?.role)) && (
                          <button 
                            className="ajc-btn ajc-btn-danger" 
                            onClick={() => handleDeleteDocument(doc._id)}
                            title="Delete Document"
                            style={{ padding: '6px 8px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && createPortal(
        <div className="adm-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="adm-modal adm-upload-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="adm-modal-header" style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
              <h3><UploadCloud size={18} style={{ marginRight: '8px' }}/> Upload Document</h3>
              <button className="adm-modal-close" onClick={() => setShowUploadModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpload}>
              <div className="adm-modal-body adm-upload-body">

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input
                    type="text" className="form-input" required
                    value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. October Newsletter"
                  />
                </div>

                {/* Type — system Select */}
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <Select value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Report">Report</option>
                    <option value="Approval">Approval Request</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                {/* Due Date + Time — split row matching Event Config */}
                <div className="form-group">
                  <label className="form-label">
                    Due Date &amp; Time
                    <span className="form-label-optional">(optional)</span>
                  </label>
                  <div className="adm-date-time-row">
                    <DocDatePicker
                      value={dueDateStr}
                      onChange={setDueDateStr}
                      placeholder="Select due date"
                    />
                    <DocTimePicker
                      value={dueTimeStr}
                      onChange={setDueTimeStr}
                      placeholder="Select time"
                    />
                  </div>
                </div>

                {/* PDF Upload zone */}
                <div className="form-group">
                  <label className="form-label">PDF File</label>
                  <div
                    className={`adm-file-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      const dropped = e.dataTransfer.files[0];
                      if (dropped?.type === 'application/pdf') setFile(dropped);
                    }}
                  >
                    <input
                      type="file" accept="application/pdf" required
                      ref={fileInputRef} style={{ display: 'none' }}
                      onChange={e => setFile(e.target.files[0])}
                    />
                    {file ? (
                      <>
                        <FileText size={28} color="var(--clr-accent)" />
                        <p className="adm-file-zone-name">{file.name}</p>
                        <span className="adm-file-zone-sub">{(file.size / 1024).toFixed(0)} KB · Click to change</span>
                      </>
                    ) : (
                      <>
                        <FileUp size={28} color="var(--clr-text-muted)" />
                        <p className="adm-file-zone-name">Click or drag & drop a PDF here</p>
                        <span className="adm-file-zone-sub">Only PDF files accepted</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Approvers */}
                <div className="form-group">
                  <label className="form-label">
                    Approvers <span className="form-label-optional">(select at least one)</span>
                  </label>
                  
                  {/* Search Bar for Approvers */}
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={approverSearch}
                      onChange={e => setApproverSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: '10px',
                        border: '1px solid var(--clr-border)',
                        background: 'var(--clr-surface-2)',
                        fontSize: '0.85rem',
                        outline: 'none',
                        color: 'var(--clr-text-heading)',
                        boxShadow: 'none'
                      }}
                    />
                    <Search
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--clr-text-muted)',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>

                  <div className="adm-approvers-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {admins.filter(admin => {
                      const q = approverSearch.toLowerCase();
                      return !q || admin.name.toLowerCase().includes(q) || admin.email.toLowerCase().includes(q);
                    }).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
                        No admins found
                      </div>
                    ) : (
                      admins
                        .filter(admin => {
                          const q = approverSearch.toLowerCase();
                          return !q || admin.name.toLowerCase().includes(q) || admin.email.toLowerCase().includes(q);
                        })
                        .map(admin => {
                          const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                          const isSelected = selectedApprovers.includes(admin._id);
                          const roleBg = admin.role === 'superadmin' ? '#fef2f2' : '#f0fdf4';
                          const roleColor = admin.role === 'superadmin' ? '#dc2626' : '#16a34a';
                          const roleLabels = { 'superadmin': 'Super Admin', 'admin_t1': 'Admin T1', 'admin_t2': 'Admin T2' };
                          const displayRole = roleLabels[admin.role] || admin.role;

                          return (
                            <div
                              key={admin._id}
                              onClick={() => toggleApprover(admin._id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.625rem 0.75rem',
                                borderRadius: '12px',
                                marginBottom: '6px',
                                cursor: 'pointer',
                                border: isSelected ? '1.5px solid var(--clr-accent)' : '1.5px solid var(--clr-border)',
                                background: isSelected ? 'var(--clr-accent-light)' : 'var(--clr-surface)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {admin.profilePicture ? (
                                <img
                                  src={admin.profilePicture}
                                  alt={admin.name}
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                                  {initials}
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {admin.name}
                                  </span>
                                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: roleBg, color: roleColor, textTransform: 'capitalize', flexShrink: 0 }}>
                                    {displayRole}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', marginTop: '2px' }}>
                                  {admin.email}
                                </span>
                              </div>
                              {isSelected ? (
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-accent)', flexShrink: 0 }}>Added</span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Show to Everyone toggle */}
                <div className="adm-visibility-toggle">
                  <div className="adm-toggle-info">
                    {isPublic ? <Globe size={16} color="var(--clr-accent)" /> : <Lock size={16} color="var(--clr-text-muted)" />}
                    <div>
                      <p className="adm-toggle-title">{isPublic ? 'Visible to Everyone' : 'Restricted Access'}</p>
                      <p className="adm-toggle-sub">{isPublic ? 'All members can view this document.' : 'Only sender and approvers can view.'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`adm-toggle-btn ${isPublic ? 'on' : ''}`}
                    onClick={() => setIsPublic(p => !p)}
                    aria-label="Toggle visibility"
                  >
                    <span className="adm-toggle-knob" />
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="adm-modal-footer" style={{ borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={uploading} style={{ gap: '7px' }}>
                  <UploadCloud size={15} />
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Review Modal */}
      {reviewDoc && createPortal(
        <div className="adm-modal-overlay" onClick={() => setReviewDoc(null)}>
          <div className="adm-modal review-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header" style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
              <h3>Review Document: {reviewDoc.title}</h3>
              <button className="adm-modal-close" onClick={() => setReviewDoc(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="review-split">
              {/* Left Side: PDF */}
              <div className="review-left">
                <div className="pdf-custom-toolbar">
                  <div className="pdf-toolbar-group">
                    <button className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
                      <ZoomOut size={16} />
                    </button>
                    <span className="pdf-scale-text">{Math.round(scale * 100)}%</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setScale(s => Math.min(3, s + 0.2))}>
                      <ZoomIn size={16} />
                    </button>
                  </div>
                  <div className="pdf-toolbar-group">
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                      disabled={pageNumber <= 1}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pdf-page-text">Page {pageNumber} of {numPages || '--'}</span>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
                      disabled={pageNumber >= (numPages || 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                <div className="pdf-document-container">
                  <Document
                    file={`${API_URL}${reviewDoc.fileUrl}`}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="pdf-loading">Loading Document...</div>}
                  >
                    <Page 
                      pageNumber={pageNumber} 
                      scale={scale} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                </div>
              </div>

              {/* Right Side: Comments and Actions */}
              <div className="review-right">
                <div className="comments-section">
                  <h4>Comments & Corrections</h4>
                  <div className="comments-list">
                    {reviewDoc.comments && reviewDoc.comments.length > 0 ? (
                      reviewDoc.comments.map((c, idx) => (
                        <div key={idx} className="comment-bubble">
                          <strong>{c.user?.name || 'Unknown User'}:</strong>
                          <p>{c.text}</p>
                          <span className="comment-date">{new Date(c.date).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="no-comments">No comments yet. Be the first to leave feedback!</p>
                    )}
                  </div>
                </div>

                <div className="review-actions-section">
                  <textarea 
                    className="form-input" 
                    placeholder="Add a comment or correction..." 
                    rows="3"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <div className="review-btn-row">
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAction(reviewDoc._id, 'comment')} disabled={!commentText.trim()}>
                      Add Comment
                    </button>
                    {(reviewDoc.sender?._id === currentUser?._id || ['superadmin', 'admin_t1', 'admin_t2'].includes(currentUser?.role)) && (
                      <button 
                        className="btn btn-danger btn-sm" 
                        onClick={() => handleDeleteDocument(reviewDoc._id)}
                        style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={14} /> Delete Document
                      </button>
                    )}
                  </div>
                  
                  {/* Show Approve/Reject if the user is an approver and hasn't approved yet, and the document is still Pending */}
                  {reviewDoc.status === 'Pending' && reviewDoc.approvers.some(a => a._id === currentUser?._id) && !reviewDoc.approvalsReceived.some(a => a._id === currentUser?._id) && (
                    <div className="review-btn-row" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--clr-border)', paddingTop: '0.5rem' }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(reviewDoc._id, 'approve')}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(reviewDoc._id, 'reject')}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Timeline Modal */}
      {timelineDoc && createPortal(
        <div className="adm-modal-overlay" onClick={() => setTimelineDoc(null)}>
          <div className="adm-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header" style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
              <h3>Approval Timeline</h3>
              <button className="adm-modal-close" onClick={() => setTimelineDoc(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal-body timeline-body">
              <div className="timeline-item success">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <h5>Document Uploaded</h5>
                  <p>By {timelineDoc.sender?.name}</p>
                  <small>{new Date(timelineDoc.createdAt).toLocaleString()}</small>
                </div>
              </div>

              {timelineDoc.approvers.map(approver => {
                const hasApproved = timelineDoc.approvalsReceived.some(ar => ar._id === approver._id);
                const isRejected = timelineDoc.status === 'Rejected';
                
                let stateClass = 'pending';
                let stateText = 'Pending Approval';
                
                if (hasApproved) {
                  stateClass = 'success';
                  stateText = 'Approved';
                } else if (isRejected) {
                  stateClass = 'danger';
                  stateText = 'Rejected (or cancelled)';
                }

                return (
                  <div key={approver._id} className={`timeline-item ${stateClass}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h5>{stateText}</h5>
                      <p>{approver.name} ({approver.role})</p>
                    </div>
                  </div>
                );
              })}

              {timelineDoc.status === 'Approved' && (
                <div className="timeline-item success">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h5>Fully Approved</h5>
                    <p>Document workflow completed.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDocuments;
