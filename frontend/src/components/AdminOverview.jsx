import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { 
  Users, 
  Calendar, 
  FileText, 
  Activity, 
  ArrowUpRight,
  MonitorPlay,
  CheckCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Video,
  X,
  Settings,
  CalendarCheck
} from 'lucide-react';
import Chart from 'react-apexcharts';
import bannerIllustration from '../assets/banner_award.jpg';


const AdminOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingDocs: 0,
    activeAdmins: 0
  });

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Google Meet Modal State
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');

  // Calendar Config State
  const [showCalConfig, setShowCalConfig] = useState(false);
  const [calConfig, setCalConfig] = useState({
    defaultView: 'Monthly View',
    highlightWeekends: true,
    showPastEvents: false
  });

  useEffect(() => {
    // Delay chart mounting slightly to ensure the DOM node exists
    const timer = setTimeout(() => setShowChart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // We'll fetch user and parallelize other requests based on existing APIs
        const [userRes, eventsRes, usersRes, docsRes, logsRes] = await Promise.all([
          axios.get(`${API_URL}/api/auth/login/success`, { withCredentials: true }),
          axios.get(`${API_URL}/api/events`, { withCredentials: true }),
          axios.get(`${API_URL}/api/admin/users`, { withCredentials: true }).catch(() => ({ data: { success: false } })),
          axios.get(`${API_URL}/api/documents`, { withCredentials: true }).catch(() => ({ data: { success: false } })),
          axios.get(`${API_URL}/api/admin/audit-logs`, { withCredentials: true }).catch(() => ({ data: { success: false } }))
        ]);

        if (userRes.data?.user) setCurrentUser(userRes.data.user);

        let tEvents = 0, tUsers = 0, pDocs = 0, aAdmins = 0;
        let upEvents = [];
        let rLogs = [];

        if (eventsRes.data?.success) {
          const events = eventsRes.data.events;
          setAllEvents(events);
          tEvents = events.length;
          upEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 4);
        }

        if (usersRes.data?.success) {
          const users = usersRes.data.users;
          tUsers = users.length;
          aAdmins = users.filter(u => ['admin_t1', 'admin_t2', 'superadmin'].includes(u.role)).length;
        }

        if (docsRes.data?.success) {
          const docs = docsRes.data.documents;
          pDocs = docs.filter(d => d.status === 'Pending').length;
        }

        if (logsRes.data?.success) {
          rLogs = logsRes.data.logs.slice(0, 5);
        }

        setMetrics({ totalUsers: tUsers, totalEvents: tEvents, pendingDocs: pDocs, activeAdmins: aAdmins });
        setUpcomingEvents(upEvents);
        setRecentLogs(rLogs);

      } catch (error) {
        console.error("Dashboard Fetch Error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatRole = (role) => {
    const roles = {
      superadmin: 'Super Admin',
      admin_t1: 'Admin T1',
      admin_t2: 'Admin T2',
      mentor: 'Mentor',
      user: 'Student'
    };
    return roles[role] || role || 'Student';
  };

  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#94a3b8'
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: { show: false },
    grid: {
      borderColor: 'rgba(255,255,255,0.05)',
      strokeDashArray: 4,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    tooltip: { theme: 'dark' }
  };

  const chartSeries = [
    { name: 'System Activity', data: [31, 40, 28, 51, 42, 109, 100] }
  ];

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="bg-transparent aspect-square"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
      const hasEvent = allEvents.some(e => {
        const d = new Date(e.date);
        return d.getDate() === i && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });

      days.push(
        <div key={i} className={`aspect-square flex items-center justify-center text-[0.85rem] font-medium text-[var(--clr-text-heading)] rounded-lg relative cursor-default transition-all duration-200 hover:bg-[var(--clr-surface)] hover:shadow-sm ${isToday ? 'bg-[var(--clr-primary)] !text-white font-bold shadow-[0_4px_10px_rgba(91,110,245,0.3)] hover:!bg-[var(--clr-primary)]' : ''} ${hasEvent ? 'font-bold' : ''}`}>
          {i}
          {hasEvent && <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-[var(--clr-accent)]'}`}></span>}
        </div>
      );
    }
    return days;
  };

  const handleScheduleMeet = async (e) => {
    e.preventDefault();
    if (!meetTitle || !meetDate || !meetTime) return;
    
    try {
      const startTime = new Date(`${meetDate}T${meetTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      const res = await axios.post(`${API_URL}/api/admin/meet/generate`, {
        title: meetTitle,
        startDateTime: startTime.toISOString(),
        endDateTime: endTime.toISOString()
      }, { withCredentials: true });

      if (res.data.success) {
        // Open the generated meet link in a new tab
        window.open(res.data.meetLink, '_blank');
        setShowMeetModal(false);
        setMeetTitle('');
        setMeetDate('');
        setMeetTime('');
        alert(`Meeting Scheduled successfully!\nLink: ${res.data.meetLink}`);
      }
    } catch (error) {
      console.error("Failed to generate meet link", error);
      alert('Failed to generate Google Meet link via API. Please check console.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-[var(--clr-text-muted)]">
        <div className="loader-spinner"></div>
        <p>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-bold text-[var(--clr-text-heading)] m-0 mb-1 tracking-[-0.02em]">Admin Overview</h2>
        <p className="text-[var(--clr-text-muted)] text-[0.95rem] m-0">System metrics, upcoming events, and administrative quick actions.</p>
      </div>

      <div className="grid grid-cols-[320px_1fr_320px] auto-rows-[minmax(180px,auto)] gap-5 max-xl:grid-cols-[1fr_1fr] max-md:grid-cols-1">
        
        {/* Bento 1: Profile Card */}
        <div className="group relative bg-gradient-to-br from-[var(--clr-surface)] to-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-7 flex flex-col items-center text-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] row-span-2 max-xl:col-span-1 max-md:col-span-1">
          
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--clr-primary)] rounded-full blur-[80px] opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity duration-500"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--clr-success)] rounded-full blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>

          {/* Top Bar */}
          <div className="w-full flex justify-between items-center mb-6 z-10">
            <div className="flex items-center gap-2 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.2)] text-[var(--clr-primary)] px-3 py-1.5 rounded-full text-[0.75rem] font-bold tracking-wide uppercase">
              <ShieldCheck size={14} /> Administrator
            </div>
            <button 
              className="w-8 h-8 rounded-full bg-[var(--clr-surface-3)] flex items-center justify-center text-[var(--clr-text-muted)] hover:text-white hover:bg-[var(--clr-primary)] transition-colors duration-200" 
              onClick={() => navigate('/edit-profile')}
              title="Edit Profile"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="relative mb-5 z-10 mt-2">
            <div className="w-[110px] h-[110px] rounded-full p-1 bg-gradient-to-br from-[var(--clr-primary)] via-[#a855f7] to-[var(--clr-success)] shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-shadow duration-300">
              {currentUser?.profilePicture ? (
                <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full rounded-full border-[4px] border-[var(--clr-surface)] object-cover" />
              ) : (
                <div className="w-full h-full rounded-full border-[4px] border-[var(--clr-surface)] bg-[var(--clr-surface-3)] flex items-center justify-center text-3xl font-extrabold text-white">
                  {(currentUser?.name || 'A').substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            {/* Online Indicator */}
            <div className="absolute bottom-1 right-2 w-5 h-5 bg-[#22c55e] border-[3px] border-[var(--clr-surface)] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </div>

          {/* User Info */}
          <div className="z-10 w-full">
            <h3 className="m-0 mb-1 text-[1.4rem] font-bold text-white tracking-tight">{currentUser?.name || 'System Admin'}</h3>
            <p className="text-[var(--clr-primary-light)] font-semibold text-[0.9rem] m-0 mb-1">{formatRole(currentUser?.role)}</p>
            {currentUser?.department ? (
              <p className="text-[0.8rem] text-[var(--clr-text-muted)] m-0 mb-8">{currentUser.department}</p>
            ) : (
              <p className="text-[0.8rem] text-[var(--clr-text-muted)] m-0 mb-8">Spectrum Administration Dept.</p>
            )}
          </div>

          {/* Metrics Footer */}
          <div className="mt-auto w-full grid grid-cols-2 gap-3 z-10 border-t border-[rgba(255,255,255,0.05)] pt-6">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
              <span className="text-2xl font-black text-white mb-0.5">{metrics.activeAdmins}</span>
              <span className="text-[0.7rem] text-[var(--clr-text-muted)] uppercase tracking-wider font-semibold">Coordinators</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
              <span className="text-2xl font-black text-[#10b981] mb-0.5">100%</span>
              <span className="text-[0.7rem] text-[var(--clr-text-muted)] uppercase tracking-wider font-semibold">Uptime</span>
            </div>
          </div>
        </div>

        {/* Bento 2: Insights Banner Card */}
        <div
          className="col-start-2 col-span-2 row-start-1 max-xl:col-span-2 max-xl:row-auto max-md:col-span-1"
          style={{
            backgroundColor: '#071e38',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem 2.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(7, 30, 56, 0.55)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            minHeight: 220,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(7,30,56,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(7,30,56,0.55)'; }}
        >
          {/* Image Background with Perfect Edge Blend */}
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '65%',
            zIndex: 0,
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
          }}>
            <img 
              src={bannerIllustration} 
              alt="Banner Illustration"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                display: 'block',
              }}
            />
          </div>

          {/* Left: text + stats grid */}
          <div style={{ flex: 1, minWidth: 0, zIndex: 1, maxWidth: '48%' }}>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
              System Overview
            </p>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.4, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              Insights and summary on<br />your platform data
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 2rem' }}>
              {/* Stat 1 */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
                onClick={() => navigate('/admin/users')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={16} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{metrics.totalUsers}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Total Users</div>
                </div>
              </div>

              {/* Stat 2 */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
                onClick={() => navigate('/admin/team')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={16} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{metrics.activeAdmins}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Coordinators</div>
                </div>
              </div>

              {/* Stat 3 */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
                onClick={() => navigate('/admin/events')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Calendar size={16} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{metrics.totalEvents}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Events Managed</div>
                </div>
              </div>

              {/* Stat 4 */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', cursor: 'pointer' }}
                onClick={() => navigate('/admin/documents')}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>{metrics.pendingDocs}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Pending Docs</div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Bento 3: Main Chart */}
        <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex flex-col relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] col-start-2 row-start-2 max-xl:col-span-2 max-xl:row-auto max-md:col-span-1">
          <div className="flex justify-between items-center mb-5">
            <h4 className="m-0 text-[1.05rem] font-semibold text-[var(--clr-text-heading)]">Work Activity (Weekly)</h4>
            <div className="flex items-center gap-2 text-[0.8rem] text-[var(--clr-success)] font-semibold bg-[rgba(34,197,94,0.1)] px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-[var(--clr-success)] rounded-full animate-pulse shadow-[0_0_0_0_rgba(34,197,94,0.4)]"></span> Live
            </div>
          </div>
          <div className="flex-1 min-h-[200px] -ml-2.5">
            {showChart && <Chart key="apex-activity-chart" options={chartOptions} series={chartSeries} type="area" height="100%" />}
          </div>
        </div>

        {/* Bento 4: Premium Calendar */}
        <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex flex-col relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] col-start-3 row-start-2 max-xl:col-start-2 max-xl:row-auto max-md:col-span-1 max-md:col-start-1">
          <div className="flex justify-between items-center mb-3">
            <h4 className="m-0 text-[1.05rem] font-semibold text-[var(--clr-text-heading)] flex items-center gap-2">
              <CalendarCheck size={18} color="var(--clr-primary)" />
              Schedule
            </h4>
            <div className="flex gap-2 items-center">
              <button className="bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-none px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-colors hover:bg-[rgba(59,130,246,0.25)]" onClick={() => setShowMeetModal(true)}>
                <Video size={14} /> Meet
              </button>
              <button className="bg-[var(--clr-surface-2)] text-[var(--clr-text-muted)] border border-[var(--clr-border)] rounded-lg w-[32px] h-[32px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--clr-surface-3)] hover:text-[var(--clr-text-heading)]" onClick={() => setShowCalConfig(true)}>
                <Settings size={14} />
              </button>
            </div>
          </div>
          
          <div className="bg-[var(--clr-surface-2)] rounded-[var(--radius-lg)] p-5 mb-5 border border-[var(--clr-border-subtle)]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[0.95rem] text-[var(--clr-text-heading)]">{monthNames[currentDate.getMonth()]} <b className="font-bold">{currentDate.getFullYear()}</b></span>
              <div className="flex gap-1">
                <button className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-md w-[26px] h-[26px] flex items-center justify-center cursor-pointer text-[var(--clr-text-subtle)] transition-all duration-200 font-bold hover:bg-[var(--clr-primary)] hover:text-white hover:border-[var(--clr-primary)]" onClick={prevMonth}>&lt;</button>
                <button className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-md w-[26px] h-[26px] flex items-center justify-center cursor-pointer text-[var(--clr-text-subtle)] transition-all duration-200 font-bold hover:bg-[var(--clr-primary)] hover:text-white hover:border-[var(--clr-primary)]" onClick={nextMonth}>&gt;</button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 text-center text-[0.7rem] font-bold text-[var(--clr-text-muted)] mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
          </div>

          <div className="flex flex-col">
            <h5 className="m-0 mb-3 text-[0.75rem] font-bold text-[var(--clr-text-muted)] uppercase tracking-[0.05em]">Upcoming Events</h5>
            <div className="flex flex-col gap-3">
              {upcomingEvents.slice(0, 2).length > 0 ? (
                upcomingEvents.slice(0, 2).map(event => (
                  <div key={event._id} className="flex items-center gap-4 p-3 bg-[var(--clr-surface-2)] rounded-[var(--radius-md)] border border-transparent cursor-pointer transition-all duration-200 hover:bg-[var(--clr-surface)] hover:border-[var(--clr-border)] hover:shadow-sm hover:translate-x-1" onClick={() => navigate(`/admin/events/${event._id}`)}>
                    <div className="flex flex-col items-center justify-center bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-lg w-11 h-11 shrink-0">
                      <span className="text-[1.1rem] font-bold text-[var(--clr-text-heading)] leading-none">{new Date(event.date).getDate()}</span>
                      <span className="text-[0.65rem] font-semibold uppercase text-[var(--clr-primary)] mt-[2px]">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="m-0 mb-1 text-[0.9rem] font-semibold text-[var(--clr-text-heading)] whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</p>
                      <p className="m-0 text-[0.75rem] text-[var(--clr-text-muted)] font-medium flex items-center"><Clock size={11} className="mr-1 inline-block"/>{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-[var(--clr-surface-2)] rounded-[var(--radius-md)] text-center text-[var(--clr-text-muted)] text-[0.85rem] border border-dashed border-[var(--clr-border)]">
                  <p>No upcoming events.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bento 5: Premium Widget / Custom Action */}
        <div className="bg-gradient-to-tr from-[rgba(59,130,246,0.1)] to-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)] rounded-[var(--radius-xl)] col-span-full flex flex-row justify-between items-center px-8 py-6 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] max-md:flex-col max-md:text-center max-md:gap-4">
          <div className="flex items-center gap-6 max-md:flex-col max-md:gap-2">
            <MonitorPlay size={28} className="text-[var(--clr-primary)]" />
            <div>
              <h4 className="m-0 text-[1.25rem] font-semibold text-[var(--clr-text-heading)]">Spectrum Dashboard</h4>
              <p className="m-0 text-[0.9rem] text-[var(--clr-primary-light)]">Admin Control Center v2.0</p>
            </div>
          </div>
          <button className="btn btn-primary w-auto px-8" onClick={() => navigate('/events')}>
            Preview Public Portal
          </button>
        </div>

      </div>

      {/* Schedule Meeting Modal */}
      {showMeetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowMeetModal(false)}>
          <div className="bg-[var(--clr-surface)] w-full max-w-md rounded-[var(--radius-xl)] p-6 shadow-2xl relative animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--clr-border)] flex-nowrap">
              <div className="flex items-center gap-2.5">
                <div className="bg-[rgba(66,133,244,0.1)] text-[#4285F4] p-2 rounded-lg">
                  <Video size={20} />
                </div>
                <h3 className="m-0 text-xl font-bold text-[var(--clr-text-heading)]">Google Meet</h3>
              </div>
              <button className="w-8 h-8 rounded-full border-none bg-[var(--clr-surface-2)] text-[var(--clr-text-muted)] flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--clr-surface-3)] hover:text-[var(--clr-text-heading)]" onClick={() => setShowMeetModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleScheduleMeet} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Meeting Title</label>
                <input type="text" className="w-full bg-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-lg px-4 py-2.5 text-[0.95rem] text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-[var(--clr-primary)] focus:bg-[var(--clr-surface)]" required value={meetTitle} onChange={e => setMeetTitle(e.target.value)} placeholder="e.g. Core Committee Sync" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Date</label>
                  <input type="date" className="w-full bg-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-lg px-4 py-2.5 text-[0.95rem] text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-[var(--clr-primary)] focus:bg-[var(--clr-surface)]" required value={meetDate} onChange={e => setMeetDate(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Time</label>
                  <input type="time" className="w-full bg-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-lg px-4 py-2.5 text-[0.95rem] text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-[var(--clr-primary)] focus:bg-[var(--clr-surface)]" required value={meetTime} onChange={e => setMeetTime(e.target.value)} />
                </div>
              </div>
              
              <div className="bg-[var(--clr-surface-2)] p-4 rounded-lg mt-2 text-[0.85rem] text-[var(--clr-text-muted)]">
                The system will use the Google Meet API to automatically generate a secure conferencing link.
              </div>

              <div className="flex gap-2.5 mt-4">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setShowMeetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 bg-[#4285F4] border-[#4285F4] hover:bg-[#3367D6]">Generate Meet Link</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar Config Modal */}
      {showCalConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowCalConfig(false)}>
          <div className="bg-[var(--clr-surface)] w-full max-w-md rounded-[var(--radius-xl)] p-6 shadow-2xl relative animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--clr-border)] flex-nowrap">
              <div className="flex items-center gap-2.5">
                <div className="bg-[var(--clr-surface-2)] text-[var(--clr-text-heading)] p-2 rounded-lg border border-[var(--clr-border)]">
                  <Settings size={20} />
                </div>
                <h3 className="m-0 text-xl font-bold text-[var(--clr-text-heading)]">Calendar Configuration</h3>
              </div>
              <button className="w-8 h-8 rounded-full border-none bg-[var(--clr-surface-2)] text-[var(--clr-text-muted)] flex items-center justify-center cursor-pointer transition-colors hover:bg-[var(--clr-surface-3)] hover:text-[var(--clr-text-heading)]" onClick={() => setShowCalConfig(false)}><X size={18} /></button>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="p-4 border border-[var(--clr-border)] rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="m-0 mb-1 text-[0.95rem] font-semibold text-[var(--clr-text-heading)]">Sync Google Calendar</h4>
                  <p className="m-0 text-[0.8rem] text-[var(--clr-text-muted)]">Automatically pull events from your Google account.</p>
                </div>
                <button className="btn btn-sm btn-secondary">Connect</button>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Default View</label>
                <select className="w-full bg-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-lg px-4 py-2.5 text-[0.95rem] text-[var(--clr-text-heading)] transition-colors focus:outline-none focus:border-[var(--clr-primary)] focus:bg-[var(--clr-surface)]" value={calConfig.defaultView} onChange={e => setCalConfig({...calConfig, defaultView: e.target.value})}>
                  <option>Monthly View</option>
                  <option>Weekly View</option>
                  <option>Agenda List</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Highlight Weekends</span>
                <label className="switch relative inline-block w-[46px] h-[24px]">
                  <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={calConfig.highlightWeekends} onChange={e => setCalConfig({...calConfig, highlightWeekends: e.target.checked})} />
                  <span className="absolute cursor-pointer inset-0 bg-[var(--clr-surface-3)] rounded-[24px] transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-[50%] before:transition-all before:duration-300 peer-checked:bg-[var(--clr-primary)] peer-checked:before:translate-x-[22px]"></span>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-[0.85rem] font-semibold text-[var(--clr-text-heading)]">Show Past Events</span>
                <label className="switch relative inline-block w-[46px] h-[24px]">
                  <input type="checkbox" className="opacity-0 w-0 h-0 peer" checked={calConfig.showPastEvents} onChange={e => setCalConfig({...calConfig, showPastEvents: e.target.checked})} />
                  <span className="absolute cursor-pointer inset-0 bg-[var(--clr-surface-3)] rounded-[24px] transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-[50%] before:transition-all before:duration-300 peer-checked:bg-[var(--clr-primary)] peer-checked:before:translate-x-[22px]"></span>
                </label>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button className="btn btn-secondary flex-1" onClick={() => setShowCalConfig(false)}>Cancel</button>
                <button className="btn btn-primary flex-1" onClick={() => setShowCalConfig(false)}>Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOverview;
