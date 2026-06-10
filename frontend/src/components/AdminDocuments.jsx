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
  ZoomOut
} from 'lucide-react';
import './AdminDocuments.css';
import { createPortal } from 'react-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker using unpkg to guarantee version matching
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

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
  const [file, setFile] = useState(null);
  const [selectedApprovers, setSelectedApprovers] = useState([]);
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
        setSelectedApprovers([]);
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
                <div className="adm-card alert" key={doc._id}>
                  <div className="adm-card-header">
                    <span className="badge badge-accent">{doc.documentType}</span>
                    <span className="badge badge-warning">Pending Your Approval</span>
                  </div>
                  <h4>{doc.title}</h4>
                  <p className="adm-sender">From: {doc.sender.name}</p>
                  
                  <div className="adm-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setReviewDoc(doc)}>
                      <Eye size={14} /> Review
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTimelineDoc(doc)}>
                      <Clock size={14} /> Timeline
                    </button>
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
              {mySubmissions.map(doc => (
                <div className="adm-card" key={doc._id}>
                  <div className="adm-card-header">
                    <span className="badge badge-primary">{doc.documentType}</span>
                    <span className={`badge ${doc.status === 'Approved' ? 'badge-success' : doc.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {doc.status}
                    </span>
                  </div>
                  <h4>{doc.title}</h4>
                  <div className="adm-progress">
                    <p>Approvals: {doc.approvalsReceived.length} / {doc.approvers.length}</p>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${(doc.approvalsReceived.length / doc.approvers.length) * 100}%` }} />
                    </div>
                  </div>
                  <div className="adm-card-footer" style={{ gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setReviewDoc(doc)}>
                      <Eye size={14} /> View
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTimelineDoc(doc)}>
                      <Clock size={14} /> Timeline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && createPortal(
        <div className="adm-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header" style={{ borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)' }}>
              <h3><UploadCloud size={18} style={{ marginRight: '8px' }}/> Upload Document</h3>
              <button className="adm-modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Document Title</label>
                  <input type="text" className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. October Newsletter" />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <Select value={docType} onChange={e => setDocType(e.target.value)}>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Report">Report</option>
                    <option value="Approval">Approval Request</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label">PDF File</label>
                  <input type="file" accept="application/pdf" className="form-input" required ref={fileInputRef} onChange={e => setFile(e.target.files[0])} />
                </div>

                <div className="form-group">
                  <label className="form-label">Select Approvers (Multiple allowed)</label>
                  <div className="adm-approvers-list">
                    {admins.map(admin => (
                      <label key={admin._id} className={`adm-approver-item ${selectedApprovers.includes(admin._id) ? 'selected' : ''}`}>
                        <input type="checkbox" checked={selectedApprovers.includes(admin._id)} onChange={() => toggleApprover(admin._id)} />
                        <span>{admin.name} ({admin.role})</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              <div className="adm-modal-footer" style={{ borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Submit for Approval'}
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
