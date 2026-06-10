import re
import sys

with open('d:/Projects/Spectrum-main/frontend/src/components/AdminOverview.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the CSS import
content = content.replace("import './AdminOverview.css';", "")

# Replace renderCalendarDays
old_cal_days = """  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="cal-grid-day empty"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
      const hasEvent = allEvents.some(e => {
        const d = new Date(e.date);
        return d.getDate() === i && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
      });

      days.push(
        <div key={i} className={`cal-grid-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`}>
          {i}
          {hasEvent && <span className="cal-dot"></span>}
        </div>
      );
    }
    return days;
  };"""

new_cal_days = """  const renderCalendarDays = () => {
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
  };"""

content = content.replace(old_cal_days, new_cal_days)

# Replace the entire render blocks
old_render = content[content.find("  if (loading) {"):]

new_render = """  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4 text-[var(--clr-text-muted)]">
        <div className="loader-spinner"></div>
        <p>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-8">
        <h2 className="text-[1.75rem] font-bold text-[var(--clr-text-heading)] m-0 mb-1 tracking-[-0.02em]">Admin Overview</h2>
        <p className="text-[var(--clr-text-muted)] text-[0.95rem] m-0">System metrics, upcoming events, and administrative quick actions.</p>
      </div>

      <div className="grid grid-cols-[320px_1fr_320px] auto-rows-[minmax(180px,auto)] gap-5 max-xl:grid-cols-[1fr_1fr] max-md:grid-cols-1">
        
        {/* Bento 1: Profile Card */}
        <div className="bg-gradient-to-br from-[var(--clr-surface)] to-[var(--clr-surface-2)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex flex-col relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] row-span-2 items-center text-center max-xl:col-span-1 max-md:col-span-1">
          <div className="w-full flex justify-between mb-6">
            <div className="flex items-center gap-1.5 bg-[rgba(59,130,246,0.1)] text-[var(--clr-primary)] px-3 py-1.5 rounded-full text-[0.8rem] font-semibold">
              <ShieldCheck size={14} /> Administrator
            </div>
            <button className="btn-icon" onClick={() => navigate('/edit-profile')}>
              <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="w-[100px] h-[100px] rounded-full p-1 bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-success)] mb-4">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full rounded-full border-[3px] border-[var(--clr-surface)] object-cover" />
            ) : (
              <div className="w-full h-full rounded-full border-[3px] border-[var(--clr-surface)] object-cover bg-[var(--clr-surface-3)] flex items-center justify-center text-2xl font-bold text-[var(--clr-text-heading)]">
                {(currentUser?.name || 'A').substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h3 className="m-0 mb-1 text-[1.3rem] text-[var(--clr-text-heading)]">{currentUser?.name || 'System Admin'}</h3>
            <p className="text-[var(--clr-primary-light)] font-medium m-0 mb-1">{formatRole(currentUser?.role)}</p>
            {currentUser?.department && <p className="text-[0.85rem] text-[var(--clr-text-muted)] m-0 mb-8">{currentUser.department}</p>}
          </div>
          <div className="flex w-full justify-center gap-8 mt-auto border-t border-[var(--clr-border)] pt-6">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[var(--clr-text-heading)]">{metrics.activeAdmins}</span>
              <span className="text-[0.75rem] text-[var(--clr-text-muted)] uppercase tracking-[0.05em]">Coordinators</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-[var(--clr-text-heading)]">100%</span>
              <span className="text-[0.75rem] text-[var(--clr-text-muted)] uppercase tracking-[0.05em]">Uptime</span>
            </div>
          </div>
        </div>

        {/* Bento 2: Quick Metrics Grid */}
        <div className="col-start-2 row-start-1 grid grid-cols-2 gap-5 max-xl:col-span-2 max-xl:row-auto max-md:grid-cols-1 max-md:col-span-1">
          <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--clr-surface-2)] hover:border-[var(--clr-primary)]" onClick={() => navigate('/admin/users')}>
            <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center bg-[rgba(59,130,246,0.1)] text-[#3b82f6]"><Users size={20} /></div>
            <div>
              <h3 className="m-0 text-2xl text-[var(--clr-text-heading)] leading-[1.2]">{metrics.totalUsers}</h3>
              <p className="m-0 text-[0.85rem] text-[var(--clr-text-muted)]">Total Users</p>
            </div>
          </div>
          <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--clr-surface-2)] hover:border-[var(--clr-primary)]" onClick={() => navigate('/admin/events')}>
            <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center bg-[rgba(168,85,247,0.1)] text-[#a855f7]"><Calendar size={20} /></div>
            <div>
              <h3 className="m-0 text-2xl text-[var(--clr-text-heading)] leading-[1.2]">{metrics.totalEvents}</h3>
              <p className="m-0 text-[0.85rem] text-[var(--clr-text-muted)]">Events Managed</p>
            </div>
          </div>
          <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--clr-surface-2)] hover:border-[var(--clr-primary)]" onClick={() => navigate('/admin/documents')}>
            <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center bg-[rgba(249,115,22,0.1)] text-[#f97316]"><FileText size={20} /></div>
            <div>
              <h3 className="m-0 text-2xl text-[var(--clr-text-heading)] leading-[1.2]">{metrics.pendingDocs}</h3>
              <p className="m-0 text-[0.85rem] text-[var(--clr-text-muted)]">Pending Docs</p>
            </div>
          </div>
          <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex items-center gap-5 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--clr-surface-2)] hover:border-[var(--clr-primary)]" onClick={() => navigate('/admin/audit')}>
            <div className="w-12 h-12 rounded-[var(--radius-lg)] flex items-center justify-center bg-[rgba(34,197,94,0.1)] text-[#22c55e]"><Activity size={20} /></div>
            <div>
              <h3 className="m-0 text-2xl text-[var(--clr-text-heading)] leading-[1.2]">Live</h3>
              <p className="m-0 text-[0.85rem] text-[var(--clr-text-muted)]">System Logs</p>
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
        <div className="bg-[var(--clr-surface)] border border-[var(--clr-border)] rounded-[var(--radius-xl)] p-6 flex flex-col relative overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)] col-start-3 row-span-2 max-xl:col-start-2 max-xl:row-span-1 max-md:col-span-1 max-md:col-start-1">
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
}
"""

content = content[:content.find("  if (loading) {")] + new_render

with open('d:/Projects/Spectrum-main/frontend/src/components/AdminOverview.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
