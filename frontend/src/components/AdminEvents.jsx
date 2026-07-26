import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from './Loader';
import EmptyState from './EmptyState';
import { API_URL } from '../config';
import './AdminEvents.css';
import './EventCard.css';
import wizardIllustration from '../assets/wizard_illustration.jpg';
import traditionalScanPana from '../assets/illustrations/storyset_traditional.svg';
import speedyScanPana from '../assets/illustrations/storyset_speedy.svg';
import flexibleScanPana from '../assets/illustrations/storyset_flexible.svg';
import Select from './ui/Select';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Plus,
  Minus,
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
  UserMinus,
  FileDown,
  Stamp,
  IndianRupee,
  Building2,
  QrCode,
  Scan,
  Smartphone
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
  designation: '',
  resourcePersonImage: '',
  noOfDays: 1,
  dates: [],
  coordinators: [],
  feedbackTemplate: '',
  roundConfig: [{ roundNumber: 1, name: 'Round 1', maxAdvance: 0, evaluationType: 'admin', criteria: [{ name: 'Creativity & Innovation', maxScore: 20 }, { name: 'Technical Execution', maxScore: 20 }, { name: 'Presentation Skills', maxScore: 20 }, { name: 'Problem Solving', maxScore: 20 }, { name: 'Team Collaboration', maxScore: 20 }], assignedJudges: [] }],
  approvalDetails: {
    internalParticipants: '',
    externalParticipants: '',
    proposedBudget: '1,20,000',
    actualSpentTillDate: '0',
    availableBudget: '1,20,000',
    nowRequested: '',
    advanceNote: '',
    budgetItems: [
      { name: 'Certificates (Winners)', quantity: '', ratePerUnit: '15', totalCost: '', modeOfArrangement: 'NIA Printing', remarks: 'Final Round Event Winners' },
      { name: 'Cash prize (winners)', quantity: '', ratePerUnit: '', totalCost: '', modeOfArrangement: 'Voucher', remarks: '1st-1000/-, 2nd-750/-, 3rd-500/-' },
      { name: 'Stationery & Printing', quantity: '-', ratePerUnit: '-', totalCost: '', modeOfArrangement: 'NIA Printing', remarks: '-' },
    ]
  }
};

const WIZARD_STEPS = [
  { name: 'Event Details', desc: 'Define your event\'s identity & schedule', sub: 'Add essential details like title, schedule, venue, and description.' },
  { name: 'Resource Person', desc: 'Set resource person details', sub: 'Provide details about the guest speaker or resource.' },
  { name: 'Team & Evaluation', desc: 'Configure team & evaluation limits', sub: 'Set team sizes, shortlisting limits, rounds, and winners.' },
  { name: 'Round Configurations', desc: 'Define round criteria', sub: 'Configure scoring criteria and advancement limits per round.' },
  { name: 'Event Coordinators', desc: 'Assign event coordinators', sub: 'Add the organizers and volunteers managing this event.' },
  { name: 'Policies & Feedback', desc: 'Establish event policies & feedback form', sub: 'Select feedback templates, set attendance modes, and control registration status.' },
  { name: 'Approval & Budget', desc: 'Configure approval document & budget', sub: 'Set participant counts and itemized budget details.' },
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


const focusNextElement = (currentEl) => {
  const focusableSelector = 'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled]), .custom-select-trigger:not(.disabled)';
  const focusables = Array.from(document.querySelectorAll(focusableSelector));
  const visibleFocusables = focusables.filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
  });
  const index = visibleFocusables.indexOf(currentEl);
  if (index !== -1 && index < visibleFocusables.length - 1) {
    visibleFocusables[index + 1].focus();
  }
};


// --- Custom Calendar DatePicker ---
const DatePicker = ({ value, onChange, placeholder = "Type or pick a date", name = 'date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [inputError, setInputError] = useState('');
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

  useEffect(() => { setRawInput(value ? formatDateDisplay(value) : ''); }, [value]);

  const parseTyped = (s) => {
    if (!s || !s.trim()) return null;
    let m;
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) { const d = new Date(+m[1],+m[2]-1,+m[3]); if (!isNaN(d)&&d.getMonth()===+m[2]-1) return d; }
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) { const d = new Date(+m[3],+m[2]-1,+m[1]); if (!isNaN(d)&&d.getMonth()===+m[2]-1) return d; }
    m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (m) { const d = new Date(+m[3],+m[2]-1,+m[1]); if (!isNaN(d)&&d.getMonth()===+m[2]-1) return d; }
    return null;
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setRawInput(val);
    setInputError('');
    if (!val.trim()) { onChange({ target: { name, value: '' } }); return; }
    const parsed = parseTyped(val);
    if (parsed) {
      const y = parsed.getFullYear(), mo = String(parsed.getMonth()+1).padStart(2,'0'), dd = String(parsed.getDate()).padStart(2,'0');
      onChange({ target: { name, value: `${y}-${mo}-${dd}` } });
      setCurrentMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  };

  const handleTextBlur = () => {
    if (!rawInput.trim()) { setInputError(''); return; }
    if (!parseTyped(rawInput)) {
      setInputError('Invalid date — use DD/MM/YYYY or YYYY-MM-DD');
    } else {
      setInputError('');
      setRawInput(formatDateDisplay(value));
    }
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
    onChange({ target: { name, value: formatted } });
    setIsOpen(false);
    setInputError('');
    setTimeout(() => {
      const activeEl = containerRef.current?.querySelector('input');
      if (activeEl) {
        focusNextElement(activeEl);
      }
    }, 50);
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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={rawInput}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onFocus={() => setIsOpen(true)}
          className={`form-input datepicker-display-input ${isOpen ? 'active' : ''}`}
          style={{
            width: '100%',
            paddingRight: '40px',
            borderColor: inputError ? '#ef4444' : isOpen ? 'var(--clr-accent)' : 'var(--clr-border)',
            boxShadow: inputError ? '0 0 0 3px rgba(239,68,68,0.12)' : isOpen ? 'var(--shadow-focus)' : 'none',
            transition: 'all var(--transition-base)'
          }}
        />
        <CalendarIcon
          size={16}
          onClick={() => setIsOpen(v => !v)}
          style={{
            position: 'absolute',
            right: '14px',
            color: inputError ? '#ef4444' : isOpen ? 'var(--clr-accent)' : 'var(--clr-text-muted)',
            transform: isOpen ? 'scale(1.15) translateY(-1px)' : 'scale(1) translateY(0)',
            transition: 'all var(--transition-base)',
            cursor: 'pointer'
          }}
        />
      </div>
      {inputError && (
        <small style={{ color: '#ef4444', fontSize: '0.71rem', marginTop: '3px', display: 'block' }}>{inputError}</small>
      )}

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

// --- Custom Clock TimePicker ---
const TimePicker = ({ value, onChange, name, placeholder = "Select Time" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse initial 24h value to 12h state
  let initHour = 9;
  let initMin = 0;
  let initAmPm = 'AM';

  if (value) {
    const [h, m] = value.split(':');
    let hr = parseInt(h);
    initMin = parseInt(m);
    if (hr >= 12) {
      initAmPm = 'PM';
      if (hr > 12) hr -= 12;
    } else if (hr === 0) {
      hr = 12;
    }
    initHour = hr;
  }

  const [hour, setHour] = useState(initHour);
  const [minute, setMinute] = useState(initMin);
  const [ampm, setAmPm] = useState(initAmPm);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeChange = (h, m, ap) => {
    let hr24 = h;
    if (ap === 'PM' && h !== 12) hr24 += 12;
    if (ap === 'AM' && h === 12) hr24 = 0;

    const hrStr = String(hr24).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');

    onChange({ target: { name, value: `${hrStr}:${minStr}` } });
  };

  const handleHourSelect = (h) => {
    setHour(h);
    handleTimeChange(h, minute, ampm);
  };

  const handleMinuteSelect = (m) => {
    setMinute(m);
    handleTimeChange(hour, m, ampm);
  };

  const handleAmPmSelect = (ap) => {
    setAmPm(ap);
    handleTimeChange(hour, minute, ap);
  };

  const formatDisplay = () => {
    if (!value) return '';
    return `${hour}:${String(minute).padStart(2, '0')} ${ampm}`;
  };

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
          placeholder={placeholder}
          value={formatDisplay()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          className={`form-input datepicker-display-input ${isOpen ? 'active' : ''}`}
          style={{
            width: '100%',
            cursor: 'pointer',
            paddingRight: '40px',
            borderColor: isOpen ? 'var(--clr-accent)' : 'var(--clr-border)',
            boxShadow: isOpen ? 'var(--shadow-focus)' : 'none',
            transition: 'all var(--transition-base)'
          }}
        />
        <Clock
          size={16}
          style={{
            position: 'absolute',
            right: '14px',
            color: isOpen ? 'var(--clr-accent)' : 'var(--clr-text-muted)',
            transform: isOpen ? 'scale(1.15) rotate(15deg)' : 'scale(1) rotate(0deg)',
            transition: 'all var(--transition-base)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {isOpen && (
        <div className="datepicker-popover glass-strong" style={{ width: '280px', padding: '1rem', zIndex: 1000 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => handleAmPmSelect('AM')}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: ampm === 'AM' ? '#0f172a' : '#f8fafc', color: ampm === 'AM' ? '#fff' : '#0f172a', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all var(--transition-base)' }}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleAmPmSelect('PM')}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', background: ampm === 'PM' ? '#0f172a' : '#f8fafc', color: ampm === 'PM' ? '#fff' : '#0f172a', border: '1px solid #e2e8f0', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all var(--transition-base)' }}
            >
              PM
            </button>
          </div>

          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hour</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '0.85rem' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => handleHourSelect(h)}
                style={{
                  padding: '6px 0',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: hour === h ? '#0f172a' : 'transparent',
                  color: hour === h ? '#fff' : '#0f172a',
                  border: hour === h ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {h}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Minute</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '0.85rem' }}>
            {[0, 15, 30, 45].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => handleMinuteSelect(m)}
                style={{
                  padding: '6px 0',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: minute === m ? '#0f172a' : 'transparent',
                  color: minute === m ? '#fff' : '#0f172a',
                  border: minute === m ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {String(m).padStart(2, '0')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setTimeout(() => {
                const activeEl = containerRef.current?.querySelector('input');
                if (activeEl) {
                  focusNextElement(activeEl);
                }
              }, 50);
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all var(--transition-base)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#000000'}
            onMouseOut={(e) => e.currentTarget.style.background = '#0f172a'}
          >
            Confirm Time
          </button>
        </div>
      )}
    </div>
  );
};

// --- Premium Toast Notification Component ---
const PremiumToast = ({ toast, onClose }) => {
  if (!toast || !toast.text) return null;

  const Icon = toast.type === 'error' ? XCircle : CheckCircle2;

  return createPortal(
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
    </div>,
    document.body
  );
};

// --- Premium Number Stepper Component ---
const StepperInput = ({ value, onChange, name, min = 0, max = Infinity, placeholder = "" }) => {
  const handleDecrement = () => {
    const val = Math.max(min, (parseInt(value) || 0) - 1);
    onChange({ target: { name, value: val, type: 'number' } });
  };
  const handleIncrement = () => {
    const val = Math.min(max, (parseInt(value) || 0) + 1);
    onChange({ target: { name, value: val, type: 'number' } });
  };
  const handleChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = '';
    onChange({ target: { name, value: val, type: 'number' } });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)', borderRadius: '10px', overflow: 'hidden', height: '42px', transition: 'all var(--transition-base)' }}>
      <button
        type="button"
        onClick={handleDecrement}
        style={{ width: '42px', height: '100%', background: 'transparent', border: 'none', borderRight: '1.5px solid var(--clr-border)', color: 'var(--clr-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-base)' }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--clr-surface-2)'; e.currentTarget.style.color = 'var(--clr-heading)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--clr-text-muted)'; }}
      >
        <Minus size={16} />
      </button>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ flex: 1, height: '100%', border: 'none', textAlign: 'center', background: 'transparent', fontWeight: 600, color: 'var(--clr-text-heading)', fontSize: '0.9rem', outline: 'none' }}
      />
      <button
        type="button"
        onClick={handleIncrement}
        style={{ width: '42px', height: '100%', background: 'transparent', border: 'none', borderLeft: '1.5px solid var(--clr-border)', color: 'var(--clr-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--transition-base)' }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--clr-surface-2)'; e.currentTarget.style.color = 'var(--clr-heading)'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--clr-text-muted)'; }}
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateRoute = location.pathname.includes('/create');
  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');
  const showModalParam = queryParams.get('modal') === 'true';

  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEventTypeModal, setShowEventTypeModal] = useState(false);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!formData.roundConfig) {
      setFormData(prev => ({
        ...prev,
        roundConfig: [{ roundNumber: 1, name: 'Round 1', maxAdvance: 0, evaluationType: 'admin', criteria: [{ name: 'Creativity & Innovation', maxScore: 20 }, { name: 'Technical Execution', maxScore: 20 }, { name: 'Presentation Skills', maxScore: 20 }, { name: 'Problem Solving', maxScore: 20 }, { name: 'Team Collaboration', maxScore: 20 }], assignedJudges: [] }]
      }));
    }
  }, [formData.roundConfig]);

  const [step, setStep] = useState(1);
  const [roundPage, setRoundPage] = useState(0); // 0-indexed page for round config pagination
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { eventId, type, message, actionFn }

  const [coordName, setCoordName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordRole, setCoordRole] = useState('Lead Coordinator');

  const [feedbackTemplates, setFeedbackTemplates] = useState([]);
  const lastCheckedText = useRef('');

  useEffect(() => {
    fetchUser();
    fetchEvents();
    fetchFeedbackTemplates();
  }, []);

  const fetchFeedbackTemplates = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/feedback/templates`, { withCredentials: true });
      if (res.data.success) {
        setFeedbackTemplates(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching feedback templates:', err);
    }
  };

  // Route-based state sync
  useEffect(() => {
    if (isCreateRoute) {
      setShowCreateForm(true);
      setShowEventTypeModal(false);
      if (typeParam && formData.eventType !== typeParam) {
        setFormData({ ...EMPTY_FORM, eventType: typeParam });
        setStep(1);
      }
    } else {
      setShowCreateForm(false);
      if (showModalParam) {
        setShowEventTypeModal(true);
        // Clear param without reload
        navigate('/admin/events', { replace: true });
      }
    }
  }, [isCreateRoute, typeParam, showModalParam, navigate]);

  // Fetch live finance details for wizard step 7
  useEffect(() => {
    if (step === 7 && showCreateForm && formData.approvalDetails && (!formData.approvalDetails.proposedBudget || formData.approvalDetails.proposedBudget === '1,20,000')) {
      axios.get(`${API_URL}/api/finance`, { withCredentials: true })
        .then(res => {
          if (res.data && res.data.success && res.data.finance) {
            const { allottedBudget, totalSpent, available } = res.data.finance;
            setFormData(prev => ({
              ...prev,
              approvalDetails: {
                ...(prev.approvalDetails || {}),
                proposedBudget: allottedBudget ? allottedBudget.toLocaleString('en-IN') : '1,20,000',
                actualSpentTillDate: totalSpent ? totalSpent.toLocaleString('en-IN') : '0',
                availableBudget: available ? available.toLocaleString('en-IN') : '1,20,000'
              }
            }));
          }
        })
        .catch(err => console.warn('Failed to fetch live finance details for wizard step 7:', err));
    }
  }, [step, showCreateForm]);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showEventTypeModal || showCreateForm || confirmAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showEventTypeModal, showCreateForm, confirmAction]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [eventsRes, venuesRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/events`, { withCredentials: true }),
        axios.get(`${API_URL}/api/venues`, { withCredentials: true })
      ]);
      if (eventsRes.data.success) setEvents(eventsRes.data.events);
      if (venuesRes.data.success) setVenues(venuesRes.data.venues);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Access Denied. Admin privileges required.' : 'Failed to load data.');
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

    if (name === 'rounds') {
      setFormData(prev => {
        let newConfig = [...(prev.roundConfig || [])];
        if (val > newConfig.length) {
          for (let i = newConfig.length; i < val; i++) {
            newConfig.push({ roundNumber: i + 1, name: `Round ${i + 1}`, maxAdvance: 0, evaluationType: 'admin', criteria: [{ name: 'Creativity & Innovation', maxScore: 20 }, { name: 'Technical Execution', maxScore: 20 }, { name: 'Presentation Skills', maxScore: 20 }, { name: 'Problem Solving', maxScore: 20 }, { name: 'Team Collaboration', maxScore: 20 }], assignedJudges: [] });
          }
        } else if (val < newConfig.length) {
          newConfig = newConfig.slice(0, val);
        }
        return { ...prev, rounds: val, roundConfig: newConfig };
      });
      setRoundPage(0);
      return;
    }

    setFormData(f => ({ ...f, [name]: val }));
  };

  const handleRoundConfigChange = (rIdx, field, value) => {
    setFormData(prev => {
      const newConfig = [...(prev.roundConfig || [])];
      newConfig[rIdx] = { ...newConfig[rIdx], [field]: value };
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleAddCriteria = (rIdx) => {
    setFormData(prev => {
      const newConfig = [...(prev.roundConfig || [])];
      const rc = { ...newConfig[rIdx] };
      rc.criteria = [...(rc.criteria || []), { name: '', maxScore: 10 }];
      newConfig[rIdx] = rc;
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleCriteriaChange = (rIdx, cIdx, field, value) => {
    setFormData(prev => {
      const newConfig = [...(prev.roundConfig || [])];
      const rc = { ...newConfig[rIdx] };
      const cr = [...(rc.criteria || [])];
      cr[cIdx] = { ...cr[cIdx], [field]: value };
      rc.criteria = cr;
      newConfig[rIdx] = rc;
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleRemoveCriteria = (rIdx, cIdx) => {
    setFormData(prev => {
      const newConfig = [...(prev.roundConfig || [])];
      const rc = { ...newConfig[rIdx] };
      const cr = (rc.criteria || []).filter((_, i) => i !== cIdx);
      rc.criteria = cr;
      newConfig[rIdx] = rc;
      return { ...prev, roundConfig: newConfig };
    });
  };

  const handleWizApprovalFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      approvalDetails: {
        ...(prev.approvalDetails || {}),
        [field]: value
      }
    }));
  };

  const handleWizBudgetItemChange = (idx, field, value) => {
    setFormData(prev => {
      const details = prev.approvalDetails || {};
      const items = [...(details.budgetItems || [])];
      items[idx] = { ...items[idx], [field]: value };

      const sum = items.reduce((acc, item) => {
        const cost = parseFloat((item.totalCost || '').replace(/,/g, ''));
        return acc + (isNaN(cost) ? 0 : cost);
      }, 0);

      return {
        ...prev,
        approvalDetails: {
          ...details,
          budgetItems: items,
          nowRequested: sum > 0 ? sum.toLocaleString('en-IN') : details.nowRequested
        }
      };
    });
  };

  const addWizBudgetItem = () => {
    setFormData(prev => {
      const details = prev.approvalDetails || {};
      const items = [...(details.budgetItems || [])];
      return {
        ...prev,
        approvalDetails: {
          ...details,
          budgetItems: [...items, { name: '', quantity: '', ratePerUnit: '', totalCost: '', modeOfArrangement: '', remarks: '' }]
        }
      };
    });
  };

  const removeWizBudgetItem = (idx) => {
    setFormData(prev => {
      const details = prev.approvalDetails || {};
      const items = (details.budgetItems || []).filter((_, i) => i !== idx);

      const sum = items.reduce((acc, item) => {
        const cost = parseFloat((item.totalCost || '').replace(/,/g, ''));
        return acc + (isNaN(cost) ? 0 : cost);
      }, 0);

      return {
        ...prev,
        approvalDetails: {
          ...details,
          budgetItems: items,
          nowRequested: sum > 0 ? sum.toLocaleString('en-IN') : ''
        }
      };
    });
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

  const handleResourceImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 400; // Profile pic size
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
        setFormData(f => ({ ...f, resourcePersonImage: base64Str }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleWizardKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Don't intercept if target is a textarea or a button
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
        return;
      }
      // Don't intercept if target is inside an active custom select dropdown
      if (e.target.closest('.custom-select-dropdown') || e.target.classList.contains('custom-select-trigger')) {
        return;
      }

      // Find all focusable elements in the wizard container
      const focusableSelector = 'input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]:not([disabled]), .custom-select-trigger:not(.disabled)';
      const container = e.currentTarget;
      const focusables = Array.from(container.querySelectorAll(focusableSelector));

      // Filter visible
      const visibleFocusables = focusables.filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
      });

      const index = visibleFocusables.indexOf(e.target);
      if (index !== -1 && index < visibleFocusables.length - 1) {
        e.preventDefault();
        visibleFocusables[index + 1].focus();
      } else if (index === visibleFocusables.length - 1) {
        // Last element, hit Next Step
        const nextBtn = container.querySelector('.ae-wizard-footer button.btn-primary');
        if (nextBtn && !nextBtn.disabled) {
          e.preventDefault();
          nextBtn.click();
        }
      }
    }
  };

  const handleNextStep = () => {
    const isMacro = formData.eventType === 'macro';
    const totalSteps = isMacro ? 2 : 8;

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
    if (!isMacro && step === 7) {
      const details = formData.approvalDetails || {};
      if (details.internalParticipants === undefined || details.internalParticipants === null || String(details.internalParticipants).trim() === '') {
        showToast('Internal participants count is required.', 'error');
        return;
      }
      if (details.externalParticipants === undefined || details.externalParticipants === null || String(details.externalParticipants).trim() === '') {
        showToast('External participants count is required.', 'error');
        return;
      }
      if (!details.nowRequested || String(details.nowRequested).trim() === '') {
        showToast('Budget details / requested amount is required. Add at least one item cost.', 'error');
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


      const submitData = {
        ...formData,
        roundConfig: formData.roundConfig
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

  // ── Approval Generation ──────────────────────────────────────
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalTargetEvent, setApprovalTargetEvent] = useState(null);
  const [approvalData, setApprovalData] = useState({
    date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    internalParticipants: '',
    externalParticipants: '',
    proposedBudget: '1,20,000',
    actualSpentTillDate: '0',
    availableBudget: '1,20,000',
    nowRequested: '',
    advanceNote: '',
    budgetItems: [
      { name: 'Certificates (Winners)', quantity: '', ratePerUnit: '15', totalCost: '', modeOfArrangement: 'NIA Printing', remarks: 'Final Round Event Winners' },
      { name: 'Cash prize (winners)', quantity: '', ratePerUnit: '', totalCost: '', modeOfArrangement: 'Voucher', remarks: '1st-1000/-, 2nd-750/-, 3rd-500/-' },
      { name: 'Stationery & Printing', quantity: '-', ratePerUnit: '-', totalCost: '', modeOfArrangement: 'NIA Printing', remarks: '-' },
    ]
  });

  const openApprovalModal = async (ev) => {
    setApprovalTargetEvent(ev || null);
    setShowApprovalModal(true);

    // Set basic defaults first
    setApprovalData(prev => ({
      ...prev,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      proposedBudget: '1,20,000',
      actualSpentTillDate: '0',
      availableBudget: '1,20,000',
      nowRequested: '',
      advanceNote: ''
    }));

    try {
      const res = await axios.get(`${API_URL}/api/finance`, { withCredentials: true });
      if (res.data && res.data.success && res.data.finance) {
        const { allottedBudget, totalSpent, available } = res.data.finance;
        setApprovalData(prev => ({
          ...prev,
          proposedBudget: allottedBudget ? allottedBudget.toLocaleString('en-IN') : '1,20,000',
          actualSpentTillDate: totalSpent ? totalSpent.toLocaleString('en-IN') : '0',
          availableBudget: available ? available.toLocaleString('en-IN') : '1,20,000'
        }));
      }
    } catch (err) {
      console.error('Error fetching finance details for approval modal:', err);
    }
  };

  const handleApprovalFieldChange = (field, value) => setApprovalData(prev => ({ ...prev, [field]: value }));

  const handleBudgetItemChange = (idx, field, value) => {
    setApprovalData(prev => {
      const items = [...prev.budgetItems];
      items[idx] = { ...items[idx], [field]: value };

      const sum = items.reduce((acc, item) => {
        const cost = parseFloat((item.totalCost || '').replace(/,/g, ''));
        return acc + (isNaN(cost) ? 0 : cost);
      }, 0);

      return {
        ...prev,
        budgetItems: items,
        nowRequested: sum > 0 ? sum.toLocaleString('en-IN') : prev.nowRequested
      };
    });
  };

  const addBudgetItem = () => setApprovalData(prev => ({ ...prev, budgetItems: [...prev.budgetItems, { name: '', quantity: '', ratePerUnit: '', totalCost: '', modeOfArrangement: '', remarks: '' }] }));
  const removeBudgetItem = (idx) => setApprovalData(prev => {
    const items = prev.budgetItems.filter((_, i) => i !== idx);
    const sum = items.reduce((acc, item) => {
      const cost = parseFloat((item.totalCost || '').replace(/,/g, ''));
      return acc + (isNaN(cost) ? 0 : cost);
    }, 0);
    return {
      ...prev,
      budgetItems: items,
      nowRequested: sum > 0 ? sum.toLocaleString('en-IN') : ''
    };
  });

  const generateApprovalPDF = () => {
    const ev = approvalTargetEvent || formData;
    const details = ev.approvalDetails || approvalData;
    const submissionDate = details.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentW = pageW - margin * 2;
    let y = 15;

    const centerText = (text, yPos, size = 11, style = 'bold') => { doc.setFontSize(size); doc.setFont('times', style); doc.text(text, pageW / 2, yPos, { align: 'center' }); };
    const line = (yPos) => { doc.setLineWidth(0.3); doc.line(margin, yPos, pageW - margin, yPos); };

    centerText('Dr. Mahalingam College of Engineering and Technology', y, 12); y += 6;
    centerText('Department of Electronics and Communication Engineering', y, 11); y += 6;
    centerText('Department Association \u2013 SPECTRUM', y, 11); y += 5;
    line(y); y += 7;

    doc.setFontSize(10); doc.setFont('times', 'bold');
    doc.text('Note Submitted to the Principal:', margin, y);
    doc.text(`Date: ${submissionDate}`, pageW - margin, y, { align: 'right' });
    y += 3; line(y); y += 8;

    const eventTitle = ev.title || 'Event';
    const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
    const subjectLine = `Proposal for Conducting \u201c${eventTitle}\u201d \u2013 ${dateStr} \u2013 Approval Requested`;
    const subjectLines = doc.splitTextToSize(subjectLine, contentW - 20);
    doc.setFont('times', 'bold'); doc.text('Subject:', margin, y);
    doc.setFont('times', 'normal'); doc.text(subjectLines[0], margin + 22, y);
    if (subjectLines.length > 1) { y += 5; doc.text(subjectLines.slice(1).join(' '), margin, y); }
    y += 8;

    const internalP = parseInt(details.internalParticipants) || 0;
    const externalP = parseInt(details.externalParticipants) || 0;
    const totalP = internalP + externalP;
    const bodyText = `We propose to organize \u201c${eventTitle}\u201d, a technical event aimed at fostering innovation, enhancing presentation skills, and promoting teamwork among II, III, and IV Year students. Scheduled for ${dateStr}${ev.location ? ', at ' + ev.location : ''}, from 9:30 a.m. to 4:30 p.m., the event will be conducted under the banner of the ECE Department Association \u2013 SPECTRUM.`;
    doc.setFontSize(10); doc.setFont('times', 'normal');
    const bodyLines = doc.splitTextToSize(bodyText, contentW);
    doc.text(bodyLines, margin, y); y += bodyLines.length * 5 + 6;

    doc.setFont('times', 'bold'); doc.setFontSize(10);
    doc.text('Participant Details:', margin, y); y += 4;
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [['Event Details', 'Internal Participants', 'External Participants from other colleges', 'Total']], body: [[`No. of participants expected`, String(internalP || '-'), String(externalP || '-'), String(totalP || '-')]], styles: { font: 'times', fontSize: 9, cellPadding: 3, halign: 'center', valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineColor: [0, 0, 0], lineWidth: 0.3 }, bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0] }, columnStyles: { 0: { halign: 'left', cellWidth: 65 }, 1: { cellWidth: 32 }, 2: { cellWidth: 55 }, 3: { cellWidth: 25 } }, theme: 'grid' });
    y = doc.lastAutoTable.finalY + 8;

    doc.setFont('times', 'bold'); doc.text('Budget for the above program:', margin, y); y += 5;
    doc.text('Proposed Expenses for the program', margin, y); y += 4;
    const budgetRows = (details.budgetItems || []).map((item, i) => [String(i + 1), item.name, item.quantity, item.ratePerUnit, item.totalCost, item.modeOfArrangement, item.remarks]);
    const grandTotal = (details.budgetItems || []).reduce((acc, item) => { const n = parseFloat((item.totalCost || '').replace(/,/g, '')); return acc + (isNaN(n) ? 0 : n); }, 0);
    budgetRows.push(['', '', '', { content: 'Total', styles: { fontStyle: 'bold' } }, { content: grandTotal ? grandTotal.toLocaleString('en-IN') + '/-' : '', styles: { fontStyle: 'bold' } }, '', '']);
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [['S.No.', 'Name of the item', 'Quantity', 'Rate /unit', 'Total cost Rs.', 'Mode of arrangement', 'Remarks']], body: budgetRows, styles: { font: 'times', fontSize: 8.5, cellPadding: 2.5, valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 }, bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0] }, columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 45 }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 22, halign: 'center' }, 4: { cellWidth: 22, halign: 'center' }, 5: { cellWidth: 30, halign: 'center' }, 6: { cellWidth: 23 } }, theme: 'grid' });
    y = doc.lastAutoTable.finalY + 5;

    if (details.advanceNote) { doc.setFont('times', 'bold'); doc.setFontSize(9.5); const noteLines = doc.splitTextToSize(`Note: ${details.advanceNote}`, contentW); doc.text(noteLines, margin, y); y += noteLines.length * 5 + 4; }

    y += 4; doc.setFont('times', 'bold'); doc.setFontSize(10);
    doc.text('Budget for the FY 2025-26:', margin, y); y += 4;
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [['Particular', 'Proposed Budget Rs.', 'Actual Spent Till date Rs.', 'Available Budget Rs.', 'Now Requested']], body: [['5F. Institute Innovation cell activities\nActivities included for organizing guest and competitive event training program.', `Rs.${details.proposedBudget}/-`, `Rs.${details.actualSpentTillDate}/-`, `Rs.${details.availableBudget}/-\ntoday`, `Rs.${details.nowRequested}/-`]], styles: { font: 'times', fontSize: 9, cellPadding: 3, valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.3 }, bodyStyles: { lineColor: [0, 0, 0], lineWidth: 0.3, textColor: [0, 0, 0] }, columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 28, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' }, 3: { cellWidth: 30, halign: 'center' }, 4: { cellWidth: 22, halign: 'center' } }, theme: 'grid' });
    y = doc.lastAutoTable.finalY + 14;

    const sig1 = ['Spectrum Incharge', 'PC/ECE', 'HoD/ECE'];
    const sigX = [margin, pageW / 2, pageW - margin];
    const sigAlign = ['left', 'center', 'right'];
    doc.setFont('times', 'bold'); doc.setFontSize(10);
    sig1.forEach((s, i) => doc.text(s, sigX[i], y, { align: sigAlign[i] })); y += 22;
    ['Associate Dean \u2013 SR', 'Vice Principal', 'Principal'].forEach((s, i) => doc.text(s, sigX[i], y, { align: sigAlign[i] }));

    doc.save(`approval_${(ev.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`);
    showToast('Approval document generated!', 'success');
    setShowApprovalModal(false);
  };

  const generateApprovalWord = () => {
    const ev = approvalTargetEvent || formData;
    const details = ev.approvalDetails || approvalData;
    const submissionDate = details.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const eventTitle = ev.title || 'Event';
    const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
    const internalP = parseInt(details.internalParticipants) || 0;
    const externalP = parseInt(details.externalParticipants) || 0;
    const totalP = internalP + externalP;

    const budgetRows = (details.budgetItems || []).map((item, i) => `
      <tr>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid black; padding: 6px;">${item.name || ''}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${item.quantity || ''}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${item.ratePerUnit || ''}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${item.totalCost || ''}</td>
        <td style="border: 1px solid black; padding: 6px; text-align: center;">${item.modeOfArrangement || ''}</td>
        <td style="border: 1px solid black; padding: 6px;">${item.remarks || ''}</td>
      </tr>
    `).join('');

    const grandTotal = (details.budgetItems || []).reduce((acc, item) => {
      const n = parseFloat((item.totalCost || '').replace(/,/g, ''));
      return acc + (isNaN(n) ? 0 : n);
    }, 0);

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Approval Note</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.3;
            margin: 1in;
          }
          .header-title {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .header-subtitle {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .divider {
            border-top: 1.5px solid black;
            margin-bottom: 15px;
          }
          .subject-row {
            margin-top: 15px;
            margin-bottom: 15px;
            font-size: 11pt;
          }
          .subject-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
          }
          .body-paragraph {
            text-indent: 0.5in;
            text-align: justify;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          th {
            border: 1px solid black;
            padding: 6px;
            font-weight: bold;
            background-color: #f2f2f2;
            text-align: center;
          }
          td {
            border: 1px solid black;
            padding: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header-title">Dr. Mahalingam College of Engineering and Technology</div>
        <div class="header-subtitle">Department of Electronics and Communication Engineering</div>
        <div class="header-subtitle">Department Association &ndash; SPECTRUM</div>
        <div class="divider"></div>

        <table style="width: 100%; border: none; margin-bottom: 5px;">
          <tr style="border: none;">
            <td style="border: none; padding: 0; font-weight: bold;">Note Submitted to the Principal:</td>
            <td style="border: none; padding: 0; text-align: right; font-weight: bold;">Date: ${submissionDate}</td>
          </tr>
        </table>
        <div style="border-top: 1px solid black; margin-bottom: 15px;"></div>

        <div class="subject-row">
          <span class="subject-label">Subject:</span>
          <span>Proposal for Conducting &ldquo;${eventTitle}&rdquo; &ndash; ${dateStr} &ndash; Approval Requested</span>
        </div>

        <div class="body-paragraph">
          We propose to organize &ldquo;${eventTitle}&rdquo;, a technical event aimed at fostering innovation, enhancing presentation skills, and promoting teamwork among II, III, and IV Year students. Scheduled for ${dateStr}${ev.location ? ', at ' + ev.location : ''}, from 9:30 a.m. to 4:30 p.m., the event will be conducted under the banner of the ECE Department Association &ndash; SPECTRUM.
        </div>

        <div style="font-weight: bold; margin-bottom: 5px;">Participant Details:</div>
        <table>
          <thead>
            <tr>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Event Details</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Internal Participants</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">External Participants from other colleges</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 6px;">No. of participants expected</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">${internalP || '-'}</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">${externalP || '-'}</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">${totalP || '-'}</td>
            </tr>
          </tbody>
        </table>

        <div style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Budget for the above program:</div>
        <div style="font-weight: bold; margin-bottom: 5px;">Proposed Expenses for the program</div>
        <table>
          <thead>
            <tr>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 5%;">S.No.</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 35%;">Name of the item</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 10%;">Quantity</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 10%;">Rate /unit</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 12%;">Total cost Rs.</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 18%;">Mode of arrangement</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 10%;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${budgetRows}
            <tr>
              <td style="border: 1px solid black; padding: 6px;"></td>
              <td style="border: 1px solid black; padding: 6px;"></td>
              <td style="border: 1px solid black; padding: 6px;"></td>
              <td style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: center;">Total</td>
              <td style="border: 1px solid black; padding: 6px; font-weight: bold; text-align: center;">${grandTotal ? grandTotal.toLocaleString('en-IN') + '/-' : '-'}</td>
              <td style="border: 1px solid black; padding: 6px;"></td>
              <td style="border: 1px solid black; padding: 6px;"></td>
            </tr>
          </tbody>
        </table>

        ${details.advanceNote ? `
          <div style="font-weight: bold; margin-top: 10px; margin-bottom: 15px;">
            Note: ${details.advanceNote}
          </div>
        ` : ''}

        <div style="font-weight: bold; margin-top: 15px; margin-bottom: 5px;">Budget for the FY 2025-26:</div>
        <table>
          <thead>
            <tr>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center; width: 40%;">Particular</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Proposed Budget Rs.</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Actual Spent Till date Rs.</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Available Budget Rs.</th>
              <th style="border: 1px solid black; padding: 6px; font-weight: bold; background-color: #f2f2f2; text-align: center;">Now Requested</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 6px;">5F. Institute Innovation cell activities<br/>Activities included for organizing guest and competitive event training program.</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">Rs.${details.proposedBudget}/-</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">Rs.${details.actualSpentTillDate}/-</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">Rs.${details.availableBudget}/-<br/>today</td>
              <td style="border: 1px solid black; padding: 6px; text-align: center;">Rs.${details.nowRequested}/-</td>
            </tr>
          </tbody>
        </table>

        <br/><br/>
        <table style="width: 100%; border: none; margin-top: 40px;">
          <tr style="border: none;">
            <td style="border: none; padding: 0; font-weight: bold; width: 33%;">Spectrum Incharge</td>
            <td style="border: none; padding: 0; font-weight: bold; text-align: center; width: 33%;">PC/ECE</td>
            <td style="border: none; padding: 0; font-weight: bold; text-align: right; width: 33%;">HoD/ECE</td>
          </tr>
          <tr style="border: none; height: 60px;">
            <td colspan="3" style="border: none; padding: 0; height: 60px;"></td>
          </tr>
          <tr style="border: none;">
            <td style="border: none; padding: 0; font-weight: bold;">Associate Dean &ndash; SR</td>
            <td style="border: none; padding: 0; font-weight: bold; text-align: center;">Vice Principal</td>
            <td style="border: none; padding: 0; font-weight: bold; text-align: right;">Principal</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `approval_${(ev.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Word document generated!', 'success');
    setShowApprovalModal(false);
  };
  // ─────────────────────────────────────────────────────────────

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
                  navigate('/admin/events');
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
      {showEventTypeModal && createPortal(
        <div className="ae-type-modal-overlay animate-fade-in" style={{ zIndex: 1100 }}>
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '24px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '580px',
            position: 'relative',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxSizing: 'border-box'
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
                        setShowEventTypeModal(false);
                        navigate(`/admin/events/create?type=${item.id}`);
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
        </div>,
        document.body
      )}

      {/* Wizard Overlay Form */}
      {showCreateForm && createPortal(
        <div className="ae-wizard-overlay animate-fade-in">
          <div className="ae-wizard-container-new">
            {/* Stepper Panel (Left Side) */}
            <div className="ae-wizard-stepper-panel">
              <div className="ae-wizard-stepper-header">
                <span className="ae-wizard-stepper-brand">Event Wizard</span>
                <span className="ae-wizard-stepper-subbrand">Configure your event step-by-step</span>
              </div>

              <div className="ae-wizard-stepper-new">
                {(formData.eventType === 'macro' ? MACRO_WIZARD_STEPS : WIZARD_STEPS).map((s, idx) => {
                  const stepNum = idx + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;

                  // Helper function to get step icons
                  const getStepIcon = (num, isMac) => {
                    if (isMac) {
                      return num === 1 ? FileText : Rocket;
                    }
                    const icons = {
                      1: FileText,
                      2: Compass,
                      3: Users,
                      4: Sliders,
                      5: UserPlus,
                      6: Lock,
                      7: IndianRupee,
                      8: Rocket
                    };
                    return icons[num] || FileText;
                  };

                  const IconComp = getStepIcon(stepNum, formData.eventType === 'macro');

                  return (
                    <div
                      key={idx}
                      className={`ae-stepper-item-new ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => {
                        if (isCompleted || stepNum < step) {
                          setStep(stepNum);
                        }
                      }}
                      style={{ cursor: (isCompleted || stepNum < step) ? 'pointer' : 'default' }}
                    >
                      <div className={`ae-stepper-icon-box-new ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                        <IconComp size={16} />
                      </div>
                      <div className="ae-stepper-text-box-new">
                        <span className="ae-stepper-item-title-new">{s.name}</span>
                        <span className="ae-stepper-item-desc-new">{s.desc}</span>
                      </div>
                      {isActive && (
                        <div className="ae-stepper-active-indicator-new">
                          <div className="ae-stepper-spinner-new"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Illustration added to Stepper Panel */}
              <div className="ae-wizard-stepper-illustration-box">
                <img src={wizardIllustration} alt="Wizard illustration" className="ae-wizard-stepper-illustration" />
              </div>

              <div className="ae-wizard-stepper-footer">
                <button
                  type="button"
                  className="ae-stepper-back-btn"
                  onClick={() => {
                    if (window.confirm('Discard event draft? Your progress will be lost.')) {
                      navigate('/admin/events');
                    }
                  }}
                >
                  <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Discard draft
                </button>
              </div>
            </div>

            {/* Wizard Card (Right Side) */}
            <div className="ae-wizard-card-new" onKeyDown={handleWizardKeyDown}>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Discard event draft? Your progress will be lost.')) {
                    navigate('/admin/events');
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
                  <div className="ae-wizard-hero-upload" style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', background: '#f8fafc', padding: '0.85rem', borderRadius: '16px', border: '1px solid #cbd5e1', marginBottom: '0.85rem' }}>
                    <div className="ae-wizard-hero-preview" style={{ width: '90px', height: '60px', borderRadius: '12px', overflow: 'hidden', background: '#e2e8f0', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Hero preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ opacity: 0.3, color: '#475569' }}><Plus size={24} /></div>
                      )}
                    </div>
                    <div className="ae-wizard-hero-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <span className="ae-wizard-hero-label" style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>Pick your event's hero image</span>
                      <span className="ae-wizard-hero-desc" style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.35' }}>Upload a local file for your event's hero image.</span>
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

                  <div style={{ display: 'grid', gridTemplateColumns: formData.eventType === 'macro' ? '1fr' : (events.filter(e => e.eventType === 'macro').length > 0 ? '1.5fr 1fr 1fr' : '1.5fr 1fr'), gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
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
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Event Category *</label>
                        <Select className="form-select" name="category" value={formData.category || 'None'} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                          <option value="None">None</option>
                          <option value="Technical">Technical</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Non-Technical">Non-Technical</option>
                          <option value="Guest Lecture">Guest Lecture</option>
                        </Select>
                      </div>
                    )}

                    {formData.eventType !== 'macro' && events.filter(e => e.eventType === 'macro').length > 0 && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Parent Macro Event</label>
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


                  {formData.eventType === 'macro' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
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

                  {formData.eventType !== 'macro' && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Date *</label>
                          <DatePicker value={formData.date} onChange={handleInputChange} />
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Session Window *</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <TimePicker
                                name="session-start"
                                value={(formData.session && formData.session !== 'none' && formData.session.includes(' - ')) ? formData.session.split(' - ')[0] : '09:00'}
                                onChange={(e) => {
                                  const end = (formData.session && formData.session !== 'none' && formData.session.includes(' - ')) ? formData.session.split(' - ')[1] : '13:00';
                                  handleInputChange({ target: { name: 'session', value: `${e.target.value || '09:00'} - ${end}` } });
                                }}
                              />
                            </div>
                            <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.8rem' }}>TO</span>
                            <div style={{ flex: 1 }}>
                              <TimePicker
                                name="session-end"
                                value={(formData.session && formData.session !== 'none' && formData.session.includes(' - ')) ? formData.session.split(' - ')[1] : '13:00'}
                                onChange={(e) => {
                                  const start = (formData.session && formData.session !== 'none' && formData.session.includes(' - ')) ? formData.session.split(' - ')[0] : '09:00';
                                  handleInputChange({ target: { name: 'session', value: `${start} - ${e.target.value || '13:00'}` } });
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Location *</label>
                          <Select
                            name="location"
                            required
                            value={formData.location}
                            onChange={handleInputChange}
                            style={{ width: '100%', borderRadius: '10px' }}
                          >
                            <option value="" disabled>Select a Venue...</option>
                            {venues.map(v => (
                              <option key={v._id} value={v.name}>{v.name}</option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0, fontWeight: '600', color: '#334155' }}>Event Description <span style={{ color: '#ef4444' }}>*</span></label>
                    </div>
                    <textarea
                      className="form-textarea"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Description"
                      style={{ width: '100%', minHeight: '120px', borderRadius: '10px' }}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Resource Person */}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Designation</label>
                      <input
                        className="form-input"
                        type="text"
                        name="designation"
                        value={formData.designation || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., Professor, MIT"
                        style={{ width: '100%', borderRadius: '10px' }}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Resource Person Image</label>
                      <div style={{ position: 'relative', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1.5px dashed var(--clr-border)', background: 'var(--clr-surface)', height: '42px', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResourceImageUpload}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.85rem', color: formData.resourcePersonImage ? 'var(--clr-accent)' : 'var(--clr-text-muted)', fontWeight: formData.resourcePersonImage ? '600' : 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {formData.resourcePersonImage ? 'Image Uploaded ✓' : 'Click or Drag to Upload Image'}
                        </span>
                        {formData.resourcePersonImage && (
                          <button
                            type="button"
                            style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: 'var(--clr-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, resourcePersonImage: '' })); }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Team & Evaluation Limits */}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Max Team Size *</label>
                      <StepperInput
                        name="teamSizeLimit"
                        min={1}
                        max={10}
                        value={formData.teamSizeLimit}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Max Shortlisted Teams (0 = No Limit) *</label>
                      <StepperInput
                        name="maxShortlisted"
                        min={0}
                        value={formData.maxShortlisted || 0}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Number of Rounds *</label>
                      <StepperInput
                        name="rounds"
                        min={1}
                        max={10}
                        value={formData.rounds}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>Number of Winners *</label>
                      <StepperInput
                        name="numberOfWinners"
                        min={1}
                        value={formData.numberOfWinners}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '12px', display: 'block' }}>Attendance System Mode *</label>
                    <div className="ae-attendance-cards">
                      <div className={`ae-attendance-card ${formData.attendanceMode === 'student_scan' || !formData.attendanceMode ? 'active' : ''}`} onClick={() => handleInputChange({ target: { name: 'attendanceMode', value: 'student_scan' } })}>
                        <div className="ae-attendance-icon">
                          <img src={traditionalScanPana} alt="Traditional Scan" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '8px' }} />
                        </div>
                        <h4>Traditional</h4>
                        <p>Student scans Admin QR</p>
                        <div className="ae-attendance-radio"></div>
                      </div>
                      <div className={`ae-attendance-card ${formData.attendanceMode === 'admin_scan' ? 'active' : ''}`} onClick={() => handleInputChange({ target: { name: 'attendanceMode', value: 'admin_scan' } })}>
                        <div className="ae-attendance-icon">
                          <img src={speedyScanPana} alt="Speedy Scan" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '8px' }} />
                        </div>
                        <h4>Speedy</h4>
                        <p>Admin scans Student QR</p>
                        <div className="ae-attendance-radio"></div>
                      </div>
                      <div className={`ae-attendance-card ${formData.attendanceMode === 'both' ? 'active' : ''}`} onClick={() => handleInputChange({ target: { name: 'attendanceMode', value: 'both' } })}>
                        <div className="ae-attendance-icon">
                          <img src={flexibleScanPana} alt="Flexible Scan" style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '8px' }} />
                        </div>
                        <h4>Flexible</h4>
                        <p>Both methods enabled</p>
                        <div className="ae-attendance-radio"></div>
                      </div>
                    </div>
                  </div>
                </>
              )}


              {/* Step 4: Round Configurations */}
              {step === 4 && (() => {
                const rounds = formData.roundConfig || [];
                const totalRounds = rounds.length;
                const safeRoundPage = Math.min(roundPage, Math.max(0, totalRounds - 1));
                const rc = rounds[safeRoundPage];
                const rIdx = safeRoundPage;

                return (
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

                    {/* Round Pagination Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setRoundPage(p => Math.max(0, p - 1))}
                        disabled={safeRoundPage === 0}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safeRoundPage === 0 ? 'not-allowed' : 'pointer', opacity: safeRoundPage === 0 ? 0.4 : 1, color: '#475569' }}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'center' }}>
                        {rounds.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setRoundPage(i)}
                            style={{
                              background: i === safeRoundPage ? '#0f172a' : '#e2e8f0',
                              color: i === safeRoundPage ? '#ffffff' : '#64748b',
                              border: 'none',
                              borderRadius: '20px',
                              padding: '4px 12px',
                              fontSize: '0.75rem',
                              fontWeight: i === safeRoundPage ? '700' : '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              minWidth: '64px'
                            }}
                          >
                            Round {i + 1}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setRoundPage(p => Math.min(totalRounds - 1, p + 1))}
                        disabled={safeRoundPage === totalRounds - 1}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: safeRoundPage === totalRounds - 1 ? 'not-allowed' : 'pointer', opacity: safeRoundPage === totalRounds - 1 ? 0.4 : 1, color: '#475569' }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Current Round Card */}
                    {rc && (
                      <div className="ae-round-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div className="ae-round-header" style={{ paddingBottom: '0.6rem', marginBottom: '0.6rem' }}>
                          <h4 style={{ fontSize: '0.9rem' }}>Round {rc.roundNumber} Configuration</h4>
                          <span className="ae-badge accent">R{rc.roundNumber}</span>
                        </div>

                        {/* Compact top fields — all 3 in one row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Round Name</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Preliminary Quiz"
                              value={rc.name}
                              onChange={(e) => handleRoundConfigChange(rIdx, 'name', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Advance Limit</label>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="0 = No limit"
                              min="0"
                              value={rc.maxAdvance || 0}
                              onChange={(e) => handleRoundConfigChange(rIdx, 'maxAdvance', parseInt(e.target.value) || 0)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px' }}
                            />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'block' }}>Evaluation Type</label>
                            <Select
                              className="form-select"
                              value={rc.evaluationType}
                              onChange={(e) => handleRoundConfigChange(rIdx, 'evaluationType', e.target.value)}
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', borderRadius: '8px', height: 'auto' }}
                            >
                              <option value="position">Position Based Coordinator Evaluation</option>
                              <option value="admin">Internal Admin Evaluation</option>
                              <option value="jury">External Jury Evaluation</option>
                            </Select>
                          </div>
                        </div>

                        {/* Bottom section — changes based on evaluation type */}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

                          {/* POSITION BASED — drag-and-drop info */}
                          {rc.evaluationType === 'position' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px dashed #7dd3fc', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Layers size={24} color="#fff" />
                              </div>
                              <div>
                                <p style={{ fontWeight: '700', color: '#0369a1', fontSize: '0.9rem', margin: '0 0 6px 0' }}>Drag-to-Position Ranking</p>
                                <p style={{ fontSize: '0.75rem', color: '#0284c7', margin: 0, lineHeight: 1.5 }}>In the Participants panel, coordinators can drag and reorder participants to assign positions. Top-ranked participants are advanced to the next round based on the Advance Limit set above.</p>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                {['1st', '2nd', '3rd'].map((pos, i) => (
                                  <div key={i} style={{ padding: '4px 14px', borderRadius: '20px', background: i === 0 ? '#0369a1' : '#e0f2fe', color: i === 0 ? '#fff' : '#0369a1', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #7dd3fc' }}>{pos}</div>
                                ))}
                                <div style={{ padding: '4px 14px', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #7dd3fc' }}>…</div>
                              </div>
                            </div>
                          )}

                          {/* ADMIN — editable criteria + Evaluation button info */}
                          {rc.evaluationType === 'admin' && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
                                  Scoring Criteria
                                  <span style={{ marginLeft: '6px', background: '#f1f5f9', color: '#64748b', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: '600' }}>{rc.criteria.length}</span>
                                </label>
                                <button type="button" onClick={() => handleAddCriteria(rIdx)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                                  <Plus size={12} /> Add
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '4px', marginBottom: '4px', padding: '0 2px' }}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Criterion</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>Max Score</span>
                                <span></span>
                              </div>
                              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
                                {rc.criteria.map((cr, cIdx) => (
                                  <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '4px', alignItems: 'center' }}>
                                    <input type="text" className="form-input" placeholder="e.g. Creativity & Innovation" value={cr.name} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'name', e.target.value)} style={{ padding: '0.18rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }} />
                                    <input type="number" className="form-input" min="1" max="100" value={cr.maxScore} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'maxScore', parseInt(e.target.value) || 10)} style={{ padding: '0.18rem 0.3rem', fontSize: '0.75rem', borderRadius: '6px', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }} />
                                    {rc.criteria.length > 1 ? (
                                      <button type="button" onClick={() => handleRemoveCriteria(rIdx, cIdx)} style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '5px', width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={14} /></button>
                                    ) : <div />}
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={14} color="#16a34a" />
                                <span style={{ fontSize: '0.73rem', color: '#15803d', fontWeight: '500' }}>Admin evaluates participants using the <strong>Evaluation</strong> button in the Participants panel.</span>
                              </div>
                            </>
                          )}

                          {/* JURY — same design, editable criteria */}
                          {rc.evaluationType === 'jury' && (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ marginBottom: 0, fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>
                                  Scoring Criteria
                                  <span style={{ marginLeft: '6px', background: '#f1f5f9', color: '#64748b', borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: '600' }}>{rc.criteria.length}</span>
                                </label>
                                <button type="button" onClick={() => handleAddCriteria(rIdx)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f0f9ff', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
                                  <Plus size={12} /> Add
                                </button>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '4px', marginBottom: '4px', padding: '0 2px' }}>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Criterion</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'center' }}>Max Score</span>
                                <span></span>
                              </div>
                              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
                                {rc.criteria.map((cr, cIdx) => (
                                  <div key={cIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 40px', gap: '4px', alignItems: 'center' }}>
                                    <input type="text" className="form-input" placeholder="e.g. Creativity & Innovation" value={cr.name} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'name', e.target.value)} style={{ padding: '0.18rem 0.4rem', fontSize: '0.75rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }} />
                                    <input type="number" className="form-input" min="1" max="100" value={cr.maxScore} onChange={(e) => handleCriteriaChange(rIdx, cIdx, 'maxScore', parseInt(e.target.value) || 10)} style={{ padding: '0.18rem 0.3rem', fontSize: '0.75rem', borderRadius: '6px', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: '600' }} />
                                    {rc.criteria.length > 1 ? (
                                      <button type="button" onClick={() => handleRemoveCriteria(rIdx, cIdx)} style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '5px', width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={14} /></button>
                                    ) : <div />}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}


                        </div>
                      </div>
                    )}
                  </>
                );
              })()}


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
                      id="wiz-coord-name"
                      className="form-input"
                      type="text"
                      placeholder="Full Name"
                      value={coordName}
                      onChange={(e) => setCoordName(e.target.value)}
                      style={{ borderRadius: '10px', flex: 2 }}
                    />
                    <input
                      id="wiz-coord-email"
                      className="form-input"
                      type="email"
                      placeholder="Email Address"
                      value={coordEmail}
                      onChange={(e) => setCoordEmail(e.target.value)}
                      style={{ borderRadius: '10px', flex: 2 }}
                    />
                    <Select
                      id="wiz-coord-role"
                      className="form-select"
                      value={coordRole}
                      onChange={(e) => setCoordRole(e.target.value)}
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
                        const name = coordName.trim();
                        const email = coordEmail.trim();
                        const role = coordRole;
                        if (!name || !email) { showToast('Please enter both name and email.', 'error'); return; }
                        
                        // Basic email validation
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(email)) {
                          showToast('Please enter a valid email address.', 'error');
                          return;
                        }

                        // Prevent duplicate emails
                        if ((formData.coordinators || []).some(c => c.email.toLowerCase() === email.toLowerCase())) {
                          showToast('A coordinator with this email has already been added.', 'error');
                          return;
                        }

                        setFormData(prev => ({
                          ...prev,
                          coordinators: [...(prev.coordinators || []), { name, email, role }]
                        }));
                        
                        setCoordName('');
                        setCoordEmail('');
                        setCoordRole('Lead Coordinator');
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
                        const initials = (coord.name || '')
                          .trim()
                          .split(/\s+/)
                          .map(n => n ? n[0] : '')
                          .join('')
                          .toUpperCase()
                          .substring(0, 2) || '??';
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

                  <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '0.85rem' }}>
                    <label className="form-label" style={{ fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <MessageSquare size={16} color="#6366f1" /> Map Feedback Template (For Participants)
                    </label>
                    <Select className="form-select" name="feedbackTemplate" value={formData.feedbackTemplate || ''} onChange={handleInputChange} style={{ width: '100%', borderRadius: '10px' }}>
                      <option value="">Default General Feedback Form</option>
                      {feedbackTemplates.map(tmpl => (
                        <option key={tmpl._id} value={tmpl._id}>
                          {tmpl.title} ({tmpl.fields?.length || 0} questions)
                        </option>
                      ))}
                    </Select>
                    <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '6px', display: 'block', lineHeight: '1.4' }}>
                      Participants will be prompted to fill this custom template upon event feedback submission. Leave empty to use the default feedback form.
                    </small>
                  </div>
                </>
              )}

              {/* Step 7: Approval & Budget */}
              {step === 7 && (
                <>
                  <div className="ae-wizard-banner" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                    <div className="ae-wizard-banner-icon">
                      <Stamp size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">{WIZARD_STEPS[6].desc}</span>
                      <span className="ae-wizard-banner-desc">{WIZARD_STEPS[6].sub}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Section: Participants */}
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} /> Expected Participant Counts
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Internal Participants Expected *</label>
                          <input
                            type="number"
                            placeholder="e.g. 610"
                            value={formData.approvalDetails?.internalParticipants || ''}
                            onChange={e => handleWizApprovalFieldChange('internalParticipants', e.target.value)}
                            style={{ width: '100%', border: '1.5px solid var(--clr-border)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', color: '#0f172a', background: 'var(--clr-surface)', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>External Participants Expected *</label>
                          <input
                            type="number"
                            placeholder="e.g. 0"
                            value={formData.approvalDetails?.externalParticipants || ''}
                            onChange={e => handleWizApprovalFieldChange('externalParticipants', e.target.value)}
                            style={{ width: '100%', border: '1.5px solid var(--clr-border)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', color: '#0f172a', background: 'var(--clr-surface)', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section: Budget Items */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IndianRupee size={14} /> Proposed Budget Items
                        </h4>
                        <button onClick={addWizBudgetItem} type="button" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Plus size={12} /> Add Row
                        </button>
                      </div>
                      <div style={{ border: '1px solid var(--clr-border)', borderRadius: '10px', overflowX: 'auto', background: 'var(--clr-surface)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: '600px' }}>
                          <thead>
                            <tr style={{ background: 'var(--clr-surface-2)', borderBottom: '1px solid var(--clr-border)' }}>
                              {['Item Name', 'Qty', 'Rate/Unit', 'Total Cost', 'Mode', 'Remarks', ''].map(h => (
                                <th key={h} style={{ padding: '8px 10px', fontWeight: '700', color: '#475569', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {((formData.approvalDetails && formData.approvalDetails.budgetItems) || []).map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                                <td style={{ padding: '4px 6px' }}>
                                  <input
                                    type="text"
                                    value={item.name || ''}
                                    placeholder="e.g. Certificates"
                                    onChange={e => handleWizBudgetItemChange(idx, 'name', e.target.value)}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px', width: '70px' }}>
                                  <input
                                    type="text"
                                    value={item.quantity || ''}
                                    placeholder="e.g. 50"
                                    onChange={e => {
                                      const val = e.target.value;
                                      const rate = parseFloat(item.ratePerUnit) || 0;
                                      const qty = parseFloat(val) || 0;
                                      const total = qty && rate ? (qty * rate).toString() : item.totalCost;
                                      handleWizBudgetItemChange(idx, 'quantity', val);
                                      if (qty && rate) handleWizBudgetItemChange(idx, 'totalCost', total);
                                    }}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px', width: '80px' }}>
                                  <input
                                    type="text"
                                    value={item.ratePerUnit || ''}
                                    placeholder="e.g. 15"
                                    onChange={e => {
                                      const val = e.target.value;
                                      const qty = parseFloat(item.quantity) || 0;
                                      const rate = parseFloat(val) || 0;
                                      const total = qty && rate ? (qty * rate).toString() : item.totalCost;
                                      handleWizBudgetItemChange(idx, 'ratePerUnit', val);
                                      if (qty && rate) handleWizBudgetItemChange(idx, 'totalCost', total);
                                    }}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px', width: '100px' }}>
                                  <input
                                    type="text"
                                    value={item.totalCost || ''}
                                    placeholder="e.g. 750"
                                    onChange={e => handleWizBudgetItemChange(idx, 'totalCost', e.target.value)}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px' }}>
                                  <input
                                    type="text"
                                    value={item.modeOfArrangement || ''}
                                    placeholder="e.g. Printing"
                                    onChange={e => handleWizBudgetItemChange(idx, 'modeOfArrangement', e.target.value)}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px' }}>
                                  <input
                                    type="text"
                                    value={item.remarks || ''}
                                    placeholder="e.g. For winners"
                                    onChange={e => handleWizBudgetItemChange(idx, 'remarks', e.target.value)}
                                    style={{ width: '100%', border: '1px solid var(--clr-border)', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', boxSizing: 'border-box' }}
                                  />
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', width: '40px' }}>
                                  <button onClick={() => removeWizBudgetItem(idx)} type="button" style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', color: '#ef4444' }}>
                                    <X size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Section: FY Budget */}
                    <div>
                      <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} /> Budget Allocation details (FY 2025-26)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                          { label: 'Allotted Budget (Rs.)', field: 'proposedBudget', placeholder: '1,20,000' },
                          { label: 'Actual Spent Till Date (Rs.)', field: 'actualSpentTillDate', placeholder: '0' },
                          { label: 'Available Budget (Rs.)', field: 'availableBudget', placeholder: '1,20,000' },
                          { label: 'Now Requested (Rs.) *', field: 'nowRequested', placeholder: 'Calculated automatically' },
                        ].map(f => (
                          <div key={f.field}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>{f.label}</label>
                            <input
                              type="text"
                              placeholder={f.placeholder}
                              value={formData.approvalDetails?.[f.field] || ''}
                              onChange={e => handleWizApprovalFieldChange(f.field, e.target.value)}
                              style={{ width: '100%', border: '1.5px solid var(--clr-border)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', color: '#0f172a', background: 'var(--clr-surface)', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section: Advance Note */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Advance Note (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Advance requested Rs. 10,000 for purchasing prizes."
                        value={formData.approvalDetails?.advanceNote || ''}
                        onChange={e => handleWizApprovalFieldChange('advanceNote', e.target.value)}
                        style={{ width: '100%', border: '1.5px solid var(--clr-border)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', color: '#0f172a', background: 'var(--clr-surface)', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '10px', padding: '10px' }}>
                    <Info size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: '#4f46e5' }}>These details will be used to auto-generate the official event approval proposal documents (Word / PDF) at the end of the wizard.</span>
                  </div>
                </>
              )}

              {/* Step 8: Overview & Launch */}
              {step === (formData.eventType === 'macro' ? 2 : 8) && (
                <>
                  <div className="ae-wizard-banner" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
                    <div className="ae-wizard-banner-icon">
                      <Send size={20} />
                    </div>
                    <div className="ae-wizard-banner-text">
                      <span className="ae-wizard-banner-title">
                        {formData.eventType === 'macro' ? MACRO_WIZARD_STEPS[1].desc : WIZARD_STEPS[7].desc}
                      </span>
                      <span className="ae-wizard-banner-desc">
                        {formData.eventType === 'macro' ? MACRO_WIZARD_STEPS[1].sub : WIZARD_STEPS[7].sub}
                      </span>
                    </div>
                  </div>

                  <div className="ae-wizard-overview-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Attendance Mode:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>{formData.attendanceMode || 'student_scan'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>Feedback Form:</span>
                          <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.85rem' }}>
                            {feedbackTemplates.find(t => t._id === formData.feedbackTemplate)?.title || 'Default General Feedback Form'}
                          </span>
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

                  {formData.eventType !== 'macro' && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Stamp size={20} color="#6366f1" />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a' }}>Approval Letter & Budget Proposal</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Download the official Principal approval proposal document</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={generateApprovalWord}
                          style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FileDown size={14} /> Download Word (DOC)
                        </button>
                        <button
                          type="button"
                          onClick={generateApprovalPDF}
                          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <FileDown size={14} /> Download PDF
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Card Footer controls */}
              <div className="ae-wizard-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (step === 1) {
                      navigate('/admin/events?modal=true');
                    } else {
                      handlePrevStep();
                    }
                  }}
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
                    {step === (formData.eventType === 'macro' ? 2 : 8) ? (submitting ? 'Creating...' : 'Create Event \u25b8') : 'Next Step \u25b8'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Conditionally hide the list view when creating */}
      {!isCreateRoute && (
        <>
          {loading ? (
            <div style={{ padding: '6rem 0' }}>
              <Loader text="Loading your event command center..." />
            </div>
          ) : events.length === 0 && !showCreateForm ? (
            <EmptyState
              variant="events"
              title="No events yet"
              subtitle="Click New Event above to create your first event."
            />
          ) : (
            <div className="evc-grid animate-fade-in-up">
              {events.map((ev) => {
                const dateParts = getUTCDateParts(ev.date);
                const subCount = events.filter(sub => sub.parentEvent === ev._id).length;
                const typeColor =
                  ev.eventType === 'macro' ? '#6366f1' :
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
                              className="evc-overlay-btn"
                              onClick={(e) => { e.stopPropagation(); openApprovalModal(ev); }}
                              type="button"
                            >
                              <span className="evc-overlay-btn-icon">
                                <FileDown size={16} />
                              </span>
                              Approval
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
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Approval Form Modal ─────────────────────────────────── */}
      {showApprovalModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}
          onClick={() => setShowApprovalModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '720px', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', position: 'relative', maxHeight: '92vh', overflowY: 'auto', animation: 'scaleIn 0.25s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stamp size={22} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Generate Approval Document</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Event: <strong>{(approvalTargetEvent || formData).title || '—'}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowApprovalModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#475569' }}>
                <X size={18} />
              </button>
            </div>

            {/* Section: Participants */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Users size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Participant Counts
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Internal Participants', field: 'internalParticipants', placeholder: 'e.g. 610' },
                  { label: 'External Participants', field: 'externalParticipants', placeholder: 'e.g. 0' },
                  { label: 'Advance Note (optional)', field: 'advanceNote', placeholder: 'e.g. Advance requested Rs.11,250/- for cash prize winners.' },
                ].map(f => (
                  <div key={f.field} style={{ gridColumn: f.field === 'advanceNote' ? 'span 3' : 'span 1' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={approvalData[f.field]}
                      onChange={e => handleApprovalFieldChange(f.field, e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem', color: '#0f172a', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Budget Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <IndianRupee size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Proposed Budget Items
                </h4>
                <button onClick={addBudgetItem} type="button" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Plus size={12} /> Add Row
                </button>
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Item Name', 'Qty', 'Rate/Unit', 'Total Cost (Rs.)', 'Mode', 'Remarks', ''].map(h => (
                        <th key={h} style={{ padding: '8px 10px', fontWeight: '700', color: '#475569', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {approvalData.budgetItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {['name', 'quantity', 'ratePerUnit', 'totalCost', 'modeOfArrangement', 'remarks'].map(field => (
                          <td key={field} style={{ padding: '4px 6px' }}>
                            <input
                              type="text"
                              value={item[field]}
                              onChange={e => handleBudgetItemChange(idx, field, e.target.value)}
                              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 7px', fontSize: '0.78rem', color: '#0f172a', background: '#fff', minWidth: field === 'name' ? '110px' : '60px', boxSizing: 'border-box' }}
                            />
                          </td>
                        ))}
                        <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                          <button onClick={() => removeBudgetItem(idx)} type="button" style={{ background: '#fef2f2', border: 'none', borderRadius: '6px', padding: '5px 7px', cursor: 'pointer', color: '#ef4444' }}>
                            <X size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: FY Budget */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Building2 size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Budget for FY 2025-26
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Proposed Budget (Rs.)', field: 'proposedBudget', placeholder: '1,20,000' },
                  { label: 'Actual Spent Till Date (Rs.)', field: 'actualSpentTillDate', placeholder: '8750' },
                  { label: 'Available Budget (Rs.)', field: 'availableBudget', placeholder: '1,11,250' },
                  { label: 'Now Requested (Rs.)', field: 'nowRequested', placeholder: '13,740' },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>{f.label}</label>
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      value={approvalData[f.field]}
                      onChange={e => handleApprovalFieldChange(f.field, e.target.value)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px', fontSize: '0.82rem', color: '#0f172a', background: '#f8fafc', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setShowApprovalModal(false)} type="button" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={generateApprovalWord} type="button" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileDown size={16} /> Download Word (DOC)
              </button>
              <button onClick={generateApprovalPDF} type="button" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileDown size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminEvents;
