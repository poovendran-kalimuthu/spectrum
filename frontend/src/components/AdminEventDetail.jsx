import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import './AdminEvents.css'; 
import EventCountdown from './EventCountdown';
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
  Image as ImageIcon,
  ClipboardList,
  Trash2,
  Edit3,
  Save,
  Sliders,
  Settings,
  EyeOff,
  Info,
  Rocket,
  Compass,
  Award,
  Key,
  Send,
  SpellCheck
} from 'lucide-react';

const WIZARD_STEPS = [
  { name: 'General Info', desc: 'Define your event\'s identity', sub: 'Edit title, description, and hero image.' },
  { name: 'Schedule & Venue', desc: 'Set schedule & location', sub: 'Edit date, location, and session slots.' },
  { name: 'Team Limits', desc: 'Configure team limits', sub: 'Edit maximum team size and shortlist constraints.' },
  { name: 'Evaluation Setup', desc: 'Rounds & Evaluation Setup', sub: 'Add or configure evaluation rounds and scoring criteria.' },
  { name: 'Event Policies', desc: 'Establish event policies', sub: 'Configure attendance systems and registration open status.' },
  { name: 'Overview & Status', desc: 'Review & Visibility', sub: 'Inspect current configurations and publish state.' }
];

const MACRO_WIZARD_STEPS = [
  { name: 'General Info', desc: 'Define your event\'s identity', sub: 'Edit title, description, and hero image.' },
  { name: 'Schedule & Venue', desc: 'Set schedule & location', sub: 'Edit date, location, and session slots.' },
  { name: 'Sub-events', desc: 'Manage sub-events', sub: 'Manage micro events run under this macro event.' },
  { name: 'Overview & Status', desc: 'Review & Visibility', sub: 'Inspect current configurations and publish state.' }
];

const SUB_EVENT_EMPTY_FORM = {
  title: '',
  description: '',
  date: '',
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
  parentEvent: '',
  category: 'None',
  resourcePerson: '',
  contactDetails: ''
};

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

const AdminEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [allEvents, setAllEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [showAddCoordinatorModal, setShowAddCoordinatorModal] = useState(false);
  const [newCoordinator, setNewCoordinator] = useState({ name: '', email: '', role: 'Lead Coordinator' });
  const [coordUsers, setCoordUsers] = useState([]);
  const [coordSearch, setCoordSearch] = useState('');
  const [coordLoading, setCoordLoading] = useState(false);
  const [selectedCoordUser, setSelectedCoordUser] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'Rainer Brown',
      email: 'rainerbrwn@mail.com',
      text: 'Hi team, please verify if the presentation screens are working in the main hall.',
      time: '3:23 PM',
      reactions: 3,
      avatar: 'RB',
      profilePicture: '',
      reacted: false
    },
    {
      sender: 'Alex Sullivan',
      email: 'alexsullivan@mail.com',
      text: 'I checked the screens, they are good. Working on the registration desk setup now.',
      time: '3:25 PM',
      reactions: 1,
      avatar: 'AS',
      profilePicture: '',
      reacted: false
    },
    {
      sender: 'Lily Alexa',
      email: 'lilyalex@mail.com',
      text: 'Perfect, I will print the attendee badges and bring them over by 8:30 AM.',
      time: '3:28 PM',
      reactions: 5,
      avatar: 'LA',
      profilePicture: '',
      reacted: false
    }
  ]);
  const chatEndRef = useRef(null);
  const lastCheckedText = useRef('');
  const [checkingGrammar, setCheckingGrammar] = useState(false);



  // Auto-scroll chat to bottom when new message arrives
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Sub-event wizard states
  const [showSubEventWizard, setShowSubEventWizard] = useState(false);
  const [subEventStep, setSubEventStep] = useState(1);
  const [subEventFormData, setSubEventFormData] = useState({});

  // Disable body scroll when modal is open
  useEffect(() => {
    if (showAddCoordinatorModal || showSubEventWizard) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAddCoordinatorModal, showSubEventWizard]);

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
    fetchEvent();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true });
      if (res.data.success) setUser(res.data.user);
    } catch (err) { console.error("Error fetching user:", err); }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/admin/events`, { withCredentials: true });
      if (res.data.success) {
        setAllEvents(res.data.events);
        const ev = res.data.events.find(e => e._id === id || e.slug === id);
        if (ev) {
          if (ev.slug && id !== ev.slug) {
            navigate(`/admin/events/${ev.slug}`, { replace: true });
            return;
          }
          setEvent(ev);
          if (ev.title) {
            document.title = `Edit Event: ${ev.title} | Spectrum Admin`;
          }
          // Fetch registrations for metrics
          try {
            axios.get(`${API_URL}/api/admin/events/${ev._id}/registrations`, { withCredentials: true })
              .then(regRes => {
                if (regRes.data.success) {
                  setRegistrations(regRes.data.registrations);
                }
              })
              .catch(rErr => console.error("Error fetching registrations:", rErr));
          } catch (rErr) {
            console.error("Error outside registrations fetch:", rErr);
          }

          setFormData({
            title: ev.title,
            description: ev.description,
            date: ev.date ? getLocalDateString(ev.date) : '',
            location: ev.location,
            teamSizeLimit: ev.teamSizeLimit,
            maxShortlisted: ev.maxShortlisted || 0,
            session: ev.session || 'none',
            rounds: ev.rounds || 1,
            roundConfig: ev.roundConfig && ev.roundConfig.length > 0 ? ev.roundConfig.map(r => ({ ...r, maxAdvance: r.maxAdvance || 0 })) : [
              { roundNumber: 1, name: '', evaluationType: 'admin', criteria: [{ name: 'Overall', maxScore: 10 }], maxAdvance: 0 }
            ],
            imageUrl: ev.imageUrl || '',
            isPublished: ev.isPublished,
            isRegistrationOpen: ev.isRegistrationOpen !== undefined ? ev.isRegistrationOpen : true,
            isTeamChangeAllowed: ev.isTeamChangeAllowed !== undefined ? ev.isTeamChangeAllowed : true,
            attendanceMode: ev.attendanceMode || 'student_scan',
            eventType: ev.eventType || 'micro',
            parentEvent: ev.parentEvent || '',
            category: ev.category || 'None',
            macroCountLimit: ev.macroCountLimit || 5,
            resourcePerson: ev.resourcePerson || '',
            contactDetails: ev.contactDetails || '',
            noOfDays: ev.noOfDays || 1,
            dates: ev.dates && ev.dates.length > 0 ? ev.dates.map(d => getLocalDateString(d)) : [],
            endDate: ev.dates && ev.dates.length > 0 ? getLocalDateString(ev.dates[ev.dates.length - 1]) : (ev.date ? getLocalDateString(ev.date) : ''),
            coordinators: ev.coordinators || []
          });
        }
      }
    } catch (err) {
      showToast('Failed to load event.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  const handleRemoveCoordinator = async (index) => {
    const newCoordinators = formData.coordinators.filter((_, idx) => idx !== index);
    const updatedFormData = { ...formData, coordinators: newCoordinators };
    setFormData(updatedFormData);
    
    try {
      const res = await axios.put(`${API_URL}/api/admin/events/${event._id}`, updatedFormData, { withCredentials: true });
      if (res.data.success) {
        setEvent(res.data.event);
        showToast('Coordinator removed successfully!', 'success');
      }
    } catch (err) {
      console.error('Error removing coordinator:', err);
      showToast('Failed to remove coordinator.', 'error');
    }
  };

  const openAddCoordinatorModal = async () => {
    setShowAddCoordinatorModal(true);
    setCoordSearch('');
    setSelectedCoordUser(null);
    setNewCoordinator({ name: '', email: '', role: 'Lead Coordinator' });
    setCoordLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/users/coordinators`, { withCredentials: true });
      if (res.data.success) setCoordUsers(res.data.users);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setCoordLoading(false);
    }
  };

  const handleAddCoordinator = async (e) => {
    e.preventDefault();
    if (!selectedCoordUser) {
      showToast('Please select a user to add.', 'error');
      return;
    }
    const alreadyAdded = (formData.coordinators || []).some(c => c.email === selectedCoordUser.email);
    if (alreadyAdded) {
      showToast('This user is already a coordinator.', 'error');
      return;
    }
    
    const newCoordinators = [...(formData.coordinators || []), {
      name: selectedCoordUser.name,
      email: selectedCoordUser.email,
      role: newCoordinator.role,
      avatar: ''
    }];
    
    const updatedFormData = { ...formData, coordinators: newCoordinators };
    setFormData(updatedFormData);
    
    setShowAddCoordinatorModal(false);
    setSelectedCoordUser(null);
    setNewCoordinator({ name: '', email: '', role: 'Lead Coordinator' });
    
    try {
      const res = await axios.put(`${API_URL}/api/admin/events/${event._id}`, updatedFormData, { withCredentials: true });
      if (res.data.success) {
        setEvent(res.data.event);
        showToast('Coordinator added successfully!', 'success');
      }
    } catch (err) {
      console.error('Error adding coordinator:', err);
      showToast('Failed to add coordinator.', 'error');
    }
  };

  const handleDescriptionSave = async () => {
    try {
      const updatedFormData = { ...formData, description: tempDescription };
      setFormData(updatedFormData);
      
      const res = await axios.put(`${API_URL}/api/admin/events/${event._id}`, updatedFormData, { withCredentials: true });
      if (res.data.success) {
        setEvent(res.data.event);
        setIsEditingDescription(false);
        showToast('Event description updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error saving description:', err);
      showToast('Failed to save event description.', 'error');
    }
  };

  const handleUpdateEvent = async () => {
    try {
      setSubmitting(true);
      const res = await axios.put(`${API_URL}/api/admin/events/${event._id}`, formData, { withCredentials: true });
      if (res.data.success) {
        setEvent(res.data.event);
        showToast('Event configuration updated successfully!', 'success');
      }
    } catch (err) {
      console.error('Error updating event:', err);
      showToast('Failed to save event changes.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChatMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const newMessage = {
      sender: user?.name || 'Administrator',
      email: user?.email || 'admin@mail.com',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: 0,
      avatar: (user?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      profilePicture: user?.profilePicture || '',
      self: true,
      reacted: false
    };
    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
  };

  const handleReactToMessage = (index) => {
    const updated = [...chatMessages];
    const msg = updated[index];
    if (msg.reacted) {
      msg.reactions -= 1;
      msg.reacted = false;
    } else {
      msg.reactions += 1;
      msg.reacted = true;
    }
    setChatMessages(updated);
  };

  const handleInputChange = e => {
    let { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (type === 'number') val = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [name]: val }));
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
        setFormData(prev => ({ ...prev, imageUrl: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRoundsNumberChange = (e) => {
    let val = parseInt(e.target.value) || 1;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    
    setFormData(prev => {
      let newConfig = [...(prev.roundConfig || [])];
      if (val > newConfig.length) {
        while (newConfig.length < val) {
          const newRoundNumber = newConfig.length + 1;
          newConfig.push({
            roundNumber: newRoundNumber,
            name: `Round ${newRoundNumber}`,
            evaluationType: 'admin',
            criteria: [{ name: 'Overall', maxScore: 10 }],
            maxAdvance: 0
          });
        }
      } else if (val < newConfig.length) {
        newConfig = newConfig.slice(0, val);
      }
      return { ...prev, rounds: val, roundConfig: newConfig };
    });
  };

  // Round Builder Handlers
  const addRound = () => {
    setFormData(prev => {
      const newRoundNumber = (prev.roundConfig ? prev.roundConfig.length : 0) + 1;
      const newConfig = [...(prev.roundConfig || []), { 
        roundNumber: newRoundNumber, name: '', evaluationType: 'admin', criteria: [{ name: 'Overall', maxScore: 10 }], maxAdvance: 0
      }];
      return { ...prev, roundConfig: newConfig, rounds: newConfig.length };
    });
  };

  const removeRound = (index) => {
    setFormData(prev => {
      const newConfig = prev.roundConfig.filter((_, i) => i !== index).map((r, i) => ({ ...r, roundNumber: i + 1 }));
      return { ...prev, roundConfig: newConfig, rounds: newConfig.length };
    });
  };

  const handleRoundChange = (index, field, value) => {
    setFormData(prev => {
      const newConfig = [...prev.roundConfig];
      newConfig[index][field] = value;
      return { ...prev, roundConfig: newConfig };
    });
  };

  const addCriteria = (roundIndex) => {
    setFormData(prev => {
      const newConfig = [...prev.roundConfig];
      newConfig[roundIndex].criteria.push({ name: '', maxScore: 10 });
      return { ...prev, roundConfig: newConfig };
    });
  };

  const removeCriteria = (roundIndex, critIndex) => {
    setFormData(prev => {
      const newConfig = [...prev.roundConfig];
      newConfig[roundIndex].criteria = newConfig[roundIndex].criteria.filter((_, i) => i !== critIndex);
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleCriteriaChange = (roundIndex, critIndex, field, value) => {
    setFormData(prev => {
      const newConfig = [...prev.roundConfig];
      newConfig[roundIndex].criteria[critIndex][field] = value;
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSubmitting(true);
    try {
      const res = await axios.put(`${API_URL}/api/admin/events/${event._id}`, formData, { withCredentials: true });
      showToast('Event updated successfully!');
      if (res.data?.event?.slug && res.data.event.slug !== id) {
        navigate(`/admin/events/${res.data.event.slug}`);
      } else {
        fetchEvent();
      }
    } catch {
      showToast('Error saving event.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      setSubmitting(true);
      await axios.delete(`${API_URL}/api/admin/events/${event._id}`, { withCredentials: true });
      showToast('Event deleted successfully!');
      setTimeout(() => navigate('/admin/events'), 1500);
    } catch {
      showToast('Error deleting event.', 'error');
      setSubmitting(false);
    }
  };

  const handleSubEventInputChange = e => {
    let { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (type === 'number') val = parseInt(value) || 0;
    setSubEventFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubEventImageUpload = (e) => {
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
        setSubEventFormData(prev => ({ ...prev, imageUrl: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submitSubEventWizard = async () => {
    setSubmitting(true);
    try {
      const defaultRoundConfig = Array.from({ length: subEventFormData.rounds }, (_, idx) => ({
        roundNumber: idx + 1,
        name: `Round ${idx + 1}`,
        evaluationType: 'admin',
        criteria: [{ name: 'Overall', maxScore: 10 }],
        maxAdvance: 0
      }));

      const submitData = {
        ...subEventFormData,
        roundConfig: defaultRoundConfig
      };

      await axios.post(`${API_URL}/api/admin/events`, submitData, { withCredentials: true });
      showToast('Sub-event created successfully!');
      setShowSubEventWizard(false);
      fetchEvent();
    } catch (err) {
      console.error('Error creating sub-event:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Error creating sub-event.';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loading && !event) return <div className="ae-error"><h2>Event not found</h2><button className="btn btn-primary" onClick={() => navigate('/admin/events')}>Back</button></div>;

  return (
    <div className="ae-wizard-overlay" style={{ position: 'relative', minHeight: '100vh', padding: '2rem 1.75rem', display: 'block', background: 'var(--clr-bg)' }}>
      <PremiumToast toast={toast} onClose={() => setToast({ text: '', type: '' })} />
      
      {/* Editor Header */}
      <header className="ae-header">
        <div className="ae-header-left">
          <div>
            <h1 className="ae-title">
              {activeTab === 'dashboard' ? `Event Dashboard` : `Configure Event`}
            </h1>
            <p className="ae-subtitle">
              {activeTab === 'dashboard' ? 'Manage coordinators, progress, and messages' : 'Configure rounds, criteria, and settings'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={submitting}>
              <Trash2 size={14} /> Delete Event
            </button>
          )}
          {activeTab === 'dashboard' ? null : (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('dashboard')}>
                <Sliders size={14} /> View Dashboard
              </button>
              <button className="btn btn-accent btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/participants`)}>
                <Users size={14} /> Manage Participants
              </button>
              {user?.role === 'admin' && (
                <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting} style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)' }}>
                  <Save size={14} /> Save All Changes
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {loading ? (
        <div className="adb-skeleton-wrapper animate-fade-in">
          <div className="adb-container">
            <div className="adb-col-left">
              <div className="adb-card">
                <div className="skeleton adb-skel-title" />
                <div className="skeleton adb-skel-line" />
                <div className="skeleton adb-skel-line" style={{ width: '75%' }} />
                <div className="skeleton adb-skel-line" style={{ width: '88%' }} />
              </div>
              <div className="adb-card">
                <div className="skeleton adb-skel-title" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  {[0,1,2,3].map(i => <div key={i} className="skeleton adb-skel-coord-card" />)}
                </div>
              </div>
            </div>
            <div className="adb-col-right">
              <div className="adb-card">
                <div className="skeleton adb-skel-title" />
                {[0,1,2,3,4].map(i => <div key={i} className="skeleton adb-skel-meta-row" />)}
              </div>
              <div className="adb-card">
                <div className="skeleton adb-skel-title" />
                <div className="skeleton adb-skel-chat" />
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'dashboard' ? (
        <div className="animate-fade-in">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <EventCountdown title={event?.title} date={event?.date} />
          </div>
          <div style={{ maxWidth: '1200px', margin: '0 auto 2rem' }}>
            <div className="adb-modules-grid">
              <div className="adb-module-card-v2" onClick={() => setActiveTab(1)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                  <Settings size={22} strokeWidth={1.5} />
                </div>
                <h3>Configure Event</h3>
                <p>Define rules, rounds, scoring criteria, and venue details.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-slider"><div className="adb-fake-thumb"></div></div>
                  <div className="adb-fake-slider short"><div className="adb-fake-thumb"></div></div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/participants`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#a855f7', color: '#a855f7' }}>
                  <Users size={22} strokeWidth={1.5} />
                </div>
                <h3>Manage Participants</h3>
                <p>Review registrations, handle teams, and manage shortlists.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-avatars">
                    {registrations.slice(0, 3).map((reg, i) => (
                      <div key={reg._id || i} className={`adb-fake-avatar bg-${(i % 3) + 1}`} title={reg.teamLeader?.name || 'Participant'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(0,0,0,0.65)' }}>
                        {reg.teamLeader?.name ? reg.teamLeader.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                    ))}
                    {registrations.length > 3 && (
                      <div className="adb-fake-avatar count">+{registrations.length - 3}</div>
                    )}
                    {registrations.length > 0 ? (
                      <span style={{ marginLeft: '12px', fontSize: '0.75rem', fontWeight: '600', color: 'var(--clr-text-muted)' }}>
                        {registrations.length} Registered
                      </span>
                    ) : (
                      <div className="adb-fake-avatar count" style={{ width: 'auto', padding: '0 10px', borderRadius: '12px' }}>0 Registered</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/evaluators`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#eab308', color: '#eab308' }}>
                  <Award size={22} strokeWidth={1.5} />
                </div>
                <h3>Assign Evaluators</h3>
                <p>Allocate judges to specific rounds and track score submissions.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-list-item">
                    <div className="adb-fake-list-icon">{event?.roundConfig?.length || event?.rounds || 1}</div>
                    <div className="adb-fake-list-text">Evaluation {(event?.roundConfig?.length || event?.rounds || 1) === 1 ? 'Round' : 'Rounds'}</div>
                    <div className="adb-fake-list-arrow">&gt;</div>
                  </div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/attendance`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#22c55e', color: '#22c55e' }}>
                  <CheckCircle2 size={22} strokeWidth={1.5} />
                </div>
                <h3>Attendance Control</h3>
                <p>Scan participant QR codes or manually verify presence.</p>
                <div className="adb-module-bottom">
                   <div className="adb-fake-pills">
                     {event?.activeAttendance?.sessionToken ? (
                       <div className="adb-fake-pill green">Session Open</div>
                     ) : (
                       <div className="adb-fake-pill gray">Session Closed</div>
                     )}
                     <div className="adb-fake-pill" style={{ background: 'var(--clr-surface-2)', color: 'var(--clr-text-muted)', borderLeft: '3px solid var(--clr-accent)' }}>
                       {registrations.reduce((acc, reg) => acc + (reg.attendance?.filter(a => a.status === 'Present').length || 0), 0)} Marked
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          <div className="adb-container">
            {/* Left Column */}
            <div className="adb-col-left">
            {/* About Event Card */}
            <div className="adb-card adb-card-animate stagger-1">
              <div className="adb-card-header">
                <h3 className="adb-card-title">
                  <FileText size={18} style={{ color: 'var(--clr-accent)' }} />
                  About Event
                </h3>
                {isEditingDescription ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setIsEditingDescription(false)}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={handleDescriptionSave} style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)' }}>Save</button>
                  </div>
                ) : (
                  <button className="adb-edit-btn" onClick={() => {
                    setTempDescription(formData.description || '');
                    setIsEditingDescription(true);
                  }}>
                    <Edit3 size={14} />
                    Edit
                  </button>
                )}
              </div>
              <div className="adb-card-body">
                {isEditingDescription ? (
                  <textarea
                    className="form-textarea"
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    style={{ width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--clr-border)', fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}
                  />
                ) : (
                  <p className="adb-desc-text">{formData.description || 'No description provided.'}</p>
                )}
              </div>
            </div>

            {/* Event Coordinators Card */}
            <div className="adb-card adb-card-animate stagger-2">
              <div className="adb-card-header">
                <h3 className="adb-card-title">
                  <Users size={18} style={{ color: 'var(--clr-accent)' }} />
                  Event Coordinators
                </h3>
              </div>
              <div className="adb-card-body">
                <div className="adb-coordinators-list">
                  {(!formData.coordinators || formData.coordinators.length === 0) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'var(--clr-surface-2)', borderRadius: '12px', border: '1px dashed var(--clr-border)', marginBottom: '1rem' }}>
                      <div style={{ background: '#f8fafc', color: '#94a3b8', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <Users size={24} strokeWidth={1.5} />
                      </div>
                      <h4 style={{ margin: '0 0 6px', color: 'var(--clr-text-heading)', fontSize: '0.95rem', fontWeight: '600' }}>No Coordinators Assigned</h4>
                      <p style={{ margin: '0', color: 'var(--clr-text-muted)', fontSize: '0.8125rem', textAlign: 'center', maxWidth: '80%' }}>Add team members to help you manage this event.</p>
                    </div>
                  ) : (
                    (formData.coordinators || []).map((coord, idx) => {
                      const initials = coord.name ? coord.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'C';
                      const bgColors = ['#eff6ff', '#f5f3ff', '#fffbeb', '#ecfdf5'];
                      const textColors = ['#2563eb', '#7c3aed', '#d97706', '#059669'];
                      const colorIdx = idx % bgColors.length;
                      
                      return (
                        <div className="adb-coordinator-card" key={idx}>
                          <div className="adb-coordinator-info">
                            <div 
                              className="adb-coordinator-avatar" 
                              style={{ backgroundColor: bgColors[colorIdx], color: textColors[colorIdx] }}
                            >
                              {initials}
                            </div>
                            <div className="adb-coordinator-details">
                              <span className="adb-coordinator-name" title={coord.name}>{coord.name}</span>
                              <span className="adb-coordinator-email" title={coord.email}>{coord.email}</span>
                              <span className="adb-coordinator-role">{coord.role}</span>
                            </div>
                          </div>
                          <button 
                            className="adb-coordinator-delete" 
                            onClick={() => handleRemoveCoordinator(idx)}
                            title="Remove Coordinator"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <button 
                  onClick={() => openAddCoordinatorModal()}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '0.875rem', background: 'transparent', border: '1px dashed var(--clr-border)',
                    borderRadius: '12px', color: 'var(--clr-text-heading)', fontWeight: '600',
                    fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', marginTop: '1rem'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--clr-text-muted)'; e.currentTarget.style.background = 'var(--clr-surface-2)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <Plus size={16} /> Add Coordinator
                </button>
              </div>
            </div>

            {/* Progress Metrics Card */}
            <div className="adb-card adb-card-animate stagger-3">
              <div className="adb-card-header">
                <h3 className="adb-card-title">
                  <Zap size={18} style={{ color: 'var(--clr-accent)' }} />
                  Progress & Registration Metrics
                </h3>
                <button className="adb-edit-btn" onClick={() => setActiveTab(3)}>
                  <Sliders size={14} />
                  Limits Setup
                </button>
              </div>
              <div className="adb-card-body">
                <div className="adb-progress-layout">
                  {/* Gauge 1: Registration Capacity */}
                  <div className="adb-chart-container">
                    {(() => {
                      const limit = formData.maxShortlisted || 30;
                      const count = registrations.length;
                      const percentage = Math.min(100, limit > 0 ? Math.round((count / limit) * 100) : 0);
                      const strokeDash = (percentage / 100) * 251.2;
                      return (
                        <>
                          <svg width="120" height="120" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--clr-accent)" strokeWidth="8"
                              strokeDasharray="251.2" strokeDashoffset={251.2 - strokeDash} strokeLinecap="round"
                              transform="rotate(-90 50 50)" className="adb-gauge-circle" />
                            <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="var(--font-heading)">
                              {percentage}%
                            </text>
                          </svg>
                          <span className="adb-chart-title">Registration Capacity ({count}/{limit})</span>
                        </>
                      );
                    })()}
                  </div>

                  {/* Gauge 2: Verification Status */}
                  <div className="adb-chart-container">
                    {(() => {
                      const shortlisted = registrations.filter(r => r.isShortlisted && !r.isDisqualified).length;
                      const disqualified = registrations.filter(r => r.isDisqualified).length;
                      const pending = registrations.filter(r => !r.isShortlisted && !r.isDisqualified).length;
                      const total = registrations.length || 1;
                      
                      const shortlistedPct = Math.round((shortlisted / total) * 100);
                      const disqualifiedPct = Math.round((disqualified / total) * 100);
                      const pendingPct = Math.max(0, 100 - shortlistedPct - disqualifiedPct);
                      
                      return (
                        <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '240px', padding: '10px 0' }}>
                            <div style={{ height: '12px', width: '100%', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                              <div className="adb-status-bar-fill" style={{ width: `${shortlistedPct}%`, background: 'var(--clr-success)', height: '100%', transition: 'width 0.9s ease' }} title={`Shortlisted: ${shortlistedPct}%`} />
                              <div className="adb-status-bar-fill" style={{ width: `${pendingPct}%`, background: 'var(--clr-accent)', height: '100%', transition: 'width 0.9s ease' }} title={`Pending: ${pendingPct}%`} />
                              <div className="adb-status-bar-fill" style={{ width: `${disqualifiedPct}%`, background: 'var(--clr-danger)', height: '100%', transition: 'width 0.9s ease' }} title={`Disqualified: ${disqualifiedPct}%`} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--clr-text-muted)', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', background: 'var(--clr-success)', borderRadius: '50%' }} />
                                Shortlisted: {shortlisted} ({shortlistedPct}%)
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', background: 'var(--clr-accent)', borderRadius: '50%' }} />
                                Pending: {pending} ({pendingPct}%)
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '8px', height: '8px', background: 'var(--clr-danger)', borderRadius: '50%' }} />
                                Disqualified: {disqualified} ({disqualifiedPct}%)
                              </div>
                            </div>
                          </div>
                          <span className="adb-chart-title">Team Status Breakdown</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="adb-col-right">
            {/* About Event Metadata Card */}
            <div className="adb-card adb-card-animate stagger-1">
              <div className="adb-card-header">
                <h3 className="adb-card-title">
                  <Info size={18} style={{ color: 'var(--clr-accent)' }} />
                  About Event Details
                </h3>
                <button className="adb-edit-btn" onClick={() => setActiveTab(1)}>
                  <Sliders size={14} />
                  Configure
                </button>
              </div>
              <div className="adb-card-body" style={{ padding: '0.25rem 0' }}>
                <div className="adb-meta-item">
                  <span className="adb-meta-label">Status</span>
                  <span className="adb-meta-value">
                    {formData.isPublished ? (
                      <span className="adb-badge success">Published</span>
                    ) : (
                      <span className="adb-badge warning">Draft</span>
                    )}
                  </span>
                </div>
                <div className="adb-meta-item">
                  <span className="adb-meta-label">Category</span>
                  <span className="adb-meta-value">
                    <span className="adb-badge accent">{formData.category || 'None'}</span>
                  </span>
                </div>
                <div className="adb-meta-item">
                  <span className="adb-meta-label">Event Type</span>
                  <span className="adb-meta-value" style={{ textTransform: 'capitalize' }}>
                    {formData.eventType || 'micro'}
                  </span>
                </div>
                <div className="adb-meta-item">
                  <span className="adb-meta-label">Created By</span>
                  <span className="adb-meta-value">
                    {/* Profile avatar for creator */}
                    {event?.createdBy?.profilePicture ? (
                      <img
                        src={event.createdBy.profilePicture}
                        alt={event.createdBy.name}
                        className="adb-creator-avatar"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <span
                      className="adb-creator-avatar adb-creator-initials"
                      style={event?.createdBy?.profilePicture ? { display: 'none' } : {}}
                    >
                      {(event?.createdBy?.name || 'A').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                    <span>{event?.createdBy?.name || 'Administrator'}</span>
                  </span>
                </div>
                <div className="adb-meta-item">
                  <span className="adb-meta-label">Event Date</span>
                  <span className="adb-meta-value">
                    {formData.date ? new Date(formData.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}
                  </span>
                </div>
                {formData.location && (
                  <div className="adb-meta-item">
                    <span className="adb-meta-label">Location</span>
                    <span className="adb-meta-value" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={formData.location}>
                      {formData.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coordinator Chat Card */}
            <div className="adb-card adb-card-animate stagger-2">
              <div className="adb-card-header">
                <h3 className="adb-card-title">
                  <MessageSquare size={18} style={{ color: 'var(--clr-accent)' }} />
                  Group Message
                </h3>
                <div className="adb-chat-online-badges">
                  {(formData.coordinators || []).slice(0, 3).map((coord, i) => {
                    const initials = coord.name ? coord.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'C';
                    const bgColors = ['#eff6ff','#f5f3ff','#ecfdf5','#fffbeb'];
                    const txtColors = ['#2563eb','#7c3aed','#059669','#d97706'];
                    const ci = i % 4;
                    return (
                      <div
                        key={i}
                        className="adb-chat-header-avatar"
                        style={{ background: bgColors[ci], color: txtColors[ci], marginLeft: i > 0 ? '-8px' : 0 }}
                        title={coord.name}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {(formData.coordinators || []).length > 3 && (
                    <div className="adb-chat-header-avatar" style={{ background: '#f1f5f9', color: '#64748b', marginLeft: '-8px', fontSize: '0.62rem' }}>
                      +{(formData.coordinators || []).length - 3}
                    </div>
                  )}
                </div>
              </div>
              <div className="adb-card-body">
                <div className="adb-chat-window">
                  <div className="adb-chat-messages">
                    {chatMessages.map((msg, idx) => {
                      const avatarInitials = msg.avatar || (msg.sender || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                      return (
                        <div className={`adb-chat-bubble-container ${msg.self ? 'self' : ''}`} key={idx}>
                          {/* Avatar — profile photo or initials */}
                          {!msg.self && (
                            <div className="adb-chat-avatar" title={msg.sender}>
                              {msg.profilePicture ? (
                                <img
                                  src={msg.profilePicture}
                                  alt={msg.sender}
                                  className="adb-chat-avatar-img"
                                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <span
                                className="adb-chat-avatar-fallback"
                                style={msg.profilePicture ? { display: 'none' } : {}}
                              >
                                {avatarInitials}
                              </span>
                            </div>
                          )}
                          <div className="adb-chat-bubble">
                            {!msg.self && <span className="adb-chat-sender">{msg.sender}</span>}
                            <span className="adb-chat-text">{msg.text}</span>
                            <div className="adb-chat-footer">
                              <span className="adb-chat-time">{msg.time}</span>
                              <div className="adb-chat-reactions">
                                <button
                                  className={`adb-chat-reaction-btn ${msg.reacted ? 'reacted' : ''}`}
                                  onClick={() => handleReactToMessage(idx)}
                                >
                                  <span>❤️</span>
                                  {msg.reactions > 0 && <span>{msg.reactions}</span>}
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Self avatar */}
                          {msg.self && (
                            <div className="adb-chat-avatar adb-chat-avatar-self" title={msg.sender}>
                              {msg.profilePicture ? (
                                <img
                                  src={msg.profilePicture}
                                  alt={msg.sender}
                                  className="adb-chat-avatar-img"
                                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <span
                                className="adb-chat-avatar-fallback"
                                style={msg.profilePicture ? { display: 'none' } : {}}
                              >
                                {avatarInitials}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="adb-chat-input-area">
                    <input
                      type="text"
                      className="adb-chat-input"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                    />
                    <button type="submit" className="adb-chat-send-btn">
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      ) : (
        <div className="ae-wizard-container">
          {/* Card Panel Left */}
          <div className="ae-wizard-card">
            
            {/* Step 1: General Info */}
            {activeTab === 1 && (
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
                <div className="ae-wizard-hero-upload">
                  <div className="ae-wizard-hero-preview">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Event Hero Preview" />
                    ) : (
                      <div className="ae-wizard-hero-placeholder">
                        <ImageIcon size={40} />
                        <span>Upload Event Banner Image</span>
                      </div>
                    )}
                  </div>
                  <input type="file" id="hero-image-file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  <label htmlFor="hero-image-file" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', gap: '8px', cursor: 'pointer', margin: '0.5rem auto 0' }}>
                    <Plus size={14} /> {formData.imageUrl ? 'Change Image' : 'Select File'}
                  </label>
                </div>

                <div className="ae-form">
                  <div className="form-group">
                    <label className="form-label">Event Title</label>
                    <input type="text" name="title" className="form-input" placeholder="Spectrum Event Name" value={formData.title} onChange={handleInputChange} />
                  </div>

                  <div className="form-group" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Event Description</label>
                      <button 
                        type="button" 
                        className="btn btn-ghost btn-xs" 
                        onClick={handleAutoCheckGrammar}
                        disabled={checkingGrammar}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--clr-accent)' }}
                      >
                        <SpellCheck size={12} /> {checkingGrammar ? 'Checking...' : 'Fix Grammar'}
                      </button>
                    </div>
                    <textarea name="description" className="form-textarea" placeholder="Detailed description about the guidelines, requirements, format..." value={formData.description} onChange={handleInputChange} style={{ minHeight: '120px' }} />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Schedule & Venue */}
            {activeTab === 2 && (
              <>
                <div className="ae-wizard-banner">
                  <div className="ae-wizard-banner-icon">
                    <CalendarIcon size={20} />
                  </div>
                  <div className="ae-wizard-banner-text">
                    <span className="ae-wizard-banner-title">{WIZARD_STEPS[1].desc}</span>
                    <span className="ae-wizard-banner-desc">{WIZARD_STEPS[1].sub}</span>
                  </div>
                </div>

                <div className="ae-form">
                  {formData.eventType === 'macro' ? (
                    <div className="form-group">
                      <label className="form-label">Select Date Range</label>
                      <div className="date-range-inputs" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <small style={{ display: 'block', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Start Date</small>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={formData.date || ''} 
                            onChange={(e) => handleMacroDateRangeChange(e.target.value, formData.endDate)} 
                          />
                        </div>
                        <span style={{ color: 'var(--clr-text-muted)', marginTop: '20px' }}>&rarr;</span>
                        <div style={{ flex: 1 }}>
                          <small style={{ display: 'block', color: 'var(--clr-text-muted)', marginBottom: '4px' }}>End Date</small>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={formData.endDate || ''} 
                            onChange={(e) => handleMacroDateRangeChange(formData.date, e.target.value)} 
                          />
                        </div>
                      </div>
                      {formData.noOfDays > 1 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--clr-accent-light)', border: '1px solid #c7ccf9', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--clr-accent)' }}>
                          Calculated Duration: <strong>{formData.noOfDays} consecutive days</strong>.
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="ae-form-row">
                        <div className="form-group">
                          <label className="form-label">Event Date</label>
                          <input type="date" name="date" className="form-input" value={formData.date} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Event Slot/Session</label>
                          <Select name="session" className="form-select" value={formData.session} onChange={handleInputChange}>
                            <option value="none">General / No Specific Session</option>
                            <option value="day1_morning">Day 1 - Morning (9:00 AM - 12:30 PM)</option>
                            <option value="day1_afternoon">Day 1 - Afternoon (1:30 PM - 5:00 PM)</option>
                            <option value="day2_morning">Day 2 - Morning (9:00 AM - 1:00 PM)</option>
                          </Select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Location / Hall Venue</label>
                        <input type="text" name="location" className="form-input" placeholder="e.g. Lab 4, Seminar Hall II" value={formData.location} onChange={handleInputChange} />
                      </div>
                      
                      <div className="ae-form-row">
                        <div className="form-group">
                          <label className="form-label">Resource Person / Speaker</label>
                          <input type="text" name="resourcePerson" className="form-input" placeholder="External Speaker Name" value={formData.resourcePerson} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Coordinator Contact Details</label>
                          <input type="text" name="contactDetails" className="form-input" placeholder="Name & Contact number" value={formData.contactDetails} onChange={handleInputChange} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Team Limits */}
            {activeTab === 3 && (
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

                <div className="ae-form">
                  <div className="ae-form-row">
                    <div className="form-group">
                      <label className="form-label">Max Members per Team</label>
                      <input type="number" name="teamSizeLimit" className="form-input" min="1" max="12" value={formData.teamSizeLimit} onChange={handleInputChange} />
                      <small className="text-muted">A team size of 1 denotes individual participation</small>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Registrations Limit (Capacity)</label>
                      <input type="number" name="maxShortlisted" className="form-input" min="0" value={formData.maxShortlisted} onChange={handleInputChange} />
                      <small className="text-muted">0 means no limit on registrations</small>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Evaluation Setup */}
            {activeTab === 4 && (
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

                <div className="ae-form">
                  <div className="form-group">
                    <label className="form-label">Total Rounds</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="number" name="rounds" className="form-input" min="1" max="5" value={formData.rounds} onChange={handleRoundsNumberChange} style={{ maxWidth: '100px' }} />
                      <span className="text-muted">Generate individual config blocks for each round</span>
                    </div>
                  </div>

                  <div className="ae-rounds-builder">
                    {formData.roundConfig && formData.roundConfig.map((rc, rIdx) => (
                      <div key={rIdx} className="ae-round-card">
                        <div className="ae-round-header">
                          <h4>Round {rc.roundNumber} Configuration</h4>
                          <span className="ae-badge accent">R{rc.roundNumber}</span>
                        </div>

                        <div className="ae-form" style={{ gap: '0.85rem' }}>
                          <div className="ae-form-row">
                            <div className="form-group">
                              <label className="form-label">Round Custom Name</label>
                              <input type="text" className="form-input" placeholder={`e.g. Preliminary Quiz / Final Pitch`} value={rc.name} onChange={(e) => handleRoundConfigChange(rIdx, 'name', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Advancement Capacity Limit</label>
                              <input type="number" className="form-input" placeholder="0 (No Limit)" min="0" value={rc.maxAdvance || 0} onChange={(e) => handleRoundConfigChange(rIdx, 'maxAdvance', parseInt(e.target.value) || 0)} />
                              <small className="text-muted">Max teams allowed to advance past this round</small>
                            </div>
                          </div>

                          <div className="ae-form-row">
                            <div className="form-group">
                              <label className="form-label">Evaluation Type</label>
                              <Select className="form-select" value={rc.evaluationType} onChange={(e) => handleRoundConfigChange(rIdx, 'evaluationType', e.target.value)}>
                                <option value="admin">Internal Admin Panel Grading</option>
                                <option value="jury">External Jury Portal (using Pins)</option>
                              </Select>
                            </div>
                          </div>

                          <div className="ae-criteria-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <label className="form-label" style={{ marginBottom: 0 }}>Scoring Criteria</label>
                              <button type="button" className="btn btn-ghost btn-xs text-accent" onClick={() => handleAddCriteria(rIdx)}>+ Add Criterion</button>
                            </div>

                            {rc.criteria.map((cr, cIdx) => (
                              <div key={cIdx} className="ae-criteria-row">
                                <input type="text" className="form-input" placeholder="Criterion Name (e.g. Innovation)" value={cr.name} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'name', e.target.value)} style={{ flex: 2 }} />
                                <input type="number" className="form-input" min="1" max="100" value={cr.maxScore} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'maxScore', parseInt(e.target.value) || 10)} style={{ flex: 1 }} />
                                {rc.criteria.length > 1 && (
                                  <button type="button" className="btn btn-ghost btn-xs text-danger" onClick={() => handleRemoveCriteria(rIdx, cIdx)}><X size={14} /></button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Event Policies */}
            {activeTab === 5 && (
              <>
                <div className="ae-wizard-banner">
                  <div className="ae-wizard-banner-icon">
                    <Sliders size={20} />
                  </div>
                  <div className="ae-wizard-banner-text">
                    <span className="ae-wizard-banner-title">{WIZARD_STEPS[4].desc}</span>
                    <span className="ae-wizard-banner-desc">{WIZARD_STEPS[4].sub}</span>
                  </div>
                </div>

                <div className="ae-toggle-row">
                  {[
                    { label: 'Allow Registrations', desc: 'Accept new student sign-ups for this event', name: 'isRegistrationOpen' },
                    { label: 'Allow Team Changes', desc: 'Students can edit teammates prior to deadlines', name: 'isTeamChangeAllowed' }
                  ].map((item, idx) => (
                    <label key={idx} className={`ae-toggle-item ${formData[item.name] ? 'active' : ''}`}>
                      <div className="ae-toggle-info">
                        <span>{item.label}</span>
                        <small>{item.desc}</small>
                      </div>
                      <div className="ae-toggle-switch">
                        <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleInputChange} style={{ display: 'none' }} />
                        <div className="ae-switch-track">
                          <div className="ae-switch-thumb" />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

          </div>

          {/* Stepper Right Side */}
          <div className="ae-wizard-stepper">
            <div className="ae-stepper-nav-list">
              {(formData.eventType === 'macro' ? MACRO_WIZARD_STEPS : WIZARD_STEPS).map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = activeTab === stepNum;
                const maxSteps = formData.eventType === 'macro' ? 4 : 6;
                return (
                  <div 
                    key={idx} 
                    className={`ae-stepper-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(stepNum)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="ae-stepper-title">Section {stepNum}/{maxSteps}</span>
                    <span className="ae-stepper-desc" style={{ color: isActive ? 'var(--clr-accent)' : 'var(--clr-text-subtle)' }}>{s.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="ae-wizard-actions">
              <button 
                className={`ae-wizard-btn primary ${submitting ? 'loading' : ''}`}
                onClick={handleUpdateEvent}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="ae-btn-spinner"></div>
                ) : (
                  <Save size={15} strokeWidth={2.5} />
                )}
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button 
                className="ae-wizard-btn secondary"
                onClick={() => setActiveTab('dashboard')} 
              >
                <Sliders size={15} /> Back to Dashboard
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Sub-event Creation Wizard Overlay */}
      {showSubEventWizard && (
        <div className="modal-backdrop" style={{
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="ae-subevent-wizard-card" style={{
            width: '100%',
            maxWidth: '650px',
            background: '#0f172a',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflow: 'hidden',
            color: '#fff'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Create Sub-event</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Part of flagship: {formData.title}</p>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                style={{ minWidth: 'unset', width: '32px', height: '32px', padding: 0, borderRadius: '50%', color: '#94a3b8' }}
                onClick={() => setShowSubEventWizard(false)}
              >
                ✕
              </button>
            </div>

            {/* Step Indicators */}
            <div style={{
              display: 'flex',
              padding: '1rem 2rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              gap: '12px'
            }}>
              {[
                { step: 1, title: 'Identity' },
                { step: 2, title: 'Details & Constraints' },
                { step: 3, title: 'Review & Launch' }
              ].map(s => {
                const active = subEventStep === s.step;
                const completed = subEventStep > s.step;
                return (
                  <div key={s.step} style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{
                      height: '4px',
                      borderRadius: '2px',
                      background: active ? 'var(--clr-accent, #6366f1)' : completed ? '#10b981' : 'rgba(255, 255, 255, 0.1)'
                    }} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: active ? '700' : '500',
                      color: active ? '#fff' : completed ? '#10b981' : '#64748b'
                    }}>
                      Step {s.step}: {s.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scrollable Form Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              
              {/* STEP 1: IDENTITY */}
              {subEventStep === 1 && (
                <>
                  <div className="form-group">
                    <label className="form-label">Sub-event Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      name="title" 
                      placeholder="e.g. Speed Coding, UI/UX Design Challenge"
                      value={subEventFormData.title || ''} 
                      onChange={handleSubEventInputChange} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <Select 
                      className="form-select" 
                      name="category" 
                      value={subEventFormData.category || 'None'} 
                      onChange={handleSubEventInputChange}
                    >
                      <option value="None">None</option>
                      <option value="Coding">Coding</option>
                      <option value="Web Dev">Web Dev</option>
                      <option value="Security">Security</option>
                      <option value="Design">Design</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Quiz">Quiz</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-input" 
                      name="description" 
                      rows="4" 
                      placeholder="Detail the rules, formatting, and requirements..."
                      value={subEventFormData.description || ''} 
                      onChange={handleSubEventInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Banner Image (Optional)</label>
                    <div style={{
                      border: '2px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.01)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSubEventImageUpload} 
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      {subEventFormData.imageUrl ? (
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={subEventFormData.imageUrl} 
                            alt="Preview" 
                            style={{ maxHeight: '140px', borderRadius: '8px', margin: '0 auto' }} 
                          />
                          <button 
                            type="button" 
                            className="btn btn-xs btn-danger"
                            style={{ position: 'absolute', top: '5px', right: '5px', padding: '2px 6px', minHeight: 'unset' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubEventFormData(prev => ({ ...prev, imageUrl: '' }));
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon size={28} style={{ color: '#64748b', marginBottom: '8px' }} />
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Click or Drag image here to upload</p>
                          <small style={{ color: '#64748b' }}>Supports PNG, JPG, JPEG (Max 1MB)</small>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: DETAILS & CONSTRAINTS */}
              {subEventStep === 2 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        name="date" 
                        value={subEventFormData.date ? getLocalDateString(subEventFormData.date) : ''} 
                        onChange={handleSubEventInputChange} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location / Venue</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        name="location" 
                        placeholder="e.g. Lab 3, Seminar Hall"
                        value={subEventFormData.location || ''} 
                        onChange={handleSubEventInputChange} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Max Team Size</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        name="teamSizeLimit" 
                        min="1" 
                        max="10" 
                        value={subEventFormData.teamSizeLimit || 4} 
                        onChange={handleSubEventInputChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Number of Rounds</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        name="rounds" 
                        min="1" 
                        max="5" 
                        value={subEventFormData.rounds || 1} 
                        onChange={handleSubEventInputChange} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Max Shortlisted (0=∞)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        name="maxShortlisted" 
                        min="0" 
                        value={subEventFormData.maxShortlisted || 0} 
                        onChange={handleSubEventInputChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Session Slot</label>
                      <Select 
                        className="form-select" 
                        name="session" 
                        value={subEventFormData.session || 'none'} 
                        onChange={handleSubEventInputChange}
                      >
                        <option value="none">No Session (Generic)</option>
                        <option value="day1_morning">Day 1: 9:00 AM - 1:00 PM</option>
                        <option value="day1_afternoon">Day 1: 2:00 PM - 4:00 PM</option>
                        <option value="day2_morning">Day 2: 9:00 AM - 1:00 PM</option>
                      </Select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Resource Person / Contact</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        name="resourcePerson" 
                        placeholder="e.g. Prof. Alice (Resource)"
                        value={subEventFormData.resourcePerson || ''} 
                        onChange={handleSubEventInputChange} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Details</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        name="contactDetails" 
                        placeholder="e.g. John (9876543210)"
                        value={subEventFormData.contactDetails || ''} 
                        onChange={handleSubEventInputChange} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Attendance System Mode</label>
                    <Select 
                      className="form-select" 
                      name="attendanceMode" 
                      value={subEventFormData.attendanceMode || 'student_scan'} 
                      onChange={handleSubEventInputChange}
                    >
                      <option value="student_scan">Student Scans Admin (Traditional)</option>
                      <option value="admin_scan">Admin Scans Student (Speedy)</option>
                      <option value="both">Both (Maximum Flexibility)</option>
                    </Select>
                  </div>
                </>
              )}

              {/* STEP 3: REVIEW & LAUNCH */}
              {subEventStep === 3 && (
                <>
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Title:</span>
                      <span style={{ fontWeight: '600' }}>{subEventFormData.title}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Category:</span>
                      <span style={{ fontWeight: '600' }}>{subEventFormData.category}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Venue & Slot:</span>
                      <span style={{ fontWeight: '600' }}>{subEventFormData.location} ({subEventFormData.session === 'none' ? 'General' : subEventFormData.session.replace('_', ' ')})</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Team Size & Rounds:</span>
                      <span style={{ fontWeight: '600' }}>{subEventFormData.teamSizeLimit} Members, {subEventFormData.rounds} Round(s)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '0.5rem' }}>
                    <label className={`ae-toggle-item ${subEventFormData.isPublished ? 'active' : ''}`} style={{ margin: 0, padding: '12px 16px' }}>
                      <div className="ae-toggle-info">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                          {subEventFormData.isPublished ? <Eye size={16} /> : <EyeOff size={16} />} Publish Instantly
                        </span>
                        <small style={{ fontSize: '0.75rem' }}>Make this sub-event visible to students immediately</small>
                      </div>
                      <div className="ae-toggle-switch">
                        <input 
                          type="checkbox" 
                          name="isPublished" 
                          checked={subEventFormData.isPublished || false} 
                          onChange={handleSubEventInputChange} 
                          style={{ display: 'none' }} 
                        />
                        <div className="ae-switch-track">
                          <div className="ae-switch-thumb" />
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.1)'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => subEventStep > 1 && setSubEventStep(subEventStep - 1)}
                disabled={subEventStep === 1}
              >
                Back
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowSubEventWizard(false)}
                >
                  Cancel
                </button>
                {subEventStep < 3 ? (
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (subEventStep === 1 && (!subEventFormData.title || !subEventFormData.description)) {
                        showToast('Please fill in title and description', 'error');
                        return;
                      }
                      setSubEventStep(subEventStep + 1);
                    }}
                  >
                    Next &rarr;
                  </button>
                ) : (
                  <button 
                    type="button" 
                    className="btn btn-accent btn-sm"
                    onClick={submitSubEventWizard}
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Micro Event'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Coordinator Modal */}
      {showAddCoordinatorModal && (
        <div className="ae-modal-backdrop" style={{ zIndex: 9999, position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="ae-modal" style={{ maxWidth: '480px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', textAlign: 'left', background: '#fff', borderRadius: '20px', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0', overflow: 'visible' }}>
            {/* Conditional views */}
            {!selectedCoordUser ? (
              <>
                {/* Modal Header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Add Event Coordinator</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Select from users with admin roles</p>
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowAddCoordinatorModal(false)} style={{ minWidth: 'auto', padding: '4px' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Search */}
                <div style={{ padding: '1rem 1.5rem 0.5rem', flexShrink: 0 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search by name or email…"
                      value={coordSearch}
                      onChange={e => setCoordSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none', boxShadow: 'none' }}
                      autoFocus
                    />
                    <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  </div>
                </div>

                {/* User List */}
                <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '0.5rem 1.5rem 1.5rem' }}>
                  {coordLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>Loading users…</div>
                  ) : coordUsers.filter(u => {
                      const q = coordSearch.toLowerCase();
                      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                    }).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                      No users found with admin roles.
                    </div>
                  ) : (
                    coordUsers
                      .filter(u => {
                        const q = coordSearch.toLowerCase();
                        return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
                      })
                      .map(u => {
                        const initials = u.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                        const isAlreadyAdded = (formData.coordinators || []).some(c => c.email === u.email);
                        const roleBg = u.role === 'superadmin' ? '#fef2f2' : '#f0fdf4';
                        const roleColor = u.role === 'superadmin' ? '#dc2626' : '#16a34a';
                        const roleLabels = { 'superadmin': 'Super Admin', 'admin_t1': 'Admin T1', 'admin_t2': 'Admin T2' };
                        const displayRole = roleLabels[u.role] || u.role;
                        return (
                          <div
                            key={u._id}
                            onClick={() => !isAlreadyAdded && setSelectedCoordUser(u)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.75rem',
                              padding: '0.625rem 0.75rem', borderRadius: '12px', marginBottom: '4px',
                              cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                              border: `1.5px solid #e2e8f0`,
                              background: isAlreadyAdded ? '#f8fafc' : '#fff',
                              opacity: isAlreadyAdded ? 0.55 : 1,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
                              {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: roleBg, color: roleColor, textTransform: 'capitalize', flexShrink: 0 }}>{displayRole}</span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{u.email}{u.department ? ` · ${u.department}` : ''}</span>
                            </div>
                            {isAlreadyAdded && <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>Added</span>}
                            {!isAlreadyAdded && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleAddCoordinator} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                {/* View 2: Assign Role */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button type="button" onClick={() => setSelectedCoordUser(null)} style={{ background: 'var(--clr-surface-2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Assign Role</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>for {selectedCoordUser.name}</p>
                    </div>
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => { setShowAddCoordinatorModal(false); setSelectedCoordUser(null); }} style={{ minWidth: 'auto', padding: '4px' }}>
                    <X size={18} />
                  </button>
                </div>
                
                <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.5rem', flexShrink: 0, marginBottom: '0.25rem' }}>
                    {selectedCoordUser.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{selectedCoordUser.name}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{selectedCoordUser.email}</p>
                  </div>
                  
                  <div style={{ width: '100%', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.75rem' }}>Select a role:</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {['Lead Coordinator', 'Co-Lead Coordinator', 'Organizer', 'Volunteer'].map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setNewCoordinator(prev => ({ ...prev, role }))}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '10px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: newCoordinator.role === role ? '#eff6ff' : '#fff',
                            color: newCoordinator.role === role ? 'var(--clr-accent)' : '#475569',
                            border: `2px solid ${newCoordinator.role === role ? 'var(--clr-accent)' : '#e2e8f0'}`,
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center'
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' }}>STEP 2 OF 2</span>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)', padding: '0 24px' }}
                    disabled={!selectedCoordUser}
                  >
                    Confirm & Add
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventDetail;
