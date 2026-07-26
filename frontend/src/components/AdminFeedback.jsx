import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
  ArrowLeft, Trash2, Download, MessageSquare, Star, Search,
  Heart, ThumbsUp, X, Eye, Sparkles, Filter, Bug, Check, Plus,
  LayoutTemplate, Type, AlignLeft, Hash, ChevronDown, ChevronUp,
  Layers, Mail, Phone, Link, ToggleLeft, BarChart2, Sliders,
  Grid, List, Calendar, Clock, Upload, MousePointer, CheckSquare,
  TrendingUp, Activity, FlaskConical, Send, CheckCircle2, RotateCcw, Code2
} from 'lucide-react';
import { API_URL } from '../config';
import Loader from './Loader';
import { ToastContainer, useToast } from './Toast';
import './AdminFeedback.css';
import Select from './ui/Select';

// ── Field type definitions grouped by category ──
const FIELD_TYPE_GROUPS = [
  {
    group: 'Text Input',
    types: [
      { value: 'text',        label: 'Short Text',        icon: Type,         hint: 'Name, Title, Favorite Topic' },
      { value: 'textarea',    label: 'Long Text',          icon: AlignLeft,    hint: 'Suggestions, Comments' },
      { value: 'number',      label: 'Number',             icon: Hash,         hint: 'Age, Roll Number' },
      { value: 'email',       label: 'Email',              icon: Mail,         hint: 'Contact Email' },
      { value: 'phone',       label: 'Phone',              icon: Phone,        hint: 'Contact Number' },
      { value: 'url',         label: 'URL',                icon: Link,         hint: 'Portfolio / Reference Link' },
    ]
  },
  {
    group: 'Selection',
    types: [
      { value: 'dropdown',        label: 'Dropdown',          icon: ChevronDown,  hint: 'Department, Year, Event' },
      { value: 'radio',           label: 'Radio Button',      icon: MousePointer, hint: 'Single Choice' },
      { value: 'checkbox',        label: 'Checkbox',          icon: CheckSquare,  hint: 'Multiple Choices' },
      { value: 'multiple_choice', label: 'Multiple Choice',   icon: List,         hint: 'Favorite Sessions' },
      { value: 'yes_no',          label: 'Yes / No Toggle',   icon: ToggleLeft,   hint: 'Binary Questions' },
    ]
  },
  {
    group: 'Rating & Scale',
    types: [
      { value: 'rating',        label: 'Star Rating (1–5)',    icon: Star,       hint: 'Overall Experience' },
      { value: 'rating_scale',  label: 'Rating Scale (1–10)',  icon: BarChart2,  hint: 'Satisfaction Score' },
      { value: 'emoji_rating',  label: 'Emoji Rating',         icon: Activity,   hint: '😊 😐 😞' },
      { value: 'slider',        label: 'Slider',               icon: Sliders,    hint: 'Difficulty, Satisfaction' },
      { value: 'nps',           label: 'NPS Score (0–10)',     icon: TrendingUp, hint: 'Recommendation Score' },
    ]
  },
  {
    group: 'Grid / Scale',
    types: [
      { value: 'likert', label: 'Likert Scale',     icon: Grid, hint: 'Strongly Agree → Strongly Disagree' },
      { value: 'matrix', label: 'Matrix / Grid',    icon: Grid, hint: 'Rate multiple aspects together' },
    ]
  },
  {
    group: 'Date, Time & File',
    types: [
      { value: 'date',        label: 'Date',        icon: Calendar, hint: 'Feedback Date' },
      { value: 'time',        label: 'Time',        icon: Clock,    hint: 'Session Time' },
      { value: 'file_upload', label: 'File Upload', icon: Upload,   hint: 'Screenshots, Documents' },
    ]
  },
];

// Flat list for quick lookups
const FIELD_TYPES = FIELD_TYPE_GROUPS.flatMap(g => g.types);

// Field types that need an "options" list
const OPTION_TYPES = new Set(['dropdown', 'radio', 'checkbox', 'multiple_choice']);
// Field types that need placeholder text
const PLACEHOLDER_TYPES = new Set(['text', 'textarea', 'number', 'email', 'phone', 'url']);
// Field types that need min/max/step
const RANGE_TYPES = new Set(['slider', 'rating_scale', 'nps', 'number']);

// ── Default empty field ──
const makeField = () => ({
  id:          `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  label:       '',
  type:        'text',
  required:    false,
  placeholder: '',
  options:     ['Option 1', 'Option 2'],
  min:         0,
  max:         10,
  step:        1,
  scaleLabels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
  rows:        ['Aspect 1', 'Aspect 2'],
  columns:     ['Poor', 'Average', 'Good', 'Excellent'],
});

// ── Icon helper ──
const getFieldTypeIcon = (type) => {
  const ft = FIELD_TYPES.find(f => f.value === type);
  const Icon = ft?.icon || Type;
  return <Icon size={13} />;
};

// ── Renders a preview stub for each field type ──
const FieldPreview = ({ field }) => {
  const st = { marginTop: '6px', marginLeft: '2.5rem', pointerEvents: 'none', opacity: 0.65 };
  const inputSt = { ...st, display: 'block', width: 'calc(100% - 2.5rem)', padding: '7px 10px', borderRadius: '6px', border: '1.5px solid var(--clr-border)', background: 'var(--clr-surface)', color: 'var(--clr-text-muted)', fontSize: '0.82rem' };

  switch (field.type) {
    case 'rating':
      return (
        <div className="ref-rating-container" style={{ ...st, marginTop: '8px' }}>
          <div className="ref-rating-squares">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`ref-rating-square ${s === 5 ? 'active' : ''}`}>
                {s}
              </div>
            ))}
          </div>
          <div className="ref-star-indicator">
            <Star size={16} fill="#10b981" stroke="#10b981" />
            <span>Stars</span>
          </div>
        </div>
      );

    case 'rating_scale':
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', ...st }}>
          {Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
            <span key={n} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1.5px solid var(--clr-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{n}</span>
          ))}
        </div>
      );

    case 'emoji_rating':
      return <div style={{ display: 'flex', gap: '10px', ...st, fontSize: '1.5rem' }}>{'😞 😐 😊'.split(' ').map((e,i) => <span key={i}>{e}</span>)}</div>;

    case 'slider':
      return (
        <div style={{ ...st, width: 'calc(100% - 2.5rem)' }}>
          <input type="range" min={field.min || 0} max={field.max || 10} step={field.step || 1} defaultValue={field.min || 0} style={{ width: '100%', accentColor: 'var(--clr-accent)' }} readOnly />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginTop: '2px' }}>
            <span>{field.min ?? 0}</span><span>{field.max ?? 10}</span>
          </div>
        </div>
      );

    case 'nps':
      return (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', ...st }}>
          {Array.from({ length: 11 }, (_, i) => i).map(n => (
            <span key={n} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid var(--clr-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{n}</span>
          ))}
        </div>
      );

    case 'yes_no':
      return (
        <div style={{ display: 'flex', gap: '8px', ...st }}>
          {['Yes', 'No'].map(v => <span key={v} style={{ padding: '5px 18px', borderRadius: '999px', border: '1.5px solid var(--clr-border)', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{v}</span>)}
        </div>
      );

    case 'radio':
    case 'multiple_choice':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...st }}>
          {(field.options || ['Option 1', 'Option 2']).map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: field.type === 'radio' ? '50%' : '3px', border: '1.5px solid var(--clr-border)', display: 'inline-block', flexShrink: 0 }} />
              {o}
            </div>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', ...st }}>
          {(field.options || ['Option 1', 'Option 2']).map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '3px', border: '1.5px solid var(--clr-border)', display: 'inline-block', flexShrink: 0 }} />
              {o}
            </div>
          ))}
        </div>
      );

    case 'dropdown':
      return <select style={{ ...inputSt, width: 'calc(100% - 2.5rem)', cursor: 'default' }} disabled><option>{(field.options || ['Select…'])[0]}</option></select>;

    case 'likert':
      return (
        <div style={{ ...st, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', color: 'var(--clr-text-muted)', tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 6px', textAlign: 'left', width: '30%' }} />
                {(field.scaleLabels || ['Strongly Disagree','Disagree','Neutral','Agree','Strongly Agree']).map((l,i) => (
                  <th key={i} style={{ padding: '4px 2px', textAlign: 'center', fontWeight: 500 }}>{l}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
      );

    case 'matrix':
      return (
        <div style={{ ...st, overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.72rem', color: 'var(--clr-text-muted)', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '3px 6px' }} />
                {(field.columns || ['Poor','Average','Good','Excellent']).map((c,i) => <th key={i} style={{ padding: '3px 6px', textAlign: 'center', fontWeight: 500 }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {(field.rows || ['Aspect 1']).map((r,i) => (
                <tr key={i}>
                  <td style={{ padding: '3px 6px' }}>{r}</td>
                  {(field.columns || ['Poor','Average','Good','Excellent']).map((_,j) => (
                    <td key={j} style={{ padding: '3px 6px', textAlign: 'center' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.5px solid var(--clr-border)', display: 'inline-block' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'date':
      return <input type="date" style={inputSt} readOnly />;
    case 'time':
      return <input type="time" style={inputSt} readOnly />;
    case 'file_upload':
      return <div style={{ ...inputSt, textAlign: 'center', padding: '12px', border: '1.5px dashed var(--clr-border)' }}>📎 Click to upload file</div>;

    default: {
      const inputType = ({ email: 'email', phone: 'tel', number: 'number', url: 'url' })[field.type] || 'text';
      return <input type={inputType} style={inputSt} placeholder={field.placeholder || `${FIELD_TYPES.find(f => f.value === field.type)?.label || 'Answer'}…`} readOnly />;
    }
  }
};

// ── Extra config UI rendered inside a field row ──
const FieldExtraConfig = ({ field, updateField }) => {
  // Options list management
  const setOption = (idx, val) => {
    const opts = [...(field.options || [])];
    opts[idx] = val;
    updateField(field.id, 'options', opts);
  };
  const addOption = () => updateField(field.id, 'options', [...(field.options || []), `Option ${(field.options || []).length + 1}`]);
  const removeOption = (idx) => updateField(field.id, 'options', (field.options || []).filter((_, i) => i !== idx));

  // Tag-list management helper (for rows/columns/scaleLabels)
  const setTagItem = (key, idx, val) => {
    const arr = [...(field[key] || [])];
    arr[idx] = val;
    updateField(field.id, key, arr);
  };
  const addTag = (key, def) => updateField(field.id, key, [...(field[key] || []), def]);
  const removeTag = (key, idx) => updateField(field.id, key, (field[key] || []).filter((_, i) => i !== idx));

  const TagList = ({ fieldKey, label, defaultItem }) => (
    <div className="af-extra-section">
      <span className="af-extra-label">{label}</span>
      <div className="af-options-list">
        {(field[fieldKey] || []).map((item, idx) => (
          <div key={idx} className="af-option-row">
            <input className="af-field-input af-option-input" value={item} onChange={e => setTagItem(fieldKey, idx, e.target.value)} />
            <button className="af-option-remove" onClick={() => removeTag(fieldKey, idx)} disabled={(field[fieldKey] || []).length <= 1}><X size={11} /></button>
          </div>
        ))}
        <button className="af-add-option-btn" onClick={() => addTag(fieldKey, defaultItem)}><Plus size={11} /> Add</button>
      </div>
    </div>
  );

  if (OPTION_TYPES.has(field.type)) {
    return (
      <div className="af-extra-section">
        <span className="af-extra-label">Options</span>
        <div className="af-options-list">
          {(field.options || []).map((opt, idx) => (
            <div key={idx} className="af-option-row">
              <input className="af-field-input af-option-input" value={opt} placeholder={`Option ${idx + 1}`} onChange={e => setOption(idx, e.target.value)} />
              <button className="af-option-remove" onClick={() => removeOption(idx)} disabled={(field.options || []).length <= 1}><X size={11} /></button>
            </div>
          ))}
          <button className="af-add-option-btn" onClick={addOption}><Plus size={11} /> Add Option</button>
        </div>
      </div>
    );
  }

  if (RANGE_TYPES.has(field.type)) {
    return (
      <div className="af-extra-section">
        <span className="af-extra-label">Range</span>
        <div className="af-range-row">
          <label className="af-range-label">Min<input className="af-field-input af-range-input" type="number" value={field.min ?? 0} onChange={e => updateField(field.id, 'min', Number(e.target.value))} /></label>
          <label className="af-range-label">Max<input className="af-field-input af-range-input" type="number" value={field.max ?? 10} onChange={e => updateField(field.id, 'max', Number(e.target.value))} /></label>
          {field.type === 'slider' && (
            <label className="af-range-label">Step<input className="af-field-input af-range-input" type="number" value={field.step ?? 1} onChange={e => updateField(field.id, 'step', Number(e.target.value))} /></label>
          )}
        </div>
      </div>
    );
  }

  if (field.type === 'likert') {
    return <TagList fieldKey="scaleLabels" label="Scale Labels" defaultItem="New Label" />;
  }

  if (field.type === 'matrix') {
    return (
      <>
        <TagList fieldKey="rows" label="Row Questions" defaultItem="New Row" />
        <TagList fieldKey="columns" label="Column Labels" defaultItem="New Column" />
      </>
    );
  }

  return null;
};

// ══════════════════════════════════════════
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
  const [templateForm, setTemplateForm] = useState({ title: '', description: '', fields: [makeField()] });
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // ── Test Template Modal state ──
  const [testTemplate, setTestTemplate] = useState(null);
  const [testAnswers, setTestAnswers] = useState({});
  const [testErrors, setTestErrors] = useState({});
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  const openTestModal = (template) => {
    setTestTemplate(template);
    setTestAnswers({});
    setTestErrors({});
    setIsTestSubmitted(false);
    setShowPayload(false);
  };

  const handleTestSubmit = (e) => {
    if (e) e.preventDefault();
    const errors = {};
    testTemplate?.fields.forEach(field => {
      if (field.required) {
        const val = testAnswers[field.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          errors[field.id] = 'This question is required';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setTestErrors(errors);
      showToast('Please answer all required questions before submitting', 'error');
      return;
    }

    setTestErrors({});
    setIsTestSubmitted(true);
    showToast('Test submission successful! (Simulated response)', 'success');
  };

  const handleTestFormFromBuilder = () => {
    if (!templateForm.title.trim()) {
      showToast('Please enter a template title to test', 'error');
      return;
    }
    const validFields = templateForm.fields.filter(f => f.label.trim());
    if (!validFields.length) {
      showToast('Add at least one question with a label to test', 'error');
      return;
    }
    openTestModal({
      _id: 'test_preview_temp',
      title: templateForm.title || 'Untitled Template',
      description: templateForm.description || 'Draft Feedback Template',
      fields: validFields,
      createdAt: new Date().toISOString()
    });
  };

  useEffect(() => {
    if (searchParams.get('tab') === 'review') {
      setRatingFilter('critical');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // ── Map Template to Event Modal state ──
  const [mapModalTemplate, setMapModalTemplate] = useState(null);
  const [adminEvents, setAdminEvents] = useState([]);
  const [selectedMapEventId, setSelectedMapEventId] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
    fetchTemplates();
    fetchAdminEvents();
  }, []);

  const fetchAdminEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/events`, { withCredentials: true });
      if (res.data.success) setAdminEvents(res.data.events);
    } catch (err) {
      console.error('Error fetching admin events:', err);
    }
  };

  const handleMapToEventSubmit = async () => {
    if (!selectedMapEventId) {
      showToast('Please select an event to map', 'error');
      return;
    }
    setMappingLoading(true);
    try {
      const res = await axios.put(`${API_URL}/api/admin/events/${selectedMapEventId}`, {
        feedbackTemplate: mapModalTemplate._id
      }, { withCredentials: true });
      if (res.data.success) {
        const mappedEvent = adminEvents.find(e => e._id === selectedMapEventId);
        showToast(`Successfully mapped "${mapModalTemplate.title}" to "${mappedEvent?.title || 'Event'}"!`, 'success');
        setMapModalTemplate(null);
        setSelectedMapEventId('');
        fetchAdminEvents();
      }
    } catch (err) {
      showToast('Failed to map template to event', 'error');
    } finally {
      setMappingLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/feedback`);
      if (res.data.success) setFeedbacks(res.data.data);
    } catch (error) {
      showToast('Error loading feedback reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const res = await axios.get(`${API_URL}/api/feedback/templates`);
      if (res.data.success) setTemplates(res.data.data);
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
        if (selectedFeedback?._id === id) setSelectedFeedback(null);
      }
    } catch { showToast('Failed to delete feedback', 'error'); }
    finally { setDeleting(null); }
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

  const addField = () => setTemplateForm(prev => ({ ...prev, fields: [...prev.fields, makeField()] }));

  const removeField = (fieldId) => setTemplateForm(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== fieldId) }));

  const updateField = (fieldId, key, value) =>
    setTemplateForm(prev => ({ ...prev, fields: prev.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f) }));

  const moveField = (index, direction) => {
    const newFields = [...templateForm.fields];
    const swap = direction === 'up' ? index - 1 : index + 1;
    if (swap < 0 || swap >= newFields.length) return;
    [newFields[index], newFields[swap]] = [newFields[swap], newFields[index]];
    setTemplateForm(prev => ({ ...prev, fields: newFields }));
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.title.trim()) { showToast('Please enter a template title', 'error'); return; }
    const validFields = templateForm.fields.filter(f => f.label.trim());
    if (!validFields.length) { showToast('Add at least one question with a label', 'error'); return; }
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
    } finally { setSavingTemplate(false); }
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
    } catch { showToast('Failed to delete template', 'error'); }
    finally { setDeletingTemplate(null); }
  };

  const exportToPDF = () => {
    if (!feedbacks.length) return;
    try {
      const doc = new jsPDF('l', 'pt', 'a4');
      doc.setFontSize(22); doc.setTextColor(63, 66, 241);
      doc.text("Spectrum HELIX'26 Feedback Report", 40, 50);
      doc.setFontSize(10); doc.setTextColor(120, 120, 120);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 70);
      doc.text(`Total Responses: ${feedbacks.length}`, 40, 85);
      const tableColumn = ['User Details','Event Context','Ratings (E/S/O/R)','Comments (E/S)','Suggestions & Vision'];
      const tableRows = feedbacks.map(f => [
        `${f.user?.name||'Anonymous'}\n${f.user?.email||'N/A'}\n${f.user?.department||'N/A'} - ${f.user?.year||'N/A'}yr`,
        f.event?.title || 'Platform Only',
        `Event: ${f.eventRating||0}/5\nSite: ${f.siteRating||0}/5\nOverall: ${f.overallSatisfaction||0}/5\nRecommend: ${f.recommendation||0}/5`,
        `Event: ${f.eventComments||'-'}\n\nSite: ${f.siteComments||'-'}\n\nTech: ${f.siteTechnicalIssues||'-'}`,
        `Sug: ${f.suggestions||'-'}\n\nNext: ${f.preferredNextEvent||'-'}`
      ]);
      doc.autoTable({ head: [tableColumn], body: tableRows, startY: 110, theme: 'grid',
        styles: { fontSize: 7, cellPadding: 8, overflow: 'linebreak' },
        headStyles: { fillColor: [63,66,241], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248,250,252] },
        columnStyles: { 0:{cellWidth:130},1:{cellWidth:100},2:{cellWidth:90},3:{cellWidth:200},4:{cellWidth:200} },
        margin: { top:110, left:40, right:40 }
      });
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width/2, doc.internal.pageSize.height-20, { align:'center' });
      }
      doc.save(`Spectrum_Feedback_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('PDF exported successfully');
    } catch { showToast('Failed to export PDF', 'error'); }
  };

  // ── Metrics ──
  const totalCount = feedbacks.length;
  const avgOverall = (feedbacks.reduce((a,f) => a+(f.overallSatisfaction||0),0)/(totalCount||1)).toFixed(1);
  const avgRecommend = (feedbacks.reduce((a,f) => a+(f.recommendation||0),0)/(totalCount||1)).toFixed(1);
  const avgEvent = (feedbacks.filter(f=>f.eventRating).reduce((a,f) => a+(f.eventRating||0),0)/(feedbacks.filter(f=>f.eventRating).length||1)).toFixed(1);
  const avgSite = (feedbacks.reduce((a,f) => a+(f.siteRating||0),0)/(totalCount||1)).toFixed(1);
  const issuesCount = feedbacks.filter(f => f.siteTechnicalIssues?.trim().length>0).length;
  const uniqueEvents = Array.from(new Set(feedbacks.map(f=>f.event?.title).filter(Boolean))).sort();

  // ── Filters ──
  const filteredFeedbacks = feedbacks.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || [f.user?.name,f.user?.email,f.event?.title,f.eventComments,f.siteComments,f.suggestions,f.preferredNextEvent].some(s=>s?.toLowerCase().includes(q));
    const matchEvent = eventFilter==='all'?true:eventFilter==='platform'?!f.event:f.event?.title===eventFilter;
    const o = f.overallSatisfaction||0;
    const matchRating = ratingFilter==='all'?true:ratingFilter==='positive'?o>=4:ratingFilter==='neutral'?o===3:o<=2;
    const matchIssues = !hasIssuesFilter||f.siteTechnicalIssues?.trim().length>0;
    return matchSearch&&matchEvent&&matchRating&&matchIssues;
  });

  const sortedFeedbacks = [...filteredFeedbacks].sort((a,b) => {
    if (sortBy==='newest') return new Date(b.createdAt)-new Date(a.createdAt);
    if (sortBy==='oldest') return new Date(a.createdAt)-new Date(b.createdAt);
    if (sortBy==='rating-desc') return (b.overallSatisfaction||0)-(a.overallSatisfaction||0);
    if (sortBy==='rating-asc') return (a.overallSatisfaction||0)-(b.overallSatisfaction||0);
    return 0;
  });

  const renderStars = (rating) => Array.from({length:5},(_,i) => (
    <Star key={i+1} size={14}
      fill={i+1<=rating?'#fbbf24':'transparent'}
      stroke={i+1<=rating?'#fbbf24':'var(--clr-text-muted)'}
      style={{ opacity: i+1<=rating?1:0.4 }}
    />
  ));

  if (loading) return <Loader fullScreen text="Loading Feedback Insights..." />;

  return (
    <div className="af-container page-enter">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <header className="ae-header glass animate-fade-in" style={{ marginBottom:'2rem', borderRadius:'var(--radius-lg)' }}>
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/events')}>
            <ArrowLeft size={14} /> Events Dashboard
          </button>
          <div>
            <h1 className="ae-title">Feedback & Quality Insights</h1>
            <p className="ae-subtitle">Overview of user-reported experience ratings, comments, and bug reports</p>
          </div>
        </div>
        <div className="ae-header-right" style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={openTemplateModal}>
            <LayoutTemplate size={14} style={{ marginRight:'4px' }} /> Create Template
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportToPDF} disabled={!feedbacks.length}>
            <Download size={14} style={{ marginRight:'4px' }} /> Export PDF
          </button>
        </div>
      </header>

      {/* KPI Cards */}
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
            <div className="af-stat-value" style={{ color: issuesCount>0?'var(--clr-danger)':'inherit' }}>{issuesCount}</div>
            <div className="af-stat-sub">Technical feedback notes</div>
          </div>
        </div>
      </section>

      {/* Breakdown bars */}
      <section className="af-card animate-fade-in-up">
        <div className="af-card-header">
          <h3 className="af-card-title"><Sparkles size={18} /> Experience Component breakdown</h3>
        </div>
        <div style={{ padding:'1.5rem', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1.5rem' }}>
          {[['Event Organization', avgEvent, 'var(--clr-accent)'],['Website & Dashboard', avgSite, 'var(--clr-accent-2)'],['Overall Satisfaction', avgOverall, 'var(--clr-danger)']].map(([lbl,val,clr]) => (
            <div key={lbl} style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.85rem', fontWeight:'600' }}>
                <span>{lbl}</span><span>{val} / 5</span>
              </div>
              <div style={{ height:'8px', background:'var(--clr-surface-3)', borderRadius:'4px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(val/5)*100}%`, background:clr, borderRadius:'4px' }} />
              </div>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--clr-surface-2)', padding:'10px 14px', borderRadius:'var(--radius-md)', border:'1px solid var(--clr-border-subtle)' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--clr-text-muted)', fontWeight:'600' }}>Net Satisfaction Rate</span>
            <span style={{ fontSize:'1.2rem', fontWeight:'800', color:'var(--clr-success)', fontFamily:'var(--font-heading)' }}>
              {totalCount>0?Math.round((feedbacks.filter(f=>f.overallSatisfaction>=4).length/totalCount)*100):0}%
            </span>
          </div>
        </div>
      </section>

      {/* ── Templates Section ── */}
      <section className="af-card animate-fade-in-up">
        <div className="af-card-header">
          <h3 className="af-card-title">
            <Layers size={18} /> Feedback Templates
            <span className="af-template-count-badge">{templates.length}</span>
          </h3>
          <button className="btn btn-primary btn-sm" onClick={openTemplateModal}>
            <Plus size={13} style={{ marginRight:'4px' }} /> New Template
          </button>
        </div>

        {templatesLoading ? (
          <div style={{ padding:'2rem', textAlign:'center', color:'var(--clr-text-muted)', fontSize:'0.875rem' }}>Loading templates…</div>
        ) : templates.length === 0 ? (
          <div className="af-templates-empty">
            <LayoutTemplate size={36} style={{ opacity:0.25, marginBottom:'0.75rem' }} />
            <p style={{ fontWeight:'600', color:'var(--clr-text-heading)', margin:0 }}>No templates yet</p>
            <p style={{ fontSize:'0.8rem', color:'var(--clr-text-muted)', margin:'4px 0 1rem' }}>Create a reusable feedback form template to standardize responses.</p>
            <button className="btn btn-primary btn-sm" onClick={openTemplateModal}><Plus size={13} style={{ marginRight:'4px' }} /> Create First Template</button>
          </div>
        ) : (
          <div className="af-templates-grid">
            {templates.map(tmpl => (
              <div key={tmpl._id} className="af-template-card">
                <div className="af-template-card-header">
                  <div className="af-template-icon"><LayoutTemplate size={18} /></div>
                  <div className="af-template-meta">
                    <span className="af-template-title">{tmpl.title}</span>
                    <span className="af-template-sub">{tmpl.fields.length} question{tmpl.fields.length!==1?'s':''} • by {tmpl.createdBy?.name||'Admin'}</span>
                  </div>
                </div>
                {tmpl.description && <p className="af-template-desc">{tmpl.description}</p>}
                <div className="af-template-fields-preview">
                  {tmpl.fields.slice(0,3).map((field, idx) => (
                    <div key={field.id} className="af-template-field-pill">
                      {getFieldTypeIcon(field.type)}
                      <span>{field.label||`Question ${idx+1}`}</span>
                      {field.required && <span className="af-required-dot" title="Required" />}
                    </div>
                  ))}
                  {tmpl.fields.length>3 && <div className="af-template-field-pill more">+{tmpl.fields.length-3} more</div>}
                </div>
                <div className="af-template-card-footer">
                  <span className="af-template-date">{new Date(tmpl.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  <div style={{ display:'flex', gap:'4px' }}>
                    <button className="btn btn-secondary btn-xs" style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', fontSize:'0.75rem', color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.4)' }} title="Map Template to an Event" onClick={() => { setMapModalTemplate(tmpl); setSelectedMapEventId(''); }}>
                      <Link size={12} /> Map Event
                    </button>
                    <button className="btn btn-secondary btn-xs" style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'3px 8px', fontSize:'0.75rem' }} title="Test Feedback Form" onClick={() => openTestModal(tmpl)}>
                      <FlaskConical size={12} /> Test
                    </button>
                    <button className="btn btn-ghost btn-icon-sm" title="Preview" onClick={() => setPreviewTemplate(tmpl)}><Eye size={14} /></button>
                    <button className="btn btn-ghost btn-icon-sm" title="Delete" style={{ color:'var(--clr-danger)' }} disabled={deletingTemplate===tmpl._id} onClick={() => handleDeleteTemplate(tmpl._id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Feedback Submissions Table ── */}
      <section className="af-card animate-fade-in-up">
        <div className="af-filter-bar">
          <div className="af-search-wrapper">
            <Search className="af-search-icon" size={16} />
            <input type="text" placeholder="Search by participant name, email, comments…" className="af-search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', color:'var(--clr-text-muted)' }}><X size={14} /></button>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Filter size={14} style={{ color:'var(--clr-text-muted)' }} />
            <Select className="af-select" value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
              <option value="all">All Events</option>
              <option value="platform">Platform Only</option>
              {uniqueEvents.map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
          </div>
          <Select className="af-select" value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
            <option value="all">All Ratings</option>
            <option value="positive">Positive (4+ ★)</option>
            <option value="neutral">Neutral (3 ★)</option>
            <option value="critical">Needs Attention (≤2 ★)</option>
          </Select>
          <Select className="af-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-desc">Rating: High to Low</option>
            <option value="rating-asc">Rating: Low to High</option>
          </Select>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginLeft:'6px' }}>
            <input type="checkbox" id="af-filter-issues" checked={hasIssuesFilter} onChange={e => setHasIssuesFilter(e.target.checked)} style={{ width:'16px', height:'16px', cursor:'pointer' }} />
            <label htmlFor="af-filter-issues" style={{ fontSize:'0.8rem', color:'var(--clr-text-heading)', cursor:'pointer', margin:0, fontWeight:'500' }}>Bugs Only</label>
          </div>
        </div>

        <div className="af-table-wrapper">
          <table className="af-table">
            <thead>
              <tr>
                <th>Participant</th><th>Event Scope</th><th>Ratings (E/S/O/R)</th>
                <th>Direct Comments & Suggestions</th><th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFeedbacks.length === 0 ? (
                <tr><td colSpan="5" style={{ padding:'3.5rem', textAlign:'center', color:'var(--clr-text-muted)' }}>
                  <MessageSquare size={32} style={{ opacity:0.3, marginBottom:'8px' }} />
                  <p>No feedback reports match the filter criteria.</p>
                </td></tr>
              ) : sortedFeedbacks.map(f => {
                const initials = f.user?.name?f.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?';
                return (
                  <tr key={f._id} onClick={() => setSelectedFeedback(f)}>
                    <td>
                      <div className="af-user-cell">
                        <div className="af-user-avatar">{initials}</div>
                        <div className="af-user-meta">
                          <span className="af-user-name">{f.user?.name||'Anonymous'}</span>
                          <span className="af-user-email">{f.user?.email||'No email'}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={`af-event-badge ${!f.event?'platform':''}`}>{f.event?.title||'Platform'}</span></td>
                    <td>
                      <div className="af-scores-grid">
                        {[['Evt',f.eventRating,'var(--clr-accent)'],['Web',f.siteRating,'var(--clr-accent-2)'],['Sat',f.overallSatisfaction,'var(--clr-danger)'],['Rec',f.recommendation,'var(--clr-success)']].map(([lbl,val,clr]) => (
                          <div key={lbl} className="af-score-item"><span className="af-score-dot" style={{ background:clr }} /><span>{lbl}: {val||0}</span></div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                        <div className="af-comment-preview">{f.eventComments||f.siteComments||f.suggestions||'No comment text'}</div>
                        {f.siteTechnicalIssues?.trim().length>0 && <span className="af-issue-badge"><Bug size={10} /> Bug Flagged</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:'4px' }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-icon-sm" title="Inspect" onClick={() => setSelectedFeedback(f)}><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon-sm" title="Delete" style={{ color:'var(--clr-danger)' }} onClick={() => handleDelete(f._id)} disabled={deleting===f._id}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ══ CREATE TEMPLATE MODAL ══ */}
      {showTemplateModal && (
        <div className="af-modal-overlay" onClick={closeTemplateModal}>
          <div className="af-modal af-template-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'1.15rem' }}>
                <LayoutTemplate size={20} /> Create Feedback Template
              </h3>
              <button className="af-modal-close" onClick={closeTemplateModal}><X size={18} /></button>
            </div>

            <div className="af-modal-body">
              {/* Meta */}
              <div className="af-template-builder-meta">
                <div className="af-field-group">
                  <label className="af-field-label">Template Title <span className="af-required-star">*</span></label>
                  <input type="text" className="af-field-input" placeholder="e.g., Post-Event Satisfaction Survey"
                    value={templateForm.title} onChange={e => setTemplateForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="af-field-group">
                  <label className="af-field-label">Description <span style={{ color:'var(--clr-text-subtle)', fontWeight:400 }}>(optional)</span></label>
                  <input type="text" className="af-field-input" placeholder="Briefly describe this template"
                    value={templateForm.description} onChange={e => setTemplateForm(p => ({ ...p, description: e.target.value }))} />
                </div>
              </div>

              {/* Fields builder */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                  <span style={{ fontSize:'0.8rem', fontWeight:'700', color:'var(--clr-text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    Questions ({templateForm.fields.length})
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={addField}><Plus size={13} style={{ marginRight:'4px' }} /> Add Question</button>
                </div>

                <div className="af-fields-list">
                  {templateForm.fields.map((field, idx) => (
                    <div key={field.id} className="af-field-row">
                      {/* Reorder */}
                      <div className="af-field-order-btns">
                        <button className="af-order-btn" onClick={() => moveField(idx,'up')} disabled={idx===0} title="Move up"><ChevronUp size={12} /></button>
                        <span className="af-field-num">{idx+1}</span>
                        <button className="af-order-btn" onClick={() => moveField(idx,'down')} disabled={idx===templateForm.fields.length-1} title="Move down"><ChevronDown size={12} /></button>
                      </div>

                      {/* Config */}
                      <div className="af-field-config">
                        <input type="text" className="af-field-input"
                          placeholder={`Question ${idx+1} — e.g., Rate the event experience`}
                          value={field.label} onChange={e => updateField(field.id,'label',e.target.value)} />

                        <div className="af-field-row-controls">
                          {/* Grouped type selector */}
                          <select
                            className="af-select af-field-type-select"
                            value={field.type}
                            onChange={e => updateField(field.id,'type',e.target.value)}
                          >
                            {FIELD_TYPE_GROUPS.map(grp => (
                              <optgroup key={grp.group} label={grp.group}>
                                {grp.types.map(ft => (
                                  <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>

                          {PLACEHOLDER_TYPES.has(field.type) && (
                            <input type="text" className="af-field-input af-field-placeholder-input"
                              placeholder="Placeholder (optional)" value={field.placeholder}
                              onChange={e => updateField(field.id,'placeholder',e.target.value)} />
                          )}

                          <label className="af-required-toggle">
                            <input type="checkbox" checked={field.required}
                              onChange={e => updateField(field.id,'required',e.target.checked)} />
                            <span>Required</span>
                          </label>
                        </div>

                        {/* Type-specific extra config */}
                        <FieldExtraConfig field={field} updateField={updateField} />
                      </div>

                      {/* Remove */}
                      <button className="af-field-remove-btn" onClick={() => removeField(field.id)}
                        disabled={templateForm.fields.length===1} title="Remove"><X size={14} /></button>
                    </div>
                  ))}
                </div>

                <button className="af-add-field-btn" onClick={addField}><Plus size={14} /> Add Another Question</button>
              </div>
            </div>

            <div className="af-modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={closeTemplateModal}>Cancel</button>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleTestFormFromBuilder}>
                  <FlaskConical size={14} style={{ marginRight:'4px' }} /> Test Form
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveTemplate} disabled={savingTemplate}>
                  {savingTemplate ? 'Saving…' : <><Check size={14} style={{ marginRight:'4px' }} /> Save Template</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TEMPLATE PREVIEW MODAL ══ */}
      {previewTemplate && (
        <div className="af-modal-overlay" onClick={() => setPreviewTemplate(null)}>
          <div className="af-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'1.15rem' }}>
                <Eye size={18} /> Template Preview
              </h3>
              <button className="af-modal-close" onClick={() => setPreviewTemplate(null)}><X size={18} /></button>
            </div>

            <div className="af-modal-body">
              <div className="af-preview-meta">
                <h4 className="af-preview-title">{previewTemplate.title}</h4>
                {previewTemplate.description && <p className="af-preview-desc">{previewTemplate.description}</p>}
                <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginTop:'0.5rem' }}>
                  <span className="af-template-badge"><Hash size={11} /> {previewTemplate.fields.length} questions</span>
                  <span className="af-template-badge">by {previewTemplate.createdBy?.name||'Admin'}</span>
                  <span className="af-template-badge">{new Date(previewTemplate.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
              </div>

              <div className="af-preview-fields">
                {previewTemplate.fields.map((field, idx) => (
                  <div key={field.id} className="af-preview-field">
                    <div className="af-preview-field-header">
                      <span className="af-preview-field-num">Q{idx+1}</span>
                      <span className="af-preview-field-label">
                        {field.label}{field.required && <span className="af-required-star"> *</span>}
                      </span>
                      <span className="af-preview-field-type">
                        {getFieldTypeIcon(field.type)}
                        {FIELD_TYPES.find(ft => ft.value===field.type)?.label}
                      </span>
                    </div>
                    <FieldPreview field={field} />
                  </div>
                ))}
              </div>
            </div>

            <div className="af-modal-footer">
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--clr-danger)' }}
                onClick={() => { handleDeleteTemplate(previewTemplate._id); setPreviewTemplate(null); }}
                disabled={deletingTemplate===previewTemplate._id}>
                <Trash2 size={14} style={{ marginRight:'4px' }} /> Delete Template
              </button>
              <div style={{ display:'flex', gap:'8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => { const tmpl = previewTemplate; setPreviewTemplate(null); openTestModal(tmpl); }}>
                  <FlaskConical size={14} style={{ marginRight:'4px' }} /> Test Feedback Form
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setPreviewTemplate(null)}>Close Preview</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TEST FEEDBACK MODAL ══ */}
      {testTemplate && (
        <div className="af-modal-overlay" onClick={() => setTestTemplate(null)}>
          <div className="af-modal af-template-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header" style={{ borderBottom:'1px solid var(--clr-border-subtle)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div className="af-template-icon"><FlaskConical size={20} /></div>
                <div>
                  <h3 style={{ fontSize:'1.1rem', margin:0, fontWeight:'700', color:'var(--clr-text-heading)', display:'flex', alignItems:'center', gap:'8px' }}>
                    Testing: {testTemplate.title}
                    <span className="af-template-badge" style={{ background:'var(--clr-accent-light)', color:'var(--clr-accent)', fontWeight:700 }}>🧪 TEST MODE</span>
                  </h3>
                  <p style={{ fontSize:'0.75rem', color:'var(--clr-text-muted)', margin:0 }}>Simulated user feedback submission form</p>
                </div>
              </div>
              <button className="af-modal-close" onClick={() => setTestTemplate(null)}><X size={18} /></button>
            </div>

            <div className="af-modal-body" style={{ maxHeight:'70vh', overflowY:'auto' }}>
              {isTestSubmitted ? (
                <div style={{ padding:'1rem 0', display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem' }}>
                  {/* Reference Image Success Card */}
                  <div className="ref-success-card animate-fade-in" style={{ width:'100%' }}>
                    <div className="ref-success-icon"><CheckCircle2 size={16} /></div>
                    <span className="ref-success-text">Thanks for the feedback!</span>
                  </div>

                  <button className="btn btn-ghost btn-sm" onClick={() => setShowPayload(!showPayload)}>
                    <Code2 size={14} style={{ marginRight:'4px' }} /> {showPayload ? 'Hide Payload' : 'Inspect Simulated Payload JSON'}
                  </button>

                  {showPayload && (
                    <pre style={{ textAlign:'left', width:'100%', background:'var(--clr-surface-3)', padding:'1rem', borderRadius:'var(--radius-md)', fontSize:'0.75rem', overflowX:'auto', border:'1px solid var(--clr-border-subtle)', color:'var(--clr-text-heading)' }}>
                      {JSON.stringify({
                        templateId: testTemplate._id,
                        templateTitle: testTemplate.title,
                        submittedAt: new Date().toISOString(),
                        answers: testAnswers
                      }, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <form onSubmit={handleTestSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                  {testTemplate.description && (
                    <div style={{ background:'var(--clr-accent-light)', padding:'10px 14px', borderRadius:'var(--radius-md)', border:'1px solid #c7ccf9', fontSize:'0.82rem', color:'var(--clr-accent)' }}>
                      ℹ️ {testTemplate.description}
                    </div>
                  )}

                  {testTemplate.fields.map((field, idx) => {
                    const error = testErrors[field.id];
                    const val = testAnswers[field.id];
                    const totalFields = testTemplate.fields.length;

                    return (
                      <div key={field.id} className={`ref-step-card ${error ? 'has-error' : ''}`}>
                        {/* Reference Step Progress Bar */}
                        <div className="ref-progress-row">
                          {Array.from({ length: totalFields }, (_, pIdx) => (
                            <div key={pIdx} className={`ref-progress-bar ${pIdx <= idx ? 'active' : ''}`} />
                          ))}
                        </div>

                        <label className="ref-question-title">
                          {field.label || `Question ${idx + 1}`} {field.required && <span className="af-required-star">*</span>}
                        </label>

                        {/* Interactive Form Controls */}
                        <div>
                          {/* RATING (1-5 Square Tiles with Green Star) */}
                          {field.type === 'rating' && (
                            <div className="ref-rating-container">
                              <div className="ref-rating-squares">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    type="button"
                                    key={star}
                                    className={`ref-rating-square ${val === star ? 'active' : ''}`}
                                    onClick={() => setTestAnswers({ ...testAnswers, [field.id]: star })}
                                  >
                                    {star}
                                  </button>
                                ))}
                              </div>
                              <div className="ref-star-indicator">
                                <Star size={16} fill="#10b981" stroke="#10b981" />
                                <span>{val ? `${val} Stars` : 'Stars'}</span>
                              </div>
                            </div>
                          )}

                          {/* RATING SCALE */}
                          {field.type === 'rating_scale' && (
                            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                              {Array.from({ length: (field.max || 10) - (field.min || 1) + 1 }, (_, i) => (field.min || 1) + i).map(n => (
                                <button type="button" key={n} style={{ width:'32px', height:'32px', borderRadius:'6px', border: val === n ? '2px solid var(--clr-accent)' : '1.5px solid var(--clr-border)', background: val === n ? 'var(--clr-accent-light)' : 'var(--clr-surface)', color: val === n ? 'var(--clr-accent)' : 'var(--clr-text-heading)', fontWeight: val === n ? '700' : '500', cursor:'pointer' }} onClick={() => setTestAnswers({ ...testAnswers, [field.id]: n })}>
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* EMOJI RATING */}
                          {field.type === 'emoji_rating' && (
                            <div style={{ display:'flex', gap:'16px', fontSize:'1.75rem' }}>
                              {['😞', '😐', '😊'].map((emoji, i) => (
                                <button type="button" key={i} style={{ background: val === emoji ? 'var(--clr-accent-light)' : 'none', border: val === emoji ? '2px solid var(--clr-accent)' : 'none', borderRadius:'50%', cursor:'pointer', padding:'4px' }} onClick={() => setTestAnswers({ ...testAnswers, [field.id]: emoji })}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* SLIDER */}
                          {field.type === 'slider' && (
                            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                              <input type="range" min={field.min ?? 0} max={field.max ?? 10} step={field.step ?? 1} value={val ?? (field.min ?? 0)} onChange={e => setTestAnswers({ ...testAnswers, [field.id]: Number(e.target.value) })} style={{ width:'100%', accentColor:'var(--clr-accent)' }} />
                              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--clr-text-muted)' }}>
                                <span>Min: {field.min ?? 0}</span>
                                <span style={{ fontWeight:'700', color:'var(--clr-accent)' }}>Selected: {val ?? (field.min ?? 0)}</span>
                                <span>Max: {field.max ?? 10}</span>
                              </div>
                            </div>
                          )}

                          {/* NPS */}
                          {field.type === 'nps' && (
                            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                              {Array.from({ length: 11 }, (_, i) => i).map(n => (
                                <button type="button" key={n} style={{ width:'30px', height:'30px', borderRadius:'50%', border: val === n ? '2px solid var(--clr-accent)' : '1.5px solid var(--clr-border)', background: val === n ? 'var(--clr-accent-light)' : 'var(--clr-surface)', color: val === n ? 'var(--clr-accent)' : 'var(--clr-text-heading)', fontWeight:'600', cursor:'pointer' }} onClick={() => setTestAnswers({ ...testAnswers, [field.id]: n })}>
                                  {n}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* YES / NO */}
                          {field.type === 'yes_no' && (
                            <div style={{ display:'flex', gap:'10px' }}>
                              {['Yes', 'No'].map(opt => (
                                <button type="button" key={opt} style={{ padding:'6px 20px', borderRadius:'999px', border: val === opt ? '2px solid var(--clr-accent)' : '1.5px solid var(--clr-border)', background: val === opt ? 'var(--clr-accent-light)' : 'var(--clr-surface)', color: val === opt ? 'var(--clr-accent)' : 'var(--clr-text-heading)', fontWeight: val === opt ? '700' : '500', cursor:'pointer' }} onClick={() => setTestAnswers({ ...testAnswers, [field.id]: opt })}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* DROPDOWN */}
                          {field.type === 'dropdown' && (
                            <Select className="af-select" value={val || ''} onChange={e => setTestAnswers({ ...testAnswers, [field.id]: e.target.value })}>
                              <option value="">-- Select Option --</option>
                              {(field.options || ['Option 1', 'Option 2']).map((o, i) => (
                                <option key={i} value={o}>{o}</option>
                              ))}
                            </Select>
                          )}

                          {/* RADIO & CHECKBOX */}
                          {(field.type === 'radio' || field.type === 'multiple_choice' || field.type === 'checkbox') && (
                            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                              {(field.options || ['Option 1', 'Option 2']).map((opt, i) => {
                                const isChecked = field.type === 'radio' ? val === opt : (Array.isArray(val) && val.includes(opt));
                                return (
                                  <label key={i} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'0.85rem', color:'var(--clr-text-heading)' }}>
                                    <input
                                      type={field.type === 'radio' ? 'radio' : 'checkbox'}
                                      name={field.id}
                                      checked={!!isChecked}
                                      onChange={e => {
                                        if (field.type === 'radio') setTestAnswers({ ...testAnswers, [field.id]: opt });
                                        else {
                                          const currentArr = Array.isArray(val) ? val : [];
                                          setTestAnswers({
                                            ...testAnswers,
                                            [field.id]: e.target.checked ? [...currentArr, opt] : currentArr.filter(x => x !== opt)
                                          });
                                        }
                                      }}
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* TEXT INPUTS */}
                          {['text', 'email', 'phone', 'number', 'url'].includes(field.type) && (
                            <input
                              type={field.type === 'phone' ? 'tel' : field.type}
                              className="af-field-input"
                              placeholder={field.placeholder || `Enter ${field.label}...`}
                              value={val || ''}
                              onChange={e => setTestAnswers({ ...testAnswers, [field.id]: e.target.value })}
                            />
                          )}

                          {/* TEXTAREA */}
                          {field.type === 'textarea' && (
                            <textarea
                              className="af-field-input"
                              rows={3}
                              placeholder={field.placeholder || `Write response for ${field.label}...`}
                              value={val || ''}
                              onChange={e => setTestAnswers({ ...testAnswers, [field.id]: e.target.value })}
                            />
                          )}

                          {/* DATE & TIME */}
                          {field.type === 'date' && (
                            <input type="date" className="af-field-input" value={val || ''} onChange={e => setTestAnswers({ ...testAnswers, [field.id]: e.target.value })} />
                          )}
                          {field.type === 'time' && (
                            <input type="time" className="af-field-input" value={val || ''} onChange={e => setTestAnswers({ ...testAnswers, [field.id]: e.target.value })} />
                          )}

                          {/* FILE UPLOAD */}
                          {field.type === 'file_upload' && (
                            <div style={{ padding:'14px', border:'1.5px dashed var(--clr-border)', borderRadius:'var(--radius-md)', textAlign:'center', cursor:'pointer', color:'var(--clr-text-muted)', fontSize:'0.82rem' }} onClick={() => setTestAnswers({ ...testAnswers, [field.id]: 'sample_document.png' })}>
                              <Upload size={18} style={{ color:'var(--clr-accent)', marginBottom:'4px' }} />
                              <div>{val ? `Selected: ${val}` : 'Click to simulate file attachment'}</div>
                            </div>
                          )}

                          {/* LIKERT & MATRIX */}
                          {field.type === 'likert' && (
                            <div style={{ overflowX:'auto' }}>
                              <table style={{ borderCollapse:'collapse', width:'100%', fontSize:'0.78rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding:'4px 6px', textAlign:'left' }}>Scale</th>
                                    {(field.scaleLabels || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']).map((lbl, i) => (
                                      <th key={i} style={{ padding:'4px', textAlign:'center' }}>{lbl}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td style={{ padding:'4px 6px' }}>Rating</td>
                                    {(field.scaleLabels || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']).map((lbl, i) => (
                                      <td key={i} style={{ textAlign:'center' }}>
                                        <input type="radio" name={field.id} checked={val === lbl} onChange={() => setTestAnswers({ ...testAnswers, [field.id]: lbl })} />
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {field.type === 'matrix' && (
                            <div style={{ overflowX:'auto' }}>
                              <table style={{ borderCollapse:'collapse', width:'100%', fontSize:'0.78rem' }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding:'4px 6px', textAlign:'left' }}>Aspect</th>
                                    {(field.columns || ['Poor', 'Average', 'Good', 'Excellent']).map((col, i) => (
                                      <th key={i} style={{ padding:'4px', textAlign:'center' }}>{col}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(field.rows || ['Aspect 1']).map((row, rIdx) => (
                                    <tr key={rIdx}>
                                      <td style={{ padding:'4px 6px' }}>{row}</td>
                                      {(field.columns || ['Poor', 'Average', 'Good', 'Excellent']).map((col, cIdx) => {
                                        const currentMatrix = val || {};
                                        return (
                                          <td key={cIdx} style={{ textAlign:'center' }}>
                                            <input
                                              type="radio"
                                              name={`${field.id}_row_${rIdx}`}
                                              checked={currentMatrix[row] === col}
                                              onChange={() => setTestAnswers({
                                                ...testAnswers,
                                                [field.id]: { ...currentMatrix, [row]: col }
                                              })}
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {error && <div style={{ color:'var(--clr-danger)', fontSize:'0.75rem', fontWeight:'600', paddingLeft:'2.5rem', marginTop:'4px' }}>⚠️ {error}</div>}
                      </div>
                    );
                  })}
                </form>
              )}
            </div>

            <div className="af-modal-footer">
              {isTestSubmitted ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setIsTestSubmitted(false)}>
                    <RotateCcw size={14} style={{ marginRight:'4px' }} /> Test Again
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => setTestTemplate(null)}>Done</button>
                </>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => setTestTemplate(null)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleTestSubmit}>
                    <Send size={14} style={{ marginRight:'4px' }} /> Submit Test Feedback
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ FEEDBACK DETAIL MODAL ══ */}
      {selectedFeedback && (
        <div className="af-modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="af-modal glass" onClick={e => e.stopPropagation()}>
            <div className="af-modal-header">
              <h3 style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'1.2rem' }}>
                <Sparkles size={20} /> Feedback Details
              </h3>
              <button className="af-modal-close" onClick={() => setSelectedFeedback(null)}><X size={18} /></button>
            </div>
            <div className="af-modal-body">
              <div className="af-detail-header-panel">
                <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg, var(--clr-accent) 0%, var(--clr-accent-2) 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', fontWeight:'bold', color:'#fff' }}>
                  {selectedFeedback.user?.name?selectedFeedback.user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase():'?'}
                </div>
                <div>
                  <h4 style={{ fontSize:'1.05rem', color:'var(--clr-text-heading)', margin:0, fontWeight:'700' }}>{selectedFeedback.user?.name||'Anonymous'}</h4>
                  <p style={{ fontSize:'0.78rem', color:'var(--clr-text-muted)', margin:'2px 0 0' }}>
                    {selectedFeedback.user?.email||'Anonymous Email'} • {selectedFeedback.user?.department||'Unspecified Dept'} • Year {selectedFeedback.user?.year||'N/A'}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'var(--clr-text-muted)' }}>Event Context:</span>
                <span className={`af-event-badge ${!selectedFeedback.event?'platform':''}`}>{selectedFeedback.event?.title||'Platform Feedback'}</span>
              </div>
              <div className="af-ratings-summary-grid">
                {[['Event rating',selectedFeedback.eventRating],['Website Rating',selectedFeedback.siteRating],['Overall Satisfaction',selectedFeedback.overallSatisfaction],['Recommendation Score',selectedFeedback.recommendation]].map(([lbl,val]) => (
                  <div key={lbl} className="af-rating-box">
                    <span className="af-rating-title">{lbl}</span>
                    <div className="af-rating-stars">{renderStars(val||0)}</div>
                  </div>
                ))}
              </div>
              <div className="af-comments-container">
                {[
                  [selectedFeedback.eventComments, 'Event Comments', null, '"'],
                  [selectedFeedback.siteComments, 'Website Comments', null, '"'],
                  [selectedFeedback.siteTechnicalIssues?.trim().length>0 && selectedFeedback.siteTechnicalIssues, 'Reported Technical Bugs / Issues', 'var(--clr-danger)', '⚠️ "', 'issue'],
                  [selectedFeedback.suggestions, 'Suggestions & Recommendations', '#d97706', '💡 "', 'suggestion'],
                  [selectedFeedback.preferredNextEvent, 'Preferred Next Event / Vision', null, '🎯 "'],
                ].filter(([v]) => v).map(([v, lbl, clr, prefix, cls]) => (
                  <div key={lbl} className="af-comment-section">
                    <span className="af-comment-label" style={clr?{color:clr}:{}}>{lbl}</span>
                    <blockquote className={`af-quote-block${cls?' '+cls:''}`}>{prefix||'"'}{v}"</blockquote>
                  </div>
                ))}
              </div>
            </div>
            <div className="af-modal-footer">
              <button className="btn btn-ghost btn-sm" style={{ color:'var(--clr-danger)' }} onClick={() => handleDelete(selectedFeedback._id)} disabled={deleting===selectedFeedback._id}>
                <Trash2 size={14} style={{ marginRight:'4px' }} /> Delete Submission
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setSelectedFeedback(null)}>Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Map Template to Event Modal ── */}
      {mapModalTemplate && (
        <div className="af-modal-overlay animate-fade-in" style={{ zIndex: 1050 }}>
          <div className="af-modal glass-strong animate-scale-in" style={{ maxWidth: '520px', borderRadius: '1.2rem', padding: '1.75rem', background: '#090d16', border: '1px solid rgba(129, 140, 248, 0.25)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div className="af-modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#818cf8" /> Map Template to Event
              </h2>
              <button className="btn btn-ghost btn-icon-sm" style={{ color: 'rgba(255,255,255,0.6)' }} onClick={() => setMapModalTemplate(null)}><X size={16} /></button>
            </div>

            <div className="af-modal-body" style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(129, 140, 248, 0.2)', marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#c7d2fe' }}>
                  Template: <strong style={{ color: '#fff' }}>"{mapModalTemplate.title}"</strong> ({mapModalTemplate.fields?.length || 0} questions)
                </p>
                <small style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  When registered participants give feedback for the chosen event, they will be presented with this custom form.
                </small>
              </div>

              <div className="af-form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="af-form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>
                  Select Event to Map:
                </label>
                <Select 
                  className="af-form-select"
                  value={selectedMapEventId}
                  onChange={e => setSelectedMapEventId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
                >
                  <option value="" style={{ background: '#0a0a0a' }}>-- Choose an Admin Event --</option>
                  {adminEvents.map(ev => (
                    <option key={ev._id} value={ev._id} style={{ background: '#0a0a0a' }}>
                      {ev.title} {ev.feedbackTemplate === mapModalTemplate._id ? ' (Currently Mapped ✅)' : ev.feedbackTemplate ? ' (Other Template Mapped)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="af-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setMapModalTemplate(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" disabled={mappingLoading} onClick={handleMapToEventSubmit} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none', fontWeight: '700', padding: '0.6rem 1.25rem' }}>
                {mappingLoading ? 'Mapping...' : 'Confirm Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
