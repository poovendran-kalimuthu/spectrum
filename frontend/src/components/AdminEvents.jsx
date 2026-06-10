import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { API_URL } from '../config';
import './AdminEvents.css';
import './EventCard.css';
import Select from './ui/Select';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Plus,
  X,
  FileText,
  MessageSquare,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  ClipboardList,
  Info,
  Rocket,
  Compass,
  Clock,
  Award,
  Key,
  Send,
  Sliders,
  SpellCheck,
  Lock,
  Unlock,
  Globe,
  EyeOff,
  Trash2,
  ExternalLink,
  UserPlus,
  UserMinus
} from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
  endDate: '',
  location: '',
  teamSizeLimit: 4,
  rounds: 1,
  maxShortlisted: 0,
  numberOfWinners: 3,
  session: 'none',
  imageUrl: '',
  isPublished: false,
  isRegistrationOpen: true,
  isTeamChangeAllowed: true,
  attendanceMode: 'student_scan',
  eventType: 'micro',
  parentEvent: null,
  category: 'None',
  macroCountLimit: 5,
  resourcePerson: '',
  contactDetails: '',
  noOfDays: 1,
  dates: [],
  coordinators: []
};

const WIZARD_STEPS = [
  { name: 'General Info', desc: 'Define your event\'s identity', sub: 'Add essential details like title, description, and hero image.' },
  { name: 'Schedule & Venue', desc: 'Set schedule & location', sub: 'Provide the date, location, and session slot for the event.' },
  { name: 'Team Limits', desc: 'Configure team limits', sub: 'Set team size constraints and shortlisting limits.' },
  { name: 'Evaluation Setup', desc: 'Define evaluation settings', sub: 'Configure the number of rounds and default winners.' },
  { name: 'Event Coordinators', desc: 'Assign event coordinators', sub: 'Add the organizers and volunteers managing this event.' },
  { name: 'Event Policies', desc: 'Establish event policies', sub: 'Specify attendance scanning modes and teammate edit rights.' },
  { name: 'Overview & Launch', desc: 'Review & Launch', sub: 'Inspect all configurations before publishing the event.' }
];

const MACRO_WIZARD_STEPS = [
  { name: 'General Info', desc: 'Define your Macro event\'s identity', sub: 'Add the title, maximum sub-events limit, and description.' },
  { name: 'Overview & Launch', desc: 'Review & Launch', sub: 'Inspect your Macro event configurations before publishing.' }
];

// --- Safe Date Utilities ---
const getLocalDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const updateConsecutiveDates = (start, end, currentFormData) => {
  if (!start) return { ...currentFormData, date: '', noOfDays: 1, dates: [], endDate: end || '' };
  
  const formattedStart = start;
  let formattedEnd = end || start;
  
  if (formattedEnd && new Date(formattedEnd) < new Date(formattedStart)) {
    formattedEnd = formattedStart;
  }
  
  const dates = [];
  const sDate = new Date(formattedStart + 'T00:00:00');
  const eDate = new Date(formattedEnd + 'T00:00:00');
  
  let tempDate = new Date(sDate);
  while (tempDate <= eDate) {
    dates.push(tempDate.toISOString().split('T')[0]);
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  return {
    ...currentFormData,
    date: formattedStart,
    endDate: formattedEnd,
    noOfDays: dates.length,
    dates: dates
  };
};

const getUTCDateParts = (dateInput) => {
  if (!dateInput) return { day: '', month: '', year: '', formatted: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { day: '', month: '', year: '', formatted: '' };

  const day = d.getUTCDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const formatted = `${month} ${day}, ${year}`;

  return { day, month, year, formatted };
};

// --- AI Event Description Generator ---
const generateAIDescription = (title, prompt = '') => {
  if (!title || title.trim() === '') return '';
  const titleLower = title.toLowerCase();

  const customIntro = prompt
    ? `Specifically, this session is focused on: "${prompt}".`
    : `This high-octane technical challenge is designed to push your problem-solving abilities to the absolute limit.`;

  if (titleLower.includes('code') || titleLower.includes('program') || titleLower.includes('hack') || titleLower.includes('algo') || titleLower.includes('dev') || titleLower.includes('web') || titleLower.includes('app')) {
    return `Are you ready to test your engineering prowess and coding skills? Join us for the "${title}"! 

${customIntro}

Participants will face a series of algorithmic puzzles, real-world development tasks, and speed-coding challenges. Whether you are a web wizard, a database guru, or an optimization master, this event has something for you.

Key Highlights:
- Live coding rounds featuring algorithmic challenges and system design.
- Exciting tracks for Web and Mobile application development.
- Mentorship and feedback from industry leaders and expert judges.
- Showcase your creativity and win prestigious recognitions!

Bring your laptop, charge your devices, and prepare to code your way to the top!`;
  }

  if (titleLower.includes('game') || titleLower.includes('play') || titleLower.includes('sport') || titleLower.includes('combat') || titleLower.includes('console') || titleLower.includes('lan') || titleLower.includes('fifa') || titleLower.includes('valorant') || titleLower.includes('pubg')) {
    return `Welcome to the arena! Prepare your gears and team up for the "${title}"!

${customIntro}

This competitive gaming tournament brings together the finest players to battle it out for ultimate glory. With multiple stages, intense elimination rounds, and live streams, it's time to showcase your tactical skills, reflexes, and team synergy.

Highlights:
- Competitive tournament brackets under standardized fair-play rules.
- Dedicated gaming setups and lag-free infrastructure.
- Interactive live-streams with expert commentary.
- Grand final match determining the undisputed champions.

Register now and secure your spot in the championship bracket. May the best squad win!`;
  }

  if (titleLower.includes('paper') || titleLower.includes('quiz') || titleLower.includes('present') || titleLower.includes('talk') || titleLower.includes('seminar') || titleLower.includes('lecture') || titleLower.includes('confe')) {
    return `Expand your horizons and showcase your knowledge at the "${title}"!

${customIntro}

This event serves as a platform for curious minds, researchers, and technical enthusiasts to exchange ideas, present cutting-edge research, and engage in intellectually stimulating sessions. Showcase your research work or test your trivia knowledge in front of a panel of distinguished academicians and industry veterans.

Tracks & Focus:
- Technical paper and project presentations on emerging research trends.
- Quick-fire quiz rounds covering engineering, history, technology, and general trivia.
- Interactive Q&A and networking opportunities.

Submit your abstracts early or register to participate. Let the pursuit of knowledge begin!`;
  }

  if (titleLower.includes('robot') || titleLower.includes('circ') || titleLower.includes('embedded') || titleLower.includes('hard') || titleLower.includes('iot') || titleLower.includes('sensor')) {
    return `Dive into the world of automation, hardware design, and robotics at the "${title}"!

${customIntro}

This hands-on challenge is geared towards hardware builders, circuit designers, and embedded system engineers. Put your soldering irons and microcontrollers to work, troubleshoot complex logic circuits, or program autonomous robots to navigate custom-designed arenas.

What to Expect:
- Dynamic robot run tracks, maze solvers, and race events.
- Circuit design and hardware debugging challenges.
- Access to testing equipment and lab assistants.
- Panels assessing design efficiency and operational stability.

Assemble your team, bring your components, and build the future today!`;
  }

  if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux') || titleLower.includes('art') || titleLower.includes('poster') || titleLower.includes('creative') || titleLower.includes('cad') || titleLower.includes('photo')) {
    return `Unleash your creativity and design thinking at the "${title}"!

${customIntro}

This design sprint challenges you to build visually stunning, user-centered digital interfaces, posters, or creative layouts. Focus on user empathy, visual hierarchy, branding, and interactive prototypes to deliver solutions that solve real problems.

Key Focus Areas:
- Designing intuitive, responsive user experiences (UX) and interfaces (UI).
- Creative brainstorming, prototyping, and wireframing.
- Pitching design concepts to industry professionals.
- Working under time constraints to deliver polished mockups.

Bring your creative tools, design libraries, and register today to transform ideas into interfaces!`;
  }

  return `Welcome to the "${title}"!

${customIntro}

This flagship event, organized by the ECE Association, is designed to bring together talented minds to explore new ideas, solve exciting challenges, and build professional connections. Through structured rounds, participants will collaborate, innovate, and showcase their talents.

Why You Should Participate:
- Hands-on learning experience and technical exposure.
- Opportunity to work with peers and build networks.
- Certificates of participation and attractive rewards for top performers.
- Constructive feedback from experienced evaluators.

Don't miss out on this opportunity to learn, create, and lead. Register today!`;
};

// --- AI Grammar & Typos Polisher ---
const checkAndFixGrammar = (text) => {
  if (!text || text.trim() === '') return '';

  // 1. Common spelling & typo corrections
  let polished = text
    .replace(/\bteh\b/gi, 'the')
    .replace(/\bgrammer\b/gi, 'grammar')
    .replace(/\bswich\b/gi, 'switch')
    .replace(/\brecieved\b/gi, 'received')
    .replace(/\baccomodate\b/gi, 'accommodate')
    .replace(/\bseperate\b/gi, 'separate')
    .replace(/\buntill\b/gi, 'until')
    .replace(/\bdevelopement\b/gi, 'development')
    .replace(/\bprograming\b/gi, 'programming')
    .replace(/\bchallange\b/gi, 'challenge')
    .replace(/\bchallanges\b/gi, 'challenges')
    .replace(/\b([a-z])i([a-z])\b/gi, 'I')
    .replace(/\bi\b/g, 'I');

  // 2. Clean up duplicate/multiple spaces
  polished = polished.replace(/[ \t]+/g, ' ');

  // 3. Clean up spacing around punctuation marks
  polished = polished.replace(/\s+([,\.\!\?])/g, '$1');

  // 4. Capitalize first letter of sentences
  polished = polished.replace(/(^\s*[a-z]|[\.\!\?]\s+[a-z])/g, (match) => match.toUpperCase());

  return polished.trim();
};

// --- Custom Calendar DatePicker ---
const DatePicker = ({ value, onChange, placeholder = "Select Event Date" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      }
    }
    return new Date();
  });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formatted = `${year}-${month}-${dayStr}`;
    onChange({ target: { name: 'date', value: formatted } });
    setIsOpen(false);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="custom-datepicker" ref={containerRef}>
      <div
        className="datepicker-input-wrapper"
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
      >
        <input
          type="text"
          readOnly
          required
          placeholder={placeholder}
          value={formatDateDisplay(value)}
          className="form-input datepicker-display-input"
          style={{ width: '100%', cursor: 'pointer', paddingRight: '40px' }}
        />
        <CalendarIcon
          size={16}
          style={{ position: 'absolute', right: '14px', color: 'var(--clr-text-muted)', pointerEvents: 'none' }}
        />
      </div>

      {isOpen && (
        <div className="datepicker-popover glass-strong">
          <div className="datepicker-header">
            <button type="button" onClick={handlePrevMonth} className="btn btn-ghost btn-xs" style={{ padding: '4px', minHeight: 'unset' }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: '600', color: 'var(--clr-text-heading)', fontSize: '0.85rem' }}>
              {monthNames[month]} {year}
            </span>
            <button type="button" onClick={handleNextMonth} className="btn btn-ghost btn-xs" style={{ padding: '4px', minHeight: 'unset' }}>
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="datepicker-weekdays">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day}>{day}</div>)}
          </div>

          <div className="datepicker-days">
            {days.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;

              const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

              const today = new Date();
              const isToday = today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`datepicker-day-btn ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Premium Toast Notification Component ---
const PremiumToast = ({ toast, onClose }) => {
  if (!toast || !toast.text) return null;

  const Icon = toast.type === 'error' ? XCircle : CheckCircle2;

  return (
    <div className="ae-toast-container">
      <div className={`ae-premium-toast ${toast.type || 'success'}`}>
        <div className={`ae-premium-toast-icon ${toast.type || 'success'}`}>
          <Icon size={18} />
        </div>
        <div className="ae-premium-toast-content">
          {toast.text}
        </div>
        <button className="ae-premium-toast-close" onClick={onClose} type="button">
          <X size={14} />
        </button>
        <div className="ae-premium-toast-progress" />
      </div>
    </div>
  );
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { eventId, type, message, actionFn }

  const lastCheckedText = useRef('');
  const [checkingGrammar, setCheckingGrammar] = useState(false);

  const handleAutoCheckGrammar = async () => {
    if (!formData.description || formData.description.trim() === '') return;
    if (formData.description === lastCheckedText.current) return;

    setCheckingGrammar(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/admin/ai/check-grammar`,
        { text: formData.description },
        { withCredentials: true }
      );
      if (res.data.success && res.data.text && res.data.text !== formData.description) {
        setFormData(prev => ({ ...prev, description: res.data.text }));
        lastCheckedText.current = res.data.text;
        showToast('Grammar automatically corrected by Gemini!', 'success');
      }
    } catch (err) {
      console.warn("Auto grammar check failed:", err);
    } finally {
      setCheckingGrammar(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchEvents();
  }, []);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/events`, { withCredentials: true });
      if (res.data.success) setEvents(res.data.events);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access Denied. Admin privileges required.' : 'Failed to load events.');
    } finally { setLoading(false); }
  };

  const handleTogglePublish = (e, ev) => {
    e.stopPropagation();
    const nextState = ev.isPublished ? 'unpublish' : 'publish';
    setConfirmAction({
      eventId: ev._id,
      type: 'publish',
      message: `Publish Status`,
      subMessage: `Are you sure you want to ${nextState} this event?`,
      actionFn: async () => {
        try {
          const res = await axios.put(`${API_URL}/api/admin/events/${ev._id}`, {
            ...ev,
            isPublished: !ev.isPublished
          }, { withCredentials: true });
          if (res.data.success) {
            setEvents(prev => prev.map(item => item._id === ev._id ? res.data.event : item));
            showToast(`Event successfully ${!ev.isPublished ? 'published' : 'unpublished'}!`, 'success');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to update event status', 'danger');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleToggleRegistration = (e, ev) => {
    e.stopPropagation();
    const nextState = ev.isRegistrationOpen !== false ? 'close' : 'open';
    setConfirmAction({
      eventId: ev._id,
      type: 'registration',
      message: `Registration Portal`,
      subMessage: `Are you sure you want to ${nextState} registration?`,
      actionFn: async () => {
        try {
          const res = await axios.put(`${API_URL}/api/admin/events/${ev._id}`, {
            ...ev,
            isRegistrationOpen: !ev.isRegistrationOpen
          }, { withCredentials: true });
          if (res.data.success) {
            setEvents(prev => prev.map(item => item._id === ev._id ? res.data.event : item));
            showToast(`Registration successfully ${!ev.isRegistrationOpen ? 'opened' : 'closed'}!`, 'success');
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to update registration status', 'danger');
        }
        setConfirmAction(null);
      }
    });
  };

  const handleDeleteEvent = (e, ev) => {
    e.stopPropagation();
    setConfirmAction({
      eventId: ev._id,
      type: 'delete',
      message: `Delete Event`,
      subMessage: `This action is irreversible. Proceed?`,
      actionFn: async () => {
        try {
          const res = await axios.delete(`${API_URL}/api/admin/events/${ev._id}`, { withCredentials: true });
          if (res.data.success) {
            setEvents(prev => prev.filter(item => item._id !== ev._id));
            showToast('Event successfully deleted!', 'success');
            if (activeMenuId === ev._id) setActiveMenuId(null);
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to delete event', 'danger');
        }
        setConfirmAction(null);
      }
    });
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      if (res.data.success) setUser(res.data.user);
    } catch (err) { console.error("Error fetching user:", err); }
  };

  const handleInputChange = e => {
    let { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (type === 'number') val = parseInt(value) || 0;
    setFormData(f => ({ ...f, [name]: val }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = height * (MAX_WIDTH / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64Str = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(f => ({ ...f, imageUrl: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    const isMacro = formData.eventType === 'macro';
    const totalSteps = isMacro ? 2 : 7;

    if (step === 1) {
      if (!formData.title || formData.title.trim() === '') {
        showToast('Event title is required.', 'error');
        return;
      }
      if (isMacro) {
        if (!formData.noOfDays || formData.noOfDays <= 0) {
          showToast('Number of Days must be greater than 0.', 'error');
          return;
        }
        if (!formData.dates || formData.dates.length !== formData.noOfDays || formData.dates.some(d => !d)) {
          showToast('Please select dates for all days.', 'error');
          return;
        }
        if (!formData.macroCountLimit || formData.macroCountLimit <= 0) {
          showToast('Macro event count limit must be greater than 0.', 'error');
          return;
        }
      }
    }
    if (!isMacro && step === 2) {
      if (!formData.date || formData.date === '') {
        showToast('Event date is required.', 'error');
        return;
      }
      if (!formData.location || formData.location.trim() === '') {
        showToast('Event location is required.', 'error');
        return;
      }
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      submitWizard();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitWizard = async () => {
    setSubmitting(true);
    try {
      const defaultRoundConfig = Array.from({ length: formData.rounds }, (_, idx) => ({
        roundNumber: idx + 1,
        name: `Round ${idx + 1}`,
        evaluationType: 'admin',
        criteria: [{ name: 'Overall', maxScore: 10 }],
        maxAdvance: 0
      }));

      const submitData = {
        ...formData,
        roundConfig: defaultRoundConfig
      };

      const res = await axios.post(`${API_URL}/api/admin/events`, submitData, { withCredentials: true });
      showToast('Event created successfully!');
      setShowCreateForm(false);
      const createdEvent = res.data?.event;
      setFormData(EMPTY_FORM);
      setStep(1);
      
      if (createdEvent && createdEvent.eventType === 'macro') {
        navigate(`/admin/events/${createdEvent.slug || createdEvent._id}`);
      } else {
        fetchEvents();
      }
    } catch (err) {
      console.error('Error creating event:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Error creating event.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  if (error) return (
    <div className="ae-error animate-fade-in">
      <div className="ae-error-icon" style={{ display: 'flex', justifyContent: 'center' }}>
        <XCircle size={48} color="var(--clr-danger)" />
      </div>
      <h2>{error}</h2>
      <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>
    </div>
  );

  return (
    <div className="ae-wrapper">
      <PremiumToast toast={toast} onClose={() => setToast({ text: '', type: '' })} />

      <header className="ae-header glass animate-fade-in">
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={14} />
            Dashboard
          </button>
          <div>
            <h1 className="ae-title">Event Administration</h1>
            <p className="ae-subtitle">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        {user?.role === 'superadmin' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${showCreateForm ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => {
                if (showCreateForm) {
                  setShowCreateForm(false);
                  setFormData(EMPTY_FORM);
                  setStep(1);
                } else {
                  setShowEventTypeModal(true);
                }
              }}
            >
              {showCreateForm ? (
                <><X size={14} /> Cancel</>
              ) : (
                <><Plus size={14} /> New Event</>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/users')}
            >
              <Users size={14} style={{ marginRight: '6px' }} />
              Users
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/audit')}
            >
              <FileText size={14} style={{ marginRight: '6px' }} />
              Audit Logs
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/admin/feedback')}
            >
              <MessageSquare size={14} style={{ marginRight: '6px' }} />
              Feedbacks
            </button>
          </div>
        )}
      </header>

      {/* Flagship Helix Header */}
      <div className="ae-hero animate-fade-in">
        <span className="ae-hero-badge">
          <Zap size={10} style={{ fill: 'currentColor' }} />
          ADMINISTRATION POST
        </span>
        <h1 className="ae-hero-title">
          <span className="text-white">HELIX</span><span className="text-accent">26</span>
        </h1>
        <p className="ae-hero-subtitle">Push the boundaries of innovation. Join us for a high-intensity technical showcase from the ECE Association.</p>
      </div>

      {/* Event Type Selection Dialogue Box */}
      {showEventTypeModal && (
        <div className="ae-wizard-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            width: '95%',
            maxWidth: '580px',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{ width: '100%' }}>
              <button
                type="button"
                onClick={() => setShowEventTypeModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#475569',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#0f172a';
                  e.currentTarget.style.background = '#e2e8f0';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#475569';
                  e.currentTarget.style.background = '#f1f5f9';
                }}
              >
                <X size={16} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--clr-text-heading)', marginBottom: '8px' }}>
                  Select Event Type
                </h2>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem' }}>
                  Choose the category that matches your event structure
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  {
                    id: 'macro',
                    title: 'Macro Event',
                    desc: 'A flagship festival or campaign (e.g., HELIX) containing multiple standalone contests or micro events.',
                    badge: 'Group Container',
                    color: '#6366f1',
                    icon: Layers
                  },
                  {
                    id: 'micro',
                    title: 'Micro Event',
                    desc: 'A standalone technical contest, workshop, seminar, or code sprint with scoring criteria and winner selection.',
                    badge: 'Individual Event',
                    color: '#10b981',
                    icon: Rocket
                  },
                  {
                    id: 'internal',
                    title: 'Internal Event',
                    desc: 'A departmental seminar, guest lecture, or meeting restricted to internal students and college members.',
                    badge: 'Restricted Access',
                    color: '#f59e0b',
                    icon: ClipboardList
                  }
                ].map(item => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setFormData({
                          ...EMPTY_FORM,
                          eventType: item.id,
                        });
                        setShowEventTypeModal(false);
                        setShowCreateForm(true);
                        setStep(1);
                      }}
                      style={{
                        border: '1.5px solid var(--clr-border)',
                        borderRadius: '12px',
                        padding: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center',
                        background: 'white',
                      }}
                      className="ae-type-card"
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = item.color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--clr-border)';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: `${item.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: item.color,
                        flexShrink: 0
                      }}>
                        <IconComponent size={24} />
                      </div>
                      <div style={{ flexGrow: 1, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--clr-text-heading)', fontSize: '1rem' }}>{item.title}</span>
                          <span style={{ fontSize: '0.675rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', backgroundColor: `${item.color}15`, color: item.color }}>{item.badge}</span>
                        </div>
                        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: '1.4' }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Overlay Form */}
      {showCreateForm && (
        <div className="ae-wizard-overlay animate-fade-in">
          <div className="ae-wizard-container">
            {/* Wizard Card Left Side */}
            <div className="ae-wizard-card">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Discard event draft? Your progress will be lost.')) {
                    setShowCreateForm(false);
                    setStep(1);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0f172a'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <X size={20} />
              </button>

              {/* Step 1: General Info */}
              {step === 1 && (
                <>
                  <div className="ae-wizard-banner">
                    <div className="ae-wizard-banner-icon">
                      <Rocket size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[0].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[0].sub}</span>
                    </div>
                  </div>

                  {/* Hero Image Section */}
                  <div className="ae-wizard-hero-upload" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}>
                    <div className="ae-wizard-hero-preview" style={{ width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Hero preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ opacity: 0.3, color: '#475569' }}><Plus size={24} /></div>
                      )}
                    </div>
                    <div className="ae-wizard-hero-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <span className="ae-wizard-hero-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>Pick your event's hero image</span>
                      <span className="ae-wizard-hero-desc" style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.35' }}>Paste an external URL below, or upload a local file.</span>
                      <input
                        type="file"
                        id="hero-file-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="ae-wizard-hero-btn"
                        style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', width: 'fit-content' }}
                        onClick={() => document.getElementById('hero-file-upload').click()}
                      >
                        Upload image
                      </button>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Hero Image URL (Optional)</label>
                    <input
                      className="form-input"
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Paste external image URL here"
                      style={{ width: '100%', borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                      {formData.eventType === 'macro' ? 'Macro Event Title *' : 'Event Title *'}
                    </label>
                    <input
                      className="form-input"
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder={formData.eventType === 'macro' ? "e.g., Helix '26 Flagship" : "e.g., E-sports Gaming Tournament"}
                      style={{ width: '100%', borderRadius: '10px' }}
                    />
                  </div>

                  {formData.eventType !== 'macro' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Event Category *</label>
                        <Select className="form-select" name="category" value={formData.category || 'None'} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                          <option value="None">None</option>
                          <option value="Technical">Technical</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Non-Technical">Non-Technical</option>
                        </Select>
                      </div>

                      {events.filter(e => e.eventType === 'macro').length > 0 && (
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Parent Macro Event (Optional)</label>
                          <Select className="form-select" name="parentEvent" value={formData.parentEvent || ''} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                            <option value="">None (Standalone)</option>
                            {events
                              .filter(e => e.eventType === 'macro')
                              .map(macro => (
                                <option key={macro._id} value={macro._id}>{macro.title}</option>
                              ))
                            }
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.eventType === 'macro' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Max Sub-events *</label>
                          <input
                            className="form-input"
                            type="number"
                            name="macroCountLimit"
                            required
                            min="1"
                            value={formData.macroCountLimit || 5}
                            onChange={handleInputChange}
                            placeholder="e.g., 5"
                            style={{ width: '100%', borderRadius: '10px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Event Duration (From - To) *</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <DatePicker
                                value={formData.date || ''}
                                onChange={(e) => {
                                  const start = e.target.value;
                                  const end = formData.endDate || start;
                                  const updated = updateConsecutiveDates(start, end, formData);
                                  setFormData(updated);
                                }}
                                placeholder="From Date"
                              />
                            </div>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>to</span>
                            <div style={{ flex: 1 }}>
                              <DatePicker
                                value={formData.endDate || formData.date || ''}
                                onChange={(e) => {
                                  const end = e.target.value;
                                  const start = formData.date || end;
                                  const updated = updateConsecutiveDates(start, end, formData);
                                  setFormData(updated);
                                }}
                                placeholder="To Date"
                              />
                            </div>
                          </div>
                          {formData.noOfDays > 0 && formData.date && (
                            <small style={{ display: 'block', marginTop: '6px', color: 'var(--clr-accent)', fontWeight: '600' }}>
                              Calculated Duration: {formData.noOfDays} Day{formData.noOfDays > 1 ? 's' : ''}
                            </small>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0, fontWeight: '600', color: '#334155' }}>Event Description</label>
                      {checkingGrammar && (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}>
                          <span className="ae-checking-dot" style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                          Autocorrecting grammar...
                        </span>
                      )}
                    </div>
                    <textarea
                      className="form-textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      onBlur={handleAutoCheckGrammar}
                      placeholder="Description"
                      style={{ width: '100%', minHeight: '90px', borderRadius: '10px' }}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Schedule & Venue */}
              {step === 2 && (
                <>
                  <div className="ae-wizard-banner">
                    <div className="ae-wizard-banner-icon">
                      <Compass size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[1].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[1].sub}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Date *</label>
                      <DatePicker value={formData.date} onChange={handleInputChange} />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Session Slot</label>
                      <Select className="form-select" name="session" value={formData.session} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                        <option value="none">No Session (Generic)</option>
                        <option value="day1_morning">Day 1: 9:00 AM - 1:00 PM</option>
                        <option value="day1_afternoon">Day 1: 2:00 PM - 4:00 PM</option>
                        <option value="day2_morning">Day 2: 9:00 AM - 1:00 PM</option>
                      </Select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Location *</label>
                      <input
                        className="form-input"
                        type="text"
                        name="location"
                        required
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Seminar Hall II"
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Resource Person / Resources</label>
                      <input
                        className="form-input"
                        type="text"
                        name="resourcePerson"
                        value={formData.resourcePerson || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Dr. Jane Doe (MIT)"
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Contact Details</label>
                    <input
                      className="form-input"
                      type="text"
                      name="contactDetails"
                      value={formData.contactDetails || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., John (9876543210), Sarah (8765432109)"
                      style={{ width: '100%', borderRadius: '10px' }}
                    />
                  </div>
                </>
              )}

              {/* Step 3: Team Limits */}
              {step === 3 && (
                <>
                  <div className="ae-wizard-banner">
                    <div className="ae-wizard-banner-icon">
                      <Users size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[2].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[2].sub}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Max Team Size *</label>
                      <input
                        className="form-input"
                        type="number"
                        name="teamSizeLimit"
                        min="1"
                        max="10"
                        value={formData.teamSizeLimit}
                        onChange={handleInputChange}
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Max Shortlisted Teams (0 = No Limit) *</label>
                      <input
                        className="form-input"
                        type="number"
                        name="maxShortlisted"
                        min="0"
                        value={formData.maxShortlisted}
                        onChange={handleInputChange}
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 4: Evaluation Setup */}
              {step === 4 && (
                <>
                  <div className="ae-wizard-banner">
                    <div className="ae-wizard-banner-icon">
                      <Award size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[3].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[3].sub}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Number of Rounds *</label>
                      <input
                        className="form-input"
                        type="number"
                        name="rounds"
                        min="1"
                        max="10"
                        value={formData.rounds}
                        onChange={handleInputChange}
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Number of Winners *</label>
                      <input
                        className="form-input"
                        type="number"
                        name="numberOfWinners"
                        min="1"
                        value={formData.numberOfWinners}
                        onChange={handleInputChange}
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Event Coordinators */}
              {step === 5 && (
                <>
                  <div className="ae-wizard-banner" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9f67fa 100%)' }}>
                    <div className="ae-wizard-banner-icon">
                      <UserPlus size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[4].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[4].sub}</span>
                    </div>
                  </div>

                  {/* Inline Add Form */}
                  <div className="wiz-coord-add-form">
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Full Name"
                      id="wiz-coord-name"
                      style={{ borderRadius: '10px', flex: 2 }}
                    />
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Email Address"
                      id="wiz-coord-email"
                      style={{ borderRadius: '10px', flex: 2 }}
                    />
                    <Select
                      className="form-select"
                      id="wiz-coord-role"
                      style={{ borderRadius: '10px', flex: 1, background: '#fff', border: '1px solid var(--clr-border)' }}
                    >
                      <option value="Lead Coordinator">Lead Coordinator</option>
                      <option value="Co-Lead Coordinator">Co-Lead Coordinator</option>
                      <option value="Organizer">Organizer</option>
                      <option value="Volunteer">Volunteer</option>
                    </Select>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm wiz-coord-add-btn"
                      style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)', flexShrink: 0 }}
                      onClick={() => {
                        const name = document.getElementById('wiz-coord-name').value.trim();
                        const email = document.getElementById('wiz-coord-email').value.trim();
                        const role = document.getElementById('wiz-coord-role').value;
                        if (!name || !email) { showToast('Please enter both name and email.', 'error'); return; }
                        setFormData(prev => ({
                          ...prev,
                          coordinators: [...(prev.coordinators || []), { name, email, role }]
                        }));
                        document.getElementById('wiz-coord-name').value = '';
                        document.getElementById('wiz-coord-email').value = '';
                        document.getElementById('wiz-coord-role').value = 'Organizer';
                      }}
                    >
                      <UserPlus size={14} /> Add
                    </button>
                  </div>

                  {/* Coordinator List */}
                  <div className="wiz-coord-list">
                    {(formData.coordinators || []).length === 0 ? (
                      <div className="wiz-coord-empty">
                        <Users size={28} style={{ color: '#cbd5e1' }} />
                        <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>No coordinators added yet. They can also be added later from the dashboard.</p>
                      </div>
                    ) : (
                      (formData.coordinators || []).map((coord, idx) => {
                        const initials = coord.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                        const bgColors = ['#eff6ff', '#f5f3ff', '#fffbeb', '#ecfdf5'];
                        const textColors = ['#2563eb', '#7c3aed', '#d97706', '#059669'];
                        const ci = idx % 4;
                        return (
                          <div className="wiz-coord-item" key={idx}>
                            <div
                              className="wiz-coord-avatar"
                              style={{ backgroundColor: bgColors[ci], color: textColors[ci] }}
                            >
                              {initials}
                            </div>
                            <div className="wiz-coord-info">
                              <span className="wiz-coord-name">{coord.name}</span>
                              <span className="wiz-coord-email">{coord.email}</span>
                              <span className="wiz-coord-role-badge">{coord.role}</span>
                            </div>
                            <button
                              type="button"
                              className="wiz-coord-remove"
                              title="Remove"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                coordinators: prev.coordinators.filter((_, i) => i !== idx)
                              }))}
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {/* Step 6: Event Policies */}
              {step === 6 && (
                <>
                  <div className="ae-wizard-banner">
                    <div className="ae-wizard-banner-icon">
                      <Key size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[5].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[5].sub}</span>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Attendance System Mode</label>
                    <Select className="form-select" name="attendanceMode" value={formData.attendanceMode || 'student_scan'} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                      <option value="student_scan">Student Scans Admin (Traditional)</option>
                      <option value="admin_scan">Admin Scans Student (Speedy)</option>
                      <option value="both">Both (Maximum Flexibility)</option>
                    </Select>
                  </div>

                  <div className="ae-toggle-row" style={{ marginTop: '1rem' }}>
                    {[
                      { name: 'isRegistrationOpen', label: 'Registrations Open', desc: 'Allow new sign-ups immediately' },
                      { name: 'isTeamChangeAllowed', label: 'Team Changes Allowed', desc: 'Allow teammate edits before deadline' },
                    ].map(t => (
                      <label key={t.name} className={`ae-toggle-item ${formData[t.name] ? 'active' : ''}`}>
                        <div className="ae-toggle-info">
                          <span>{t.label}</span>
                          <small>{t.desc}</small>
                        </div>
                        <div className="ae-toggle-switch">
                          <input type="checkbox" name={t.name} checked={formData[t.name]} onChange={handleInputChange} style={{ display: 'none' }} />
                          <div className="ae-switch-track">
                            <div className="ae-switch-thumb" />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* Step 7: Overview & Launch */}
              {step === (formData.eventType === 'macro' ? 2 : 7) && (
                <>
                  <div className="ae-wizard-banner" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                    <div className="ae-wizard-banner-icon">
                      <Send size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">
                        {formData.eventType === 'macro' ? MACRO_WIZARD_STEPS[1].desc : WIZARD_STEPS[6].desc}
                      </span>
                      <span className="ae-wizard-banner-desc">
                        {formData.eventType === 'macro' ? MACRO_WIZARD_STEPS[1].sub : WIZARD_STEPS[6].sub}
                      </span>
                    </div>
                  </div>

                  <div className="ae-wizard-overview-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Title:</span>
                      <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Event Type:</span>
                      <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem', textTransform: 'capitalize' }}>{formData.eventType} Event</span>
                    </div>
                    {formData.eventType === 'macro' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Max Sub-events:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.macroCountLimit} Micro Events</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Number of Days:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.noOfDays} Days</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem', marginBottom: '4px' }}>Event Dates:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                            {(formData.dates || []).map((d, idx) => (
                              <span key={idx} style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>
                                Day {idx + 1}: {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Category:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.category}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Date & Slot:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.date} ({formData.session !== 'none' ? formData.session.replace('_', ' ') : 'General'})</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Location:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.location}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Team Size Limit:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.teamSizeLimit} Members</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Rounds Setup:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.rounds} Round{formData.rounds !== 1 ? 's' : ''}</span>
                        </div>
                        {formData.resourcePerson && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                            <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Resource Person:</span>
                            <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.resourcePerson}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Event Coordinators:</span>
                          <span style={{ fontWeight: '700', color: (formData.coordinators || []).length > 0 ? '#059669' : '#94a3b8', fontSize: '0.85rem' }}>
                            {(formData.coordinators || []).length > 0
                              ? `${(formData.coordinators || []).length} assigned`
                              : 'None (add later)'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Attendance Mode:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.attendanceMode || 'student_scan'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ae-toggle-row" style={{ marginTop: '0.5rem' }}>
                    <label className={`ae-toggle-item ${formData.isPublished ? 'active' : ''}`}>
                      <div className="ae-toggle-info">
                        <span>Publish Immediately</span>
                        <small>Make the event visible to students right away</small>
                      </div>
                      <div className="ae-toggle-switch">
                        <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleInputChange} style={{ display: 'none' }} />
                        <div className="ae-switch-track">
                          <div className="ae-switch-thumb" />
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* Card Footer controls */}
              <div className="ae-wizard-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handlePrevStep}
                  disabled={step === 1}
                >
                  Back
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.8rem', color: '#64748b' }}
                  >
                    Hint <Info size={14} style={{ marginLeft: '4px' }} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    disabled={submitting}
                  >
                    {step === (formData.eventType === 'macro' ? 2 : 7) ? (submitting ? 'Creating...' : 'Create Event \u25b8') : 'Next Step \u25b8'}
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Right Side */}
            <div className="ae-wizard-stepper">
              {(formData.eventType === 'macro' ? MACRO_WIZARD_STEPS : WIZARD_STEPS).map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;
                return (
                  <div
                    key={idx}
                    className={`ae-stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      if (isCompleted || stepNum < step) {
                        setStep(stepNum);
                      }
                    }}
                    style={{ cursor: (isCompleted || stepNum < step) ? 'pointer' : 'default' }}
                  >
                    <span className="ae-stepper-title">
                      Step {stepNum}/{formData.eventType === 'macro' ? 2 : 7} {isCompleted && '\u2713'}
                    </span>
                    <span className="ae-stepper-desc">{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '6rem 0' }}>
          <Loader text="Loading your event command center..." />
        </div>
      ) : events.length === 0 && !showCreateForm ? (
        <div className="ae-empty animate-fade-in">
          <ClipboardList size={40} style={{ opacity: 0.4, color: 'var(--clr-text-muted)' }} />
          <p>No events yet. Click <strong>New Event</strong> to get started.</p>
        </div>
      ) : (
        <div className="evc-grid animate-fade-in-up">
          {events.map((ev) => {
            const dateParts = getUTCDateParts(ev.date);
            const subCount = events.filter(sub => sub.parentEvent === ev._id).length;
            const typeColor =
              ev.eventType === 'macro'    ? '#6366f1' :
              ev.eventType === 'internal' ? '#f59e0b' : '#10b981';
            const isMenuOpen = activeMenuId === ev._id;

            return (
              <div
                key={ev._id}
                className="evc-card"
                onClick={() => navigate(`/admin/events/${ev.slug || ev._id}`)}
              >
                 <div className="evc-cover">
                  <img 
                    src={ev.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'} 
                    alt={ev.title} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="evc-cover-grad" />

                  {/* Options Overlay Panel inside Image cover */}
                  <div className={`evc-image-overlay-menu ${isMenuOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    {confirmAction && confirmAction.eventId === ev._id ? (
                      <div className="evc-confirm-panel" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center', height: '100%', padding: '4px' }}>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
                          {confirmAction.message}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: '500', lineHeight: '1.3' }}>
                          {confirmAction.subMessage}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={(e) => confirmAction.actionFn()}
                            type="button"
                            style={{ padding: '4px 12px', fontSize: '0.72rem' }}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={(e) => { e.stopPropagation(); setConfirmAction(null); }}
                            type="button"
                            style={{ color: '#fff', padding: '4px 12px', fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          className="evc-overlay-btn"
                          onClick={(e) => handleToggleRegistration(e, ev)}
                          type="button"
                        >
                          <span className="evc-overlay-btn-icon">
                            {ev.isRegistrationOpen !== false ? <Lock size={16} /> : <Unlock size={16} />}
                          </span>
                          {ev.isRegistrationOpen !== false ? 'Reg Close' : 'Reg Open'}
                        </button>

                        <button
                          className="evc-overlay-btn"
                          onClick={(e) => handleTogglePublish(e, ev)}
                          type="button"
                        >
                          <span className="evc-overlay-btn-icon">
                            {ev.isPublished ? <EyeOff size={16} /> : <Globe size={16} />}
                          </span>
                          {ev.isPublished ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          className="evc-overlay-btn danger"
                          onClick={(e) => handleDeleteEvent(e, ev)}
                          type="button"
                        >
                          <span className="evc-overlay-btn-icon">
                            <Trash2 size={16} />
                          </span>
                          Delete
                        </button>

                        <button
                          className="evc-overlay-btn primary"
                          onClick={() => navigate(`/admin/events/${ev.slug || ev._id}`)}
                          type="button"
                        >
                          <span className="evc-overlay-btn-icon">
                            <ExternalLink size={16} />
                          </span>
                          View Details
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info row with Date column + details column */}
                <div className="evc-info">
                  <div className="evc-date-col">
                    <span className="evc-date-mon" style={{ color: typeColor }}>{dateParts.month}</span>
                    <span className="evc-date-day">{dateParts.day}</span>
                    <span className="evc-date-yr">{new Date(ev.date).getFullYear()}</span>
                  </div>

                  <div className="evc-detail-col">
                    <div className="evc-labels-row">
                      <span className={`evc-type-lbl ${ev.eventType || 'general'}`}>
                        {ev.eventType === 'macro' ? 'Macro' : ev.eventType === 'internal' ? 'Internal' : 'General'}
                      </span>
                      {ev.category && ev.category !== 'None' && (
                        <span className="evc-category-lbl">{ev.category}</span>
                      )}
                    </div>
                    
                    <h3 className="evc-title" title={ev.title}>{ev.title}</h3>
                    
                    {ev.eventType !== 'macro' && ev.location && (
                      <div className="evc-venue" title={ev.location}>
                        <span className="evc-card-icon-wrap">
                          <MapPin size={13} />
                        </span>
                        {ev.location}
                      </div>
                    )}

                    {ev.eventType !== 'macro' && (
                      <div className="evc-timing">
                        <span className="evc-card-icon-wrap">
                          <Clock size={13} />
                        </span>
                        {ev.session ? (
                          ev.session.toLowerCase().includes('morning') ? '9:00 AM - 1:00 PM' : 
                          ev.session.toLowerCase().includes('afternoon') ? '1:00 PM - 4:30 PM' : 
                          'Time TBA'
                        ) : 'Time TBA'}
                      </div>
                    )}

                    {ev.eventType === 'macro' && subCount > 0 && (
                      <div className="evc-subs-count">
                        <span className="evc-card-icon-wrap">
                          <Layers size={13} />
                        </span>
                        {subCount} {subCount === 1 ? 'Sub-Event' : 'Sub-Events'}
                      </div>
                    )}
                    <div className={`evc-reg-pill ${ev.isRegistrationOpen !== false ? 'open' : 'closed'}`}>
                      <span className="evc-card-icon-wrap">
                        <span className="evc-reg-dot" />
                      </span>
                      {ev.isRegistrationOpen !== false ? 'Registration Open' : 'Closed'}
                    </div>
                  </div>
                </div>

                {/* Manage Button */}
                <button
                  className={`evc-manage-btn ${isMenuOpen ? 'open' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(isMenuOpen ? null : ev._id);
                  }}
                  type="button"
                >
                  Manage Event
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
