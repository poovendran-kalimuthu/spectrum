import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  FileText, 
  ArrowLeft, 
  Trash2, 
  Download, 
  MessageSquare, 
  Star, 
  Search,
  Heart,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Globe,
  X,
  Eye,
  AlertTriangle,
  Sparkles,
  Filter,
  Bug,
  Lightbulb,
  Check,
  Plus,
  LayoutTemplate,
  GripVertical,
  Type,
  AlignLeft,
  Hash,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { API_URL } from '../config';
import Loader from './Loader';
import { ToastContainer, useToast } from './Toast';
import './AdminFeedback.css';
import Select from './ui/Select';

// ── Field type config ──
const FIELD_TYPES = [
  { value: 'rating', label: 'Star Rating (1–5)', icon: Star },
  { value: 'text', label: 'Short Text', icon: Type },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
];

// ── Default empty field ──
const makeField = () => ({
  id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label: '',
  type: 'text',
  required: false,
  placeholder: ''
});

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [hasIssuesFilter, setHasIssuesFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Detail Modal state
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const { toasts, showToast, removeToast } = useToast();

  // ── Template state ──
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    description: '',
    fields: [makeField()]
  });
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // ── Deep-link: ?tab=review → show critical feedback ──
  useEffect(() => {
    if (searchParams.get('tab') === 'review') {
      setRatingFilter('critical');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFeedbacks();
    fetchTemplates();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/feedback`);
      if (res.data.success) {
        setFeedbacks(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showToast('Error loading feedback reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await axios.get(`${API_URL}/api/feedback/templates`);
      if (res.data.success) {
        setTemplates(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback submission?')) return;
    setDeleting(id);
    try {
      const res = await axios.delete(`${API_URL}/api/feedback/${id}`);
      if (res.data.success) {
        setFeedbacks(feedbacks.filter(f => f._id !== id));
        showToast('Feedback submission deleted successfully');
        if (selectedFeedback && selectedFeedback._id === id) {
          setSelectedFeedback(null);
        }
      }
    } catch (error) {
      showToast('Failed to delete feedback', 'error');
    } finally {
      setDeleting(null);
    }
  };

  // ── Template CRUD ──
  const openTemplateModal = () => {
    setTemplateForm({ title: '', description: '', fields: [makeField()] });
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setTemplateForm({ title: '', description: '', fields: [makeField()] });
  };

  const addField = () => {
    setTemplateForm(prev => ({
      ...prev,
      fields: [...prev.fields, makeField()]
    }));
  };

  const removeField = (fieldId) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const updateField = (fieldId, key, value) => {
    setTemplateForm(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
    }));
  };

  const moveField = (index, direction) => {
    const newFields = [...templateForm.fields];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;
    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]];
    setTemplateForm(prev => ({ ...prev, fields: newFields }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.title.trim()) {
      showToast('Please enter a template title', 'error');
      return;
    }
    const validFields = templateForm.fields.filter(f => f.label.trim());
    if (validFields.length === 0) {
      showToast('Add at least one question with a label', 'error');
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await axios.post(`${API_URL}/api/feedback/templates`, {
        title: templateForm.title.trim(),
        description: templateForm.description.trim(),
        fields: validFields
      });
      if (res.data.success) {
        setTemplates(prev => [res.data.data, ...prev]);
        showToast('Template created successfully!');
        closeTemplateModal();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create template', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this feedback template?')) return;
    setDeletingTemplate(id);
    try {
      const res = await axios.delete(`${API_URL}/api/feedback/templates/${id}`);
      if (res.data.success) {
        setTemplates(prev => prev.filter(t => t._id !== id));
        showToast('Template deleted');
        if (previewTemplate?._id === id) setPreviewTemplate(null);
      }
    } catch (error) {
      showToast('Failed to delete template', 'error');
    } finally {
      setDeletingTemplate(null);
    }
  };

  const exportToPDF = () => {
    if (feedbacks.length === 0) return;

    try {
      const doc = new jsPDF('l', 'pt', 'a4');
      
      doc.setFontSize(22);
      doc.setTextColor(63, 66, 241);
      doc.text("Spectrum HELIX'26 Feedback Report", 40, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);
      doc.text(`Total Responses: ${feedbacks.length}`, 40, 85);

      const tableColumn = [
        'User Details', 
        'Event Context', 
        'Ratings (E/S/O/R)', 
        'Comments (E/S)', 
        'Suggestions & Vision'
      ];

      const tableRows = feedbacks.map(f => [
        `${f.user?.name || 'Anonymous'}\n${f.user?.email || 'N/A'}\n${f.user?.department || 'N/A'} - ${f.user?.year || 'N/A'}yr`,
        f.event?.title || 'Platform Only',
        `Event: ${f.eventRating || 0}/5\nSite: ${f.siteRating || 0}/5\nOverall: ${f.overallSatisfaction || 0}/5\nRecommend: ${f.recommendation || 0}/5`,
        `Event: ${f.eventComments || '-'}\n\nSite: ${f.siteComments || '-'}\n\nTech: ${f.siteTechnicalIssues || '-'}`,
        `Sug: ${f.suggestions || '-'}\n\nNext: ${f.preferredNextEvent || '-'}`
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 8, overflow: 'linebreak' },
        headStyles: { fillColor: [63, 66, 241], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 130 },
          1: { cellWidth: 100 },
          2: { cellWidth: 90 },
          3: { cellWidth: 200 },
          4: { cellWidth: 200 }
        },
        margin: { top: 110, left: 40, right: 40 }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
      }

      doc.save(`Spectrum_Feedback_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF exported successfully');
    } catch (err) {
      showToast('Failed to export PDF', 'error');
    }
  };

  // ── Metrics & Aggregations ──
  const totalCount = feedbacks.length;
  const avgOverall = (feedbacks.reduce((acc, f) => acc + (f.overallSatisfaction || 0), 0) / (totalCount || 1)).toFixed(1);
  const avgRecommend = (feedbacks.reduce((acc, f) => acc + (f.recommendation || 0), 0) / (totalCount || 1)).toFixed(1);
  const avgEvent = (feedbacks.filter(f => f.eventRating).reduce((acc, f) => acc + (f.eventRating || 0), 0) / (feedbacks.filter(f => f.eventRating).length || 1)).toFixed(1);
  const avgSite = (feedbacks.reduce((acc, f) => acc + (f.siteRating || 0), 0) / (totalCount || 1)).toFixed(1);
  const issuesCount = feedbacks.filter(f => f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0).length;
  const uniqueEvents = Array.from(new Set(feedbacks.map(f => f.event?.title).filter(Boolean))).sort();

  // ── Apply Search & Filters ──
  const filteredFeedbacks = feedbacks.filter(f => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (f.user?.name && f.user.name.toLowerCase().includes(query)) ||
      (f.user?.email && f.user.email.toLowerCase().includes(query)) ||
      (f.event?.title && f.event.title.toLowerCase().includes(query)) ||
      (f.eventComments && f.eventComments.toLowerCase().includes(query)) ||
      (f.siteComments && f.siteComments.toLowerCase().includes(query)) ||
      (f.suggestions && f.suggestions.toLowerCase().includes(query)) ||
      (f.preferredNextEvent && f.preferredNextEvent.toLowerCase().includes(query));

    const matchesEvent = 
      eventFilter === 'all' ? true :
      eventFilter === 'platform' ? !f.event :
      f.event?.title === eventFilter;

    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const overall = f.overallSatisfaction || 0;
      if (ratingFilter === 'positive') matchesRating = overall >= 4;
      else if (ratingFilter === 'neutral') matchesRating = overall === 3;
      else if (ratingFilter === 'critical') matchesRating = overall <= 2;
    }

    const matchesIssues = 
      !hasIssuesFilter ? true : 
      (f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0);

    return matchesSearch && matchesEvent && matchesRating && matchesIssues;
  });

  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'rating-desc') return (b.overallSatisfaction || 0) - (a.overallSatisfaction || 0);
    if (sortBy === 'rating-asc') return (a.overallSatisfaction || 0) - (b.overallSatisfaction || 0);
    return 0;
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= rating ? '#fbbf24' : 'transparent'} 
          stroke={i <= rating ? '#fbbf24' : 'var(--clr-text-muted)'} 
          style={{ opacity: i <= rating ? 1 : 0.4 }}
        />
      );
    }
    return stars;
  };

  const getFieldTypeIcon = (type) => {
    const icons = { rating: Star, text: Type, textarea: AlignLeft };
    const Icon = icons[type] || Type;
    return <Icon size={13} />;
  };

  if (loading) return <Loader fullScreen text="Loading Feedback Insights..." />;

  return (
    <div className="af-container page-enter">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="ae-header glass animate-fade-in" style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/events')}>
            <ArrowLeft size={14} />
            Events Dashboard
          </button>
          <div>
            <h1 className="ae-title">Feedback & Quality Insights</h1>
            <p className="ae-subtitle">Overview of user-reported experience ratings, comments, and bug reports</p>
          </div>
        </div>
        <div className="ae-header-right" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={openTemplateModal}
          >
            <LayoutTemplate size={14} style={{ marginRight: '4px' }} />
            Create Template
          </button>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={exportToPDF}
            disabled={feedbacks.length === 0}
          >
            <Download size={14} style={{ marginRight: '4px' }} />
            Export PDF
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="af-stats-grid animate-fade-in-up">
        <div className="af-stat-card">
          <div className="af-stat-icon"><MessageSquare size={22} /></div>
          <div className="af-stat-content">
            <div className="af-stat-label">Total Submissions</div>
            <div className="af-stat-value">{totalCount}</div>
            <div className="af-stat-sub">Completed feedback forms</div>
          </div>
        </div>

        <div className="af-stat-card satisfaction-card">
          <div className="af-stat-icon"><Heart size={22} /></div>
          <div className="af-stat-content">
            <div className="af-stat-label">Overall Satisfaction</div>
            <div className="af-stat-value">{avgOverall}/5.0</div>
            <div className="af-stat-sub">Platform & event average</div>
          </div>
        </div>

        <div className="af-stat-card recommend-card">
          <div className="af-stat-icon"><ThumbsUp size={22} /></div>
          <div className="af-stat-content">
            <div className="af-stat-label">Recommendation Score</div>
            <div className="af-stat-value">{avgRecommend}/5.0</div>
            <div className="af-stat-sub">Willingness to invite others</div>
          </div>
        </div>

        <div className="af-stat-card issues-card">
          <div className="af-stat-icon"><Bug size={22} /></div>
          <div className="af-stat-content">
            <div className="af-stat-label">Bugs/Issues Flagged</div>
            <div className="af-stat-value" style={{ color: issuesCount > 0 ? 'var(--clr-danger)' : 'inherit' }}>
              {issuesCount}
            </div>
            <div className="af-stat-sub">Technical feedback notes</div>
          </div>
        </div>
      </section>

      {/* Visual Aggregation Bars Section */}
      <section className="af-card animate-fade-in-up">
        <div className="af-card-header">
          <h3 className="af-card-title">
            <Sparkles size={18} />
            Experience Component breakdown
          </h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Event Organization</span><span>{avgEvent} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgEvent / 5) * 100}%`, background: 'var(--clr-accent)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Website & Dashboard</span><span>{avgSite} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgSite / 5) * 100}%`, background: 'var(--clr-accent-2)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Overall Satisfaction</span><span>{avgOverall} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgOverall / 5) * 100}%`, background: 'var(--clr-danger)', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--clr-surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border-subtle)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontWeight: '600' }}>Net Satisfaction Rate</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--clr-success)', fontFamily: 'var(--font-heading)' }}>
              {totalCount > 0 ? Math.round((feedbacks.filter(f => f.overallSatisfaction >= 4).length / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </section>

      {/* ── Feedback Templates Section ── */}
      <section className="af-card animate-fade-in-up">
        <div className="af-card-header">
          <h3 className="af-card-title">
            <Layers size={18} />
            Feedback Templates
            <span className="af-template-count-badge">{templates.length}</span>
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openTemplateModal}>
            <Plus size={13} style={{ marginRight: '4px' }} />
            New Template
          </button>
        </div>

        {templatesLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="af-templates-empty">
            <LayoutTemplate size={36} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: '600', color: 'var(--clr-text-heading)', margin: 0 }}>No templates yet</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', margin: '4px 0 1rem' }}>
              Create a reusable feedback form template to standardize responses.
            </p>
            <button className="btn btn-primary btn-sm" onClick={openTemplateModal}>
              <Plus size={13} style={{ marginRight: '4px' }} />
              Create First Template
            </button>
          </div>
        ) : (
          <div className="af-templates-grid">
            {templates.map(tmpl => (
              <div key={tmpl._id} className="af-template-card">
                <div className="af-template-card-header">
                  <div className="af-template-icon">
                    <LayoutTemplate size={18} />
                  </div>
                  <div className="af-template-meta">
                    <span className="af-template-title">{tmpl.title}</span>
                    <span className="af-template-sub">
                      {tmpl.fields.length} question{tmpl.fields.length !== 1 ? 's' : ''} • by {tmpl.createdBy?.name || 'Admin'}
                    </span>
                  </div>
                </div>

                {tmpl.description && (
                  <p className="af-template-desc">{tmpl.description}</p>
                )}

                <div className="af-template-fields-preview">
                  {tmpl.fields.slice(0, 3).map((field, idx) => (
                    <div key={field.id} className="af-template-field-pill">
                      {getFieldTypeIcon(field.type)}
                      <span>{field.label || `Question ${idx + 1}`}</span>
                      {field.required && <span className="af-required-dot" title="Required" />}
                    </div>
                  ))}
                  {tmpl.fields.length > 3 && (
                    <div className="af-template-field-pill more">
                      +{tmpl.fields.length - 3} more
                    </div>
                  )}
                </div>

                <div className="af-template-card-footer">
                  <span className="af-template-date">
                    {new Date(tmpl.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-ghost btn-icon-sm"
                      title="Preview template"
                      onClick={() => setPreviewTemplate(tmpl)}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon-sm"
                      title="Delete template"
                      style={{ color: 'var(--clr-danger)' }}
                      disabled={deletingTemplate === tmpl._id}
                      onClick={() => handleDeleteTemplate(tmpl._id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Main Feedback list Card */}
      <section className="af-card animate-fade-in-up">
        {/* Filters and Controls */}
        <div className="af-filter-bar">
          <div className="af-search-wrapper">
            <Search className="af-search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by participant name, email, comments, suggestions..." 
              className="af-search-input"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--clr-text-muted)' }} />
            <Select 
              className="af-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="platform">Platform Only</option>
              {uniqueEvents.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>

          <Select 
            className="af-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="positive">Positive (4+ ★)</option>
            <option value="neutral">Neutral (3 ★)</option>
            <option value="critical">Needs Attention (≤2 ★)</option>
          </Select>

          <Select 
            className="af-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-desc">Rating: High to Low</option>
            <option value="rating-asc">Rating: Low to High</option>
          </Select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <input 
              type="checkbox" 
              id="af-filter-issues"
              checked={hasIssuesFilter}
              onChange={(e) => setHasIssuesFilter(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="af-filter-issues" style={{ fontSize: '0.8rem', color: 'var(--clr-text-heading)', cursor: 'pointer', margin: 0, fontWeight: '500' }}>
              Bugs Only
            </label>
          </div>
        </div>

        {/* Feedback List Table */}
        <div className="af-table-wrapper">
          <table className="af-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Event Scope</th>
                <th>Ratings (E/S/O/R)</th>
                <th>Direct Comments & Suggestions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>No feedback reports match the filter criteria.</p>
                  </td>
                </tr>
              ) : (
                sortedFeedbacks.map(f => {
                  const initials = f.user?.name ? f.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                  return (
                    <tr key={f._id} onClick={() => setSelectedFeedback(f)}>
                      <td>
                        <div className="af-user-cell">
                          <div className="af-user-avatar">{initials}</div>
                          <div className="af-user-meta">
                            <span className="af-user-name">{f.user?.name || 'Anonymous'}</span>
                            <span className="af-user-email">{f.user?.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`af-event-badge ${!f.event ? 'platform' : ''}`}>
                          {f.event?.title || 'Platform'}
                        </span>
                      </td>
                      <td>
                        <div className="af-scores-grid">
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-accent)' }} />
                            <span>Evt: {f.eventRating || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-accent-2)' }} />
                            <span>Web: {f.siteRating || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-danger)' }} />
                            <span>Sat: {f.overallSatisfaction || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-success)' }} />
                            <span>Rec: {f.recommendation || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div className="af-comment-preview">
                            {f.eventComments || f.siteComments || f.suggestions || 'No comment text'}
                          </div>
                          {f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0 && (
                            <div>
                              <span className="af-issue-badge">
                                <Bug size={10} /> Bug Flagged
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn btn-ghost btn-icon-sm"
                            title="Inspect Feedback"
                            onClick={() => setSelectedFeedback(f)}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon-sm"
                            title="Delete Submission"
                            style={{ color: 'var(--clr-danger)' }}
                            onClick={() => handleDelete(f._id)}
                            disabled={deleting === f._id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CREATE TEMPLATE MODAL ── */}
      {showTemplateModal && (
        <div className="af-modal-overlay" onClick={closeTemplateModal}>
          <div className="af-modal af-template-modal glass" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="af-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <LayoutTemplate size={20} />
                Create Feedback Template
              </h3>
              <button className="af-modal-close" onClick={closeTemplateModal}>
                <X size={18} />
              </button>
            </div>

            <div className="af-modal-body">
              {/* Template meta */}
              <div className="af-template-builder-meta">
                <div className="af-field-group">
                  <label className="af-field-label">Template Title <span className="af-required-star">*</span></label>
                  <input
                    type="text"
                    className="af-field-input"
                    placeholder="e.g., Post-Event Satisfaction Survey"
                    value={templateForm.title}
                    onChange={e => setTemplateForm(p => ({ ...p, title: e.target.value }))}
                  />
                </div>
                <div className="af-field-group">
                  <label className="af-field-label">Description <span style={{ color: 'var(--clr-text-subtle)', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    type="text"
                    className="af-field-input"
                    placeholder="Briefly describe what this template is for"
                    value={templateForm.description}
                    onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Fields Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Questions ({templateForm.fields.length})
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={addField}>
                    <Plus size={13} style={{ marginRight: '4px' }} />
                    Add Question
                  </button>
                </div>

                <div className="af-fields-list">
                  {templateForm.fields.map((field, idx) => (
                    <div key={field.id} className="af-field-row">
                      {/* Reorder buttons */}
                      <div className="af-field-order-btns">
                        <button
                          className="af-order-btn"
                          onClick={() => moveField(idx, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <span className="af-field-num">{idx + 1}</span>
                        <button
                          className="af-order-btn"
                          onClick={() => moveField(idx, 'down')}
                          disabled={idx === templateForm.fields.length - 1}
                          title="Move down"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Field config */}
                      <div className="af-field-config">
                        <input
                          type="text"
                          className="af-field-input"
                          placeholder={`Question ${idx + 1} — e.g., Rate the event experience`}
                          value={field.label}
                          onChange={e => updateField(field.id, 'label', e.target.value)}
                        />
                        <div className="af-field-row-controls">
                          <Select
                            className="af-select af-field-type-select"
                            value={field.type}
                            onChange={e => updateField(field.id, 'type', e.target.value)}
                          >
                            {FIELD_TYPES.map(ft => (
                              <option key={ft.value} value={ft.value}>{ft.label}</option>
                            ))}
                          </Select>

                          {(field.type === 'text' || field.type === 'textarea') && (
                            <input
                              type="text"
                              className="af-field-input af-field-placeholder-input"
                              placeholder="Placeholder text (optional)"
                              value={field.placeholder}
                              onChange={e => updateField(field.id, 'placeholder', e.target.value)}
                            />
                          )}

                          <label className="af-required-toggle">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={e => updateField(field.id, 'required', e.target.checked)}
                            />
                            <span>Required</span>
                          </label>
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        className="af-field-remove-btn"
                        onClick={() => removeField(field.id)}
                        disabled={templateForm.fields.length === 1}
                        title="Remove question"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button className="af-add-field-btn" onClick={addField}>
                  <Plus size={14} />
                  Add Another Question
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="af-modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={closeTemplateModal}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  'Saving…'
                ) : (
                  <>
                    <Check size={14} style={{ marginRight: '4px' }} />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATE PREVIEW MODAL ── */}
      {previewTemplate && (
        <div className="af-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="af-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <Eye size={18} />
                Template Preview
              </h3>
              <button className="af-modal-close" onClick={() => setPreviewTemplate(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="af-modal-body">
              <div className="af-preview-meta">
                <h4 className="af-preview-title">{previewTemplate.title}</h4>
                {previewTemplate.description && (
                  <p className="af-preview-desc">{previewTemplate.description}</p>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span className="af-template-badge">
                    <Hash size={11} /> {previewTemplate.fields.length} questions
                  </span>
                  <span className="af-template-badge">
                    Created by {previewTemplate.createdBy?.name || 'Admin'}
                  </span>
                  <span className="af-template-badge">
                    {new Date(previewTemplate.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="af-preview-fields">
                {previewTemplate.fields.map((field, idx) => (
                  <div key={field.id} className="af-preview-field">
                    <div className="af-preview-field-header">
                      <span className="af-preview-field-num">Q{idx + 1}</span>
                      <span className="af-preview-field-label">
                        {field.label}
                        {field.required && <span className="af-required-star"> *</span>}
                      </span>
                      <span className="af-preview-field-type">
                        {getFieldTypeIcon(field.type)}
                        {FIELD_TYPES.find(ft => ft.value === field.type)?.label}
                      </span>
                    </div>
                    {/* Mock input for preview */}
                    {field.type === 'rating' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingLeft: '2.5rem' }}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={20} stroke="var(--clr-text-muted)" style={{ opacity: 0.4 }} />)}
                      </div>
                    )}
                    {field.type === 'text' && (
                      <input
                        className="af-field-input"
                        style={{ marginTop: '6px', marginLeft: '2.5rem', width: 'calc(100% - 2.5rem)', cursor: 'default', pointerEvents: 'none', opacity: 0.6 }}
                        placeholder={field.placeholder || 'Short answer…'}
                        readOnly
                      />
                    )}
                    {field.type === 'textarea' && (
                      <textarea
                        className="af-field-input"
                        rows={3}
                        style={{ marginTop: '6px', marginLeft: '2.5rem', width: 'calc(100% - 2.5rem)', cursor: 'default', pointerEvents: 'none', opacity: 0.6, resize: 'none' }}
                        placeholder={field.placeholder || 'Long answer…'}
                        readOnly
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="af-modal-footer">
              <button
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--clr-danger)' }}
                onClick={() => { handleDeleteTemplate(previewTemplate._id); setPreviewTemplate(null); }}
                disabled={deletingTemplate === previewTemplate._id}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                Delete Template
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setPreviewTemplate(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DETAIL MODAL */}
      {selectedFeedback && (
        <div className="af-modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="af-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <Sparkles size={20} />
                Feedback Details
              </h3>
              <button className="af-modal-close" onClick={() => setSelectedFeedback(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="af-modal-body">
              <div className="af-detail-header-panel">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--clr-accent) 0%, var(--clr-accent-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                  {selectedFeedback.user?.name ? selectedFeedback.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--clr-text-heading)', margin: 0, fontWeight: '700' }}>
                    {selectedFeedback.user?.name || 'Anonymous'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', margin: '2px 0 0 0' }}>
                    {selectedFeedback.user?.email || 'Anonymous Email'} • {selectedFeedback.user?.department || 'Unspecified Dept'} • Year {selectedFeedback.user?.year || 'N/A'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--clr-text-muted)' }}>Event Context Scope:</span>
                <span className={`af-event-badge ${!selectedFeedback.event ? 'platform' : ''}`}>
                  {selectedFeedback.event?.title || 'Platform Feedback'}
                </span>
              </div>

              <div className="af-ratings-summary-grid">
                <div className="af-rating-box">
                  <span className="af-rating-title">Event rating</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.eventRating || 0)}</div>
                </div>
                <div className="af-rating-box">
                  <span className="af-rating-title">Website Rating</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.siteRating || 0)}</div>
                </div>
                <div className="af-rating-box">
                  <span className="af-rating-title">Overall Satisfaction</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.overallSatisfaction || 0)}</div>
                </div>
                <div className="af-rating-box">
                  <span className="af-rating-title">Recommendation Score</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.recommendation || 0)}</div>
                </div>
              </div>

              <div className="af-comments-container">
                {selectedFeedback.eventComments && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Event Comments</span>
                    <blockquote className="af-quote-block">
                      "{selectedFeedback.eventComments}"
                    </blockquote>
                  </div>
                )}
                {selectedFeedback.siteComments && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Website Comments</span>
                    <blockquote className="af-quote-block">
                      "{selectedFeedback.siteComments}"
                    </blockquote>
                  </div>
                )}
                {selectedFeedback.siteTechnicalIssues && selectedFeedback.siteTechnicalIssues.trim().length > 0 && (
                  <div className="af-comment-section">
                    <span className="af-comment-label" style={{ color: 'var(--clr-danger)' }}>Reported Technical Bugs / Issues</span>
                    <blockquote className="af-quote-block issue">
                      ⚠️ "{selectedFeedback.siteTechnicalIssues}"
                    </blockquote>
                  </div>
                )}
                {selectedFeedback.suggestions && (
                  <div className="af-comment-section">
                    <span className="af-comment-label" style={{ color: '#d97706' }}>Suggestions & Recommendations</span>
                    <blockquote className="af-quote-block suggestion">
                      💡 "{selectedFeedback.suggestions}"
                    </blockquote>
                  </div>
                )}
                {selectedFeedback.preferredNextEvent && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Preferred Next Event / Vision</span>
                    <blockquote className="af-quote-block" style={{ borderLeftColor: 'var(--clr-success)' }}>
                      🎯 "{selectedFeedback.preferredNextEvent}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>

            <div className="af-modal-footer">
              <button 
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--clr-danger)' }}
                onClick={() => handleDelete(selectedFeedback._id)}
                disabled={deleting === selectedFeedback._id}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                Delete Submission
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedFeedback(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;

import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  FileText, 
  ArrowLeft, 
  Trash2, 
  Download, 
  MessageSquare, 
  Star, 
  Search,
  Heart,
  ThumbsUp,
  TrendingUp,
  Trophy,
  Globe,
  X,
  Eye,
  AlertTriangle,
  Sparkles,
  Filter,
  Bug,
  Lightbulb,
  Check
} from 'lucide-react';
import { API_URL } from '../config';
import Loader from './Loader';
import { ToastContainer, useToast } from './Toast';
import './AdminFeedback.css';
import Select from './ui/Select';

const AdminFeedback = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [hasIssuesFilter, setHasIssuesFilter] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Detail Modal state
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const { toasts, showToast, removeToast } = useToast();

  // ── Deep-link: ?tab=review → show critical feedback ──
  useEffect(() => {
    if (searchParams.get('tab') === 'review') {
      setRatingFilter('critical'); // pre-filter to low-rated submissions
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/feedback`);
      if (res.data.success) {
        setFeedbacks(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showToast('Error loading feedback reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback submission?')) return;
    setDeleting(id);
    try {
      const res = await axios.delete(`${API_URL}/api/feedback/${id}`);
      if (res.data.success) {
        setFeedbacks(feedbacks.filter(f => f._id !== id));
        showToast('Feedback submission deleted successfully');
        if (selectedFeedback && selectedFeedback._id === id) {
          setSelectedFeedback(null);
        }
      }
    } catch (error) {
      showToast('Failed to delete feedback', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const exportToPDF = () => {
    if (feedbacks.length === 0) return;

    try {
      const doc = new jsPDF('l', 'pt', 'a4'); // Landscape, points, A4
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(63, 66, 241); // Indigo
      doc.text("Spectrum HELIX'26 Feedback Report", 40, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);
      doc.text(`Total Responses: ${feedbacks.length}`, 40, 85);

      const tableColumn = [
        'User Details', 
        'Event Context', 
        'Ratings (E/S/O/R)', 
        'Comments (E/S)', 
        'Suggestions & Vision'
      ];

      const tableRows = feedbacks.map(f => [
        `${f.user?.name || 'Anonymous'}\n${f.user?.email || 'N/A'}\n${f.user?.department || 'N/A'} - ${f.user?.year || 'N/A'}yr`,
        f.event?.title || 'Platform Only',
        `Event: ${f.eventRating || 0}/5\nSite: ${f.siteRating || 0}/5\nOverall: ${f.overallSatisfaction || 0}/5\nRecommend: ${f.recommendation || 0}/5`,
        `Event: ${f.eventComments || '-'}\n\nSite: ${f.siteComments || '-'}\n\nTech: ${f.siteTechnicalIssues || '-'}`,
        `Sug: ${f.suggestions || '-'}\n\nNext: ${f.preferredNextEvent || '-'}`
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 110,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 8, overflow: 'linebreak' },
        headStyles: { fillColor: [63, 66, 241], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 130 },
          1: { cellWidth: 100 },
          2: { cellWidth: 90 },
          3: { cellWidth: 200 },
          4: { cellWidth: 200 }
        },
        margin: { top: 110, left: 40, right: 40 }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 20, { align: 'center' });
      }

      doc.save(`Spectrum_Feedback_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF exported successfully');
    } catch (err) {
      showToast('Failed to export PDF', 'error');
    }
  };

  // ── Metrics & Aggregations ──
  const totalCount = feedbacks.length;
  
  const avgOverall = (feedbacks.reduce((acc, f) => acc + (f.overallSatisfaction || 0), 0) / (totalCount || 1)).toFixed(1);
  const avgRecommend = (feedbacks.reduce((acc, f) => acc + (f.recommendation || 0), 0) / (totalCount || 1)).toFixed(1);
  const avgEvent = (feedbacks.filter(f => f.eventRating).reduce((acc, f) => acc + (f.eventRating || 0), 0) / (feedbacks.filter(f => f.eventRating).length || 1)).toFixed(1);
  const avgSite = (feedbacks.reduce((acc, f) => acc + (f.siteRating || 0), 0) / (totalCount || 1)).toFixed(1);
  
  const issuesCount = feedbacks.filter(f => f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0).length;

  // Get unique events list for the event filter dropdown
  const uniqueEvents = Array.from(
    new Set(feedbacks.map(f => f.event?.title).filter(Boolean))
  ).sort();

  // ── Apply Search & Filters ──
  const filteredFeedbacks = feedbacks.filter(f => {
    // 1. Search filter
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      (f.user?.name && f.user.name.toLowerCase().includes(query)) ||
      (f.user?.email && f.user.email.toLowerCase().includes(query)) ||
      (f.event?.title && f.event.title.toLowerCase().includes(query)) ||
      (f.eventComments && f.eventComments.toLowerCase().includes(query)) ||
      (f.siteComments && f.siteComments.toLowerCase().includes(query)) ||
      (f.suggestions && f.suggestions.toLowerCase().includes(query)) ||
      (f.preferredNextEvent && f.preferredNextEvent.toLowerCase().includes(query));

    // 2. Event filter
    const matchesEvent = 
      eventFilter === 'all' ? true :
      eventFilter === 'platform' ? !f.event :
      f.event?.title === eventFilter;

    // 3. Rating filter
    let matchesRating = true;
    if (ratingFilter !== 'all') {
      const overall = f.overallSatisfaction || 0;
      if (ratingFilter === 'positive') {
        matchesRating = overall >= 4;
      } else if (ratingFilter === 'neutral') {
        matchesRating = overall === 3;
      } else if (ratingFilter === 'critical') {
        matchesRating = overall <= 2;
      }
    }

    // 4. Technical Issues toggle
    const matchesIssues = 
      !hasIssuesFilter ? true : 
      (f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0);

    return matchesSearch && matchesEvent && matchesRating && matchesIssues;
  });

  // Sorting
  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === 'rating-desc') {
      return (b.overallSatisfaction || 0) - (a.overallSatisfaction || 0);
    }
    if (sortBy === 'rating-asc') {
      return (a.overallSatisfaction || 0) - (b.overallSatisfaction || 0);
    }
    return 0;
  });

  // Star Drawing Utility
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= rating ? '#fbbf24' : 'transparent'} 
          stroke={i <= rating ? '#fbbf24' : 'var(--clr-text-muted)'} 
          style={{ opacity: i <= rating ? 1 : 0.4 }}
        />
      );
    }
    return stars;
  };

  if (loading) return <Loader fullScreen text="Loading Feedback Insights..." />;

  return (
    <div className="af-container page-enter">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="ae-header glass animate-fade-in" style={{ marginBottom: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/events')}>
            <ArrowLeft size={14} />
            Events Dashboard
          </button>
          <div>
            <h1 className="ae-title">Feedback & Quality Insights</h1>
            <p className="ae-subtitle">Overview of user-reported experience ratings, comments, and bug reports</p>
          </div>
        </div>
        <div className="ae-header-right">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={exportToPDF}
            disabled={feedbacks.length === 0}
          >
            <Download size={14} style={{ marginRight: '4px' }} />
            Export PDF
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="af-stats-grid animate-fade-in-up">
        {/* Total Feedbacks */}
        <div className="af-stat-card">
          <div className="af-stat-icon">
            <MessageSquare size={22} />
          </div>
          <div className="af-stat-content">
            <div className="af-stat-label">Total Submissions</div>
            <div className="af-stat-value">{totalCount}</div>
            <div className="af-stat-sub">
              Completed feedback forms
            </div>
          </div>
        </div>

        {/* Satisfaction Rating */}
        <div className="af-stat-card satisfaction-card">
          <div className="af-stat-icon">
            <Heart size={22} />
          </div>
          <div className="af-stat-content">
            <div className="af-stat-label">Overall Satisfaction</div>
            <div className="af-stat-value">{avgOverall}/5.0</div>
            <div className="af-stat-sub">
              Platform & event average
            </div>
          </div>
        </div>

        {/* Recommendation Rate */}
        <div className="af-stat-card recommend-card">
          <div className="af-stat-icon">
            <ThumbsUp size={22} />
          </div>
          <div className="af-stat-content">
            <div className="af-stat-label">Recommendation Score</div>
            <div className="af-stat-value">{avgRecommend}/5.0</div>
            <div className="af-stat-sub">
              Willingness to invite others
            </div>
          </div>
        </div>

        {/* Issues reported */}
        <div className="af-stat-card issues-card">
          <div className="af-stat-icon">
            <Bug size={22} />
          </div>
          <div className="af-stat-content">
            <div className="af-stat-label">Bugs/Issues Flagged</div>
            <div className="af-stat-value" style={{ color: issuesCount > 0 ? 'var(--clr-danger)' : 'inherit' }}>
              {issuesCount}
            </div>
            <div className="af-stat-sub">
              Technical feedback notes
            </div>
          </div>
        </div>
      </section>

      {/* Visual Aggregation Bars Section */}
      <section className="af-card animate-fade-in-up">
        <div className="af-card-header">
          <h3 className="af-card-title">
            <Sparkles size={18} />
            Experience Component breakdown
          </h3>
        </div>
        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {/* Item 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Event Organization</span>
              <span>{avgEvent} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgEvent / 5) * 100}%`, background: 'var(--clr-accent)', borderRadius: '4px' }} />
            </div>
          </div>
          {/* Item 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Website & Dashboard</span>
              <span>{avgSite} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgSite / 5) * 100}%`, background: 'var(--clr-accent-2)', borderRadius: '4px' }} />
            </div>
          </div>
          {/* Item 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600' }}>
              <span>Overall Satisfaction</span>
              <span>{avgOverall} / 5</span>
            </div>
            <div style={{ height: '8px', background: 'var(--clr-surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(avgOverall / 5) * 100}%`, background: 'var(--clr-danger)', borderRadius: '4px' }} />
            </div>
          </div>
          {/* Item 4 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--clr-surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--clr-border-subtle)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', fontWeight: '600' }}>Net Satisfaction Rate</span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--clr-success)', fontFamily: 'var(--font-heading)' }}>
              {totalCount > 0 ? Math.round((feedbacks.filter(f => f.overallSatisfaction >= 4).length / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </section>

      {/* Main Feedback list Card */}
      <section className="af-card animate-fade-in-up">
        {/* Filters and Controls */}
        <div className="af-filter-bar">
          {/* Search box */}
          <div className="af-search-wrapper">
            <Search className="af-search-icon" size={16} />
            <input 
              type="text" 
              placeholder="Search by participant name, email, comments, suggestions..." 
              className="af-search-input"
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

          {/* Event context filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--clr-text-muted)' }} />
            <Select 
              className="af-select"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="platform">Platform Only</option>
              {uniqueEvents.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </Select>
          </div>

          {/* Ratings filter */}
          <Select 
            className="af-select"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="positive">Positive (4+ ★)</option>
            <option value="neutral">Neutral (3 ★)</option>
            <option value="critical">Needs Attention (≤2 ★)</option>
          </Select>

          {/* Sorting */}
          <Select 
            className="af-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-desc">Rating: High to Low</option>
            <option value="rating-asc">Rating: Low to High</option>
          </Select>

          {/* Issues Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <input 
              type="checkbox" 
              id="af-filter-issues"
              checked={hasIssuesFilter}
              onChange={(e) => setHasIssuesFilter(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="af-filter-issues" style={{ fontSize: '0.8rem', color: 'var(--clr-text-heading)', cursor: 'pointer', margin: 0, fontWeight: '500' }}>
              Bugs Only
            </label>
          </div>
        </div>

        {/* Feedback List Table */}
        <div className="af-table-wrapper">
          <table className="af-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Event Scope</th>
                <th>Ratings (E/S/O/R)</th>
                <th>Direct Comments & Suggestions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p>No feedback reports match the filter criteria.</p>
                  </td>
                </tr>
              ) : (
                sortedFeedbacks.map(f => {
                  const initials = f.user?.name ? f.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
                  return (
                    <tr key={f._id} onClick={() => setSelectedFeedback(f)}>
                      <td>
                        <div className="af-user-cell">
                          <div className="af-user-avatar">{initials}</div>
                          <div className="af-user-meta">
                            <span className="af-user-name">{f.user?.name || 'Anonymous'}</span>
                            <span className="af-user-email">{f.user?.email || 'No email'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`af-event-badge ${!f.event ? 'platform' : ''}`}>
                          {f.event?.title || 'Platform'}
                        </span>
                      </td>
                      <td>
                        <div className="af-scores-grid">
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-accent)' }} />
                            <span>Evt: {f.eventRating || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-accent-2)' }} />
                            <span>Web: {f.siteRating || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-danger)' }} />
                            <span>Sat: {f.overallSatisfaction || 0}</span>
                          </div>
                          <div className="af-score-item">
                            <span className="af-score-dot" style={{ background: 'var(--clr-success)' }} />
                            <span>Rec: {f.recommendation || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div className="af-comment-preview">
                            {f.eventComments || f.siteComments || f.suggestions || 'No comment text'}
                          </div>
                          {f.siteTechnicalIssues && f.siteTechnicalIssues.trim().length > 0 && (
                            <div>
                              <span className="af-issue-badge">
                                <Bug size={10} /> Bug Flagged
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn btn-ghost btn-icon-sm"
                            title="Inspect Feedback"
                            onClick={() => setSelectedFeedback(f)}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-icon-sm"
                            title="Delete Submission"
                            style={{ color: 'var(--clr-danger)' }}
                            onClick={() => handleDelete(f._id)}
                            disabled={deleting === f._id}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* INSPECT DETAIL MODAL */}
      {selectedFeedback && (
        <div className="af-modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="af-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <Sparkles size={20} />
                Feedback Details
              </h3>
              <button className="af-modal-close" onClick={() => setSelectedFeedback(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="af-modal-body">
              {/* Operator details header */}
              <div className="af-detail-header-panel">
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--clr-accent) 0%, var(--clr-accent-2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                  {selectedFeedback.user?.name ? selectedFeedback.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--clr-text-heading)', margin: 0, fontWeight: '700' }}>
                    {selectedFeedback.user?.name || 'Anonymous'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', margin: '2px 0 0 0' }}>
                    {selectedFeedback.user?.email || 'Anonymous Email'} • {selectedFeedback.user?.department || 'Unspecified Dept'} • Year {selectedFeedback.user?.year || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Event Scope Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--clr-text-muted)' }}>Event Context Scope:</span>
                <span className={`af-event-badge ${!selectedFeedback.event ? 'platform' : ''}`}>
                  {selectedFeedback.event?.title || 'Platform Feedback'}
                </span>
              </div>

              {/* Ratings Grid */}
              <div className="af-ratings-summary-grid">
                <div className="af-rating-box">
                  <span className="af-rating-title">Event rating</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.eventRating || 0)}</div>
                </div>

                <div className="af-rating-box">
                  <span className="af-rating-title">Website Rating</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.siteRating || 0)}</div>
                </div>

                <div className="af-rating-box">
                  <span className="af-rating-title">Overall Satisfaction</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.overallSatisfaction || 0)}</div>
                </div>

                <div className="af-rating-box">
                  <span className="af-rating-title">Recommendation Score</span>
                  <div className="af-rating-stars">{renderStars(selectedFeedback.recommendation || 0)}</div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="af-comments-container">
                {selectedFeedback.eventComments && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Event Comments</span>
                    <blockquote className="af-quote-block">
                      "{selectedFeedback.eventComments}"
                    </blockquote>
                  </div>
                )}

                {selectedFeedback.siteComments && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Website Comments</span>
                    <blockquote className="af-quote-block">
                      "{selectedFeedback.siteComments}"
                    </blockquote>
                  </div>
                )}

                {selectedFeedback.siteTechnicalIssues && selectedFeedback.siteTechnicalIssues.trim().length > 0 && (
                  <div className="af-comment-section">
                    <span className="af-comment-label" style={{ color: 'var(--clr-danger)' }}>Reported Technical Bugs / Issues</span>
                    <blockquote className="af-quote-block issue">
                      ⚠️ "{selectedFeedback.siteTechnicalIssues}"
                    </blockquote>
                  </div>
                )}

                {selectedFeedback.suggestions && (
                  <div className="af-comment-section">
                    <span className="af-comment-label" style={{ color: '#d97706' }}>Suggestions & Recommendations</span>
                    <blockquote className="af-quote-block suggestion">
                      💡 "{selectedFeedback.suggestions}"
                    </blockquote>
                  </div>
                )}

                {selectedFeedback.preferredNextEvent && (
                  <div className="af-comment-section">
                    <span className="af-comment-label">Preferred Next Event / Vision</span>
                    <blockquote className="af-quote-block" style={{ borderLeftColor: 'var(--clr-success)' }}>
                      🎯 "{selectedFeedback.preferredNextEvent}"
                    </blockquote>
                  </div>
                )}
              </div>
            </div>

            <div className="af-modal-footer">
              <button 
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--clr-danger)' }}
                onClick={() => handleDelete(selectedFeedback._id)}
                disabled={deleting === selectedFeedback._id}
              >
                <Trash2 size={14} style={{ marginRight: '4px' }} />
                Delete Submission
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedFeedback(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
