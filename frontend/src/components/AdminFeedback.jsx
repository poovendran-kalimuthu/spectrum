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
