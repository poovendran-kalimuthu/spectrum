import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import { QRCodeCanvas } from 'qrcode.react';
import AttendanceScanner from './AttendanceScanner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminEvents.css';
import Select from './ui/Select';

const AdminParticipantManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState({ text: '', type: '' });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [scoreDetailTeam, setScoreDetailTeam] = useState(null);
  const [qrActive, setQrActive] = useState(false);
  const [qrSession, setQrSession] = useState(null);
  const [showAdminScanner, setShowAdminScanner] = useState(false);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSession, setSelectedSession] = useState('');

  const sessionMap = {
    'none': '9:00 AM - 4:00 PM',
    'day1_morning': '9:00 AM - 1:00 PM',
    'day1_afternoon': '2:00 PM - 4:00 PM',
    'day2_morning': '9:00 AM - 1:00 PM',
    'day2_afternoon': '2:00 PM - 4:00 PM'
  };

  useEffect(() => { fetchData(); }, [id]);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 3500);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evRes, regRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/events`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/events/${id}/registrations`, { withCredentials: true })
      ]);
      if (evRes.data.success) {
        const ev = evRes.data.events.find(e => e._id === id || e.slug === id);
        if (ev) {
          setEvent(ev);
          if (!selectedSession) {
            setSelectedSession(sessionMap[ev.session] || ev.session || 'Full Day');
          }
        }
      }
      if (regRes.data.success) {
        setRegistrations(regRes.data.registrations);
        setScores(regRes.data.scores || []);
      }
      // Check for active attendance session in event
      if (evRes.data.success) {
        const ev = evRes.data.events.find(e => e._id === id || e.slug === id);
        if (ev?.activeAttendance?.sessionToken) {
          setQrActive(true);
          setQrSession(ev.activeAttendance);
          setSelectedRound(ev.activeAttendance.round);
        }
      }
    } catch { showToast('Failed to load data.', 'error'); }
    finally { setLoading(false); }
  };

  /* ── Selection ── */
  const toggleSelect = (regId) => {
    const next = new Set(selected);
    next.has(regId) ? next.delete(regId) : next.add(regId);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    setSelected(
      selected.size === filteredRegistrations.length && filteredRegistrations.length > 0
        ? new Set()
        : new Set(filteredRegistrations.map(r => r._id))
    );
  };

  /* ── Filtering ── */
  const filteredRegistrations = registrations.filter(reg => {
    const q = search.toLowerCase();
    const matchesSearch =
      (reg.teamName || '').toLowerCase().includes(q) ||
      (reg.teamLeader?.name || '').toLowerCase().includes(q) ||
      (reg.teamLeader?.registerNumber || '').toLowerCase().includes(q);
    
    const matchesDept = selectedDept === 'all' || reg.teamLeader?.department === selectedDept;

    if (!matchesSearch || !matchesDept) return false;
    if (activeTab === 'all') return !reg.isShortlisted && reg.currentRound === 0 && !reg.isDisqualified && !reg.isWinner;
    if (activeTab === 'shortlisted') return reg.isShortlisted && !reg.isDisqualified && !reg.isWinner;
    if (activeTab === 'winners') return reg.isWinner;
    if (activeTab === 'disqualified') return reg.isDisqualified;
    if (activeTab.startsWith('round-')) {
      const rn = parseInt(activeTab.split('-')[1]);
      return reg.currentRound === rn && !reg.isDisqualified && !reg.isWinner;
    }
    return true;
  });

  /* ── Derive eligibility for selected teams ── */
  const selectedRegs = Array.from(selected).map(sid => registrations.find(r => r._id === sid)).filter(Boolean);
  const nonDQ = selectedRegs.filter(r => !r.isDisqualified);
  const canShortlist = nonDQ.filter(r => !r.isShortlisted && r.currentRound === 0).length;
  const canStart = nonDQ.filter(r => r.isShortlisted && r.currentRound === 0).length;    // move to R1
  const canRevert = nonDQ.filter(r => r.isShortlisted || r.currentRound > 0).length;
  const canDQ = selectedRegs.filter(r => !r.isDisqualified).length;
  const canReinstate = selectedRegs.filter(r => r.isDisqualified).length;
  const canWin = nonDQ.filter(r => !r.isWinner).length;
  const canUnwin = nonDQ.filter(r => r.isWinner).length;

  // Advance buttons — round N to N+1 (must be in exactly round N)
  const roundAdvanceButtons = [];
  if (event) {
    for (let i = 1; i < event.rounds; i++) {
      const count = nonDQ.filter(r => r.isShortlisted && r.currentRound === i).length;
      if (count > 0) roundAdvanceButtons.push({ from: i, to: i + 1, count });
    }
  }

  /* ── Bulk Action Handler ── */
  const runBulkAction = useCallback(async (type, val) => {
    if (actionLoading) return;
    setActionLoading(true);

    try {
      const allSelected = Array.from(selected);

      if (type === 'shortlist') {
        // Only non-shortlisted, non-DQ, round-0 teams
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && !r.isShortlisted && !r.isDisqualified && r.currentRound === 0;
        });
        if (!eligible.length) { showToast('No eligible teams to shortlist.', 'error'); return; }
        await axios.post(`${API_URL}/api/admin/registrations/bulk-shortlist`, { regIds: eligible, shortlist: true }, { withCredentials: true });
        setRegistrations(prev => prev.map(r => eligible.includes(r._id) ? { ...r, isShortlisted: true } : r));
        showToast(`✅ Shortlisted ${eligible.length} team(s).`);

      } else if (type === 'round') {
        // val = target round; currentRound must be val-1, must be shortlisted, not DQ
        const prevRound = val - 1;
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && r.isShortlisted && r.currentRound === prevRound && !r.isDisqualified;
        });
        if (!eligible.length) { showToast(`No teams eligible to advance to Round ${val}.`, 'error'); return; }
        await axios.post(`${API_URL}/api/admin/registrations/bulk-round`, { regIds: eligible, round: val }, { withCredentials: true });
        setRegistrations(prev => prev.map(r => eligible.includes(r._id) ? { ...r, currentRound: val } : r));
        showToast(`➡️ Moved ${eligible.length} team(s) to Round ${val}.`);

      } else if (type === 'revert') {
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && (r.isShortlisted || r.currentRound > 0) && !r.isDisqualified;
        });
        if (!eligible.length) { showToast('No teams eligible to revert.', 'error'); return; }
        const results = await Promise.all(eligible.map(sid =>
          axios.patch(`${API_URL}/api/admin/registrations/${sid}/revert-round`, {}, { withCredentials: true })
        ));
        // Only update the two fields that changed — never spread unpopulated backend doc
        const patchMap = {};
        results.forEach(res => {
          const reg = res.data.registration;
          patchMap[reg._id] = { currentRound: reg.currentRound, isShortlisted: reg.isShortlisted };
        });
        setRegistrations(prev => prev.map(r => patchMap[r._id] ? { ...r, ...patchMap[r._id] } : r));
        showToast(`⬅️ Reverted ${eligible.length} team(s) one step back.`);

      } else if (type === 'disqualify') {
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && !r.isDisqualified;
        });
        if (!eligible.length) { showToast('No teams to disqualify.', 'error'); return; }
        await Promise.all(eligible.map(sid =>
          axios.patch(`${API_URL}/api/admin/registrations/${sid}/disqualify`, {}, { withCredentials: true })
        ));
        setRegistrations(prev => prev.map(r => eligible.includes(r._id) ? { ...r, isDisqualified: true } : r));
        showToast(`🚫 Disqualified ${eligible.length} team(s).`);

      } else if (type === 'reinstate') {
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && r.isDisqualified;
        });
        if (!eligible.length) { showToast('No teams to reinstate.', 'error'); return; }
        await Promise.all(eligible.map(sid =>
          axios.patch(`${API_URL}/api/admin/registrations/${sid}/disqualify`, {}, { withCredentials: true })
        ));
        setRegistrations(prev => prev.map(r => eligible.includes(r._id) ? { ...r, isDisqualified: false } : r));
        showToast(`✅ Reinstated ${eligible.length} team(s).`);
      } else if (type === 'delete') {
        if (!window.confirm(`Are you sure you want to delete ${allSelected.length} registration(s)? This will also remove any score data. This cannot be undone.`)) {
          setActionLoading(false);
          return;
        }
        await Promise.all(allSelected.map(sid =>
          axios.delete(`${API_URL}/api/admin/registrations/${sid}`, { withCredentials: true })
        ));
        setRegistrations(prev => prev.filter(r => !allSelected.includes(r._id)));
        showToast(`Deleted ${allSelected.length} registration(s).`);
      } else if (type === 'winner' || type === 'unwinner') {
        const isWinner = type === 'winner';
        const eligible = allSelected.filter(sid => {
          const r = registrations.find(x => x._id === sid);
          return r && r.isWinner !== isWinner && !r.isDisqualified;
        });
        if (!eligible.length) { showToast(`No teams eligible to ${isWinner ? 'mark as winner' : 'remove winner status'}.`, 'error'); return; }
        
        let position = '';
        if (isWinner) {
          position = prompt("Enter Winner Position (e.g., 1st, 2nd, Runner-Up):", "");
          if (position === null) {
            setActionLoading(false);
            return; // User cancelled
          }
        }

        await axios.post(`${API_URL}/api/admin/registrations/bulk-winners`, { regIds: eligible, isWinner, position }, { withCredentials: true });
        setRegistrations(prev => prev.map(r => eligible.includes(r._id) ? { ...r, isWinner, winnerPosition: isWinner ? position : '' } : r));
        showToast(`🏆 ${isWinner ? 'Marked' : 'Removed'} ${eligible.length} team(s) as winners.`);
      }

      setSelected(new Set());
    } catch (err) {
      console.error(err);
      showToast('Action failed. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [selected, registrations, actionLoading, event]);

  const handleStartAttendance = async (roundNum) => {
    try {
      const res = await axios.post(`${API_URL}/api/attendance/start`, { eventId: event?._id || id, round: roundNum }, { withCredentials: true });
      if (res.data.success) {
        setQrActive(true);
        setQrSession(res.data.activeAttendance);
        showToast(`Attendance session started for Round ${roundNum}`);
      }
    } catch { showToast('Failed to start session.', 'error'); }
  };
  
  const departments = ['all', 'CSE', 'ECE', 'EEE', 'MECH', 'IT', 'CIVIL', 'ACT', 'VLSI', 'AIML', 'AIDS', 'CYBER', 'AUTO'];

  const generateODList = () => {
    const doc = new jsPDF();
    const tableColumn = ["S.No", "Team Name", "Full Name", "Register No", "Phone Number", "Class (Sec)", "Event Session"];
    
    // Grouping Logic
    // We'll use the 'registrations' for 'Entire list' but filtered by 'activeTab' 
    // (e.g. if we are in 'shortlisted' tab, we export all shortlisted teams grouped by Year/Dept)
    // Only export teams that are Shortlisted or in an Active Round (and not DQ)
    const teamsToExport = registrations.filter(reg => {
      const isActiveComp = reg.isShortlisted || reg.currentRound > 0;
      return isActiveComp && !reg.isDisqualified;
    });

    const groupedData = {};
    teamsToExport.forEach(reg => {
      const year = reg.teamLeader?.year || 'Other/Unspecified';
      const dept = reg.teamLeader?.department || 'General';
      
      if (!groupedData[year]) groupedData[year] = {};
      if (!groupedData[year][dept]) groupedData[year][dept] = [];
      groupedData[year][dept].push(reg);
    });

    const years = Object.keys(groupedData).sort();

    // Header Branding
    const addHeader = (doc) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(33, 33, 33);
      doc.text("Dr. Mahalingam College of Engineering and Technology", 105, 12, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(63, 81, 181);
      doc.text("ECE - Department Association", 105, 18, { align: 'center' });

      doc.setDrawColor(200);
      doc.line(20, 22, 190, 22);

      doc.setFontSize(20);
      doc.setTextColor(40, 44, 52);
      doc.text(`OD LIST`, 105, 32, { align: 'center' });

      doc.setFontSize(13);
      doc.setTextColor(63, 81, 181);
      doc.text(`${event?.title}`, 105, 39, { align: 'center' });

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      const tabText = activeTab !== 'all' ? ` - ${activeTab.toUpperCase()}` : '';
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${tabText} | Timing: ${selectedSession}`, 105, 45, { align: 'center' });
    };

    addHeader(doc);
    let currentY = 55;

    years.forEach((year) => {
      const depts = Object.keys(groupedData[year]).sort();
      
      depts.forEach((dept, dIdx) => {
        // Add new page for every department except the very first one
        if (!(year === years[0] && dIdx === 0)) {
          doc.addPage();
        }
        
        addHeader(doc);
        currentY = 55;

        // Show Year Heading only on the first department of that year? 
        // Or on every page of that year's departments?
        // Let's show it on every page for clarity since each dept is on its own page.
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        doc.setFont('helvetica', 'bold');
        doc.text(`${year.toUpperCase()} YEAR`, 105, currentY, { align: 'center' });
        currentY += 10;

        const teams = groupedData[year][dept];
        const tableRows = [];
        const rowSpans = [];
        let sNo = 1;
        let rowIndex = 0;

        teams.forEach(reg => {
          const mCount = reg.members.length;
          if (mCount > 0) {
            rowSpans.push({ index: rowIndex, span: mCount });
            rowIndex += mCount;
          }
          reg.members.forEach(m => {
            tableRows.push([
              sNo++,
              reg.teamName || 'Unnamed',
              m.user?.name || 'N/A',
              m.user?.registerNumber || 'N/A',
              m.user?.mobile || '—',
              m.user?.section || '—',
              selectedSession
            ]);
          });
        });

        doc.setFontSize(12);
        doc.setTextColor(99, 102, 241);
        doc.text(`DEPARTMENT: ${dept}`, 14, currentY);
        currentY += 4;

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: currentY,
          theme: 'grid',
          styles: { 
            font: 'helvetica',
            fontSize: 9, 
            halign: 'center', 
            valign: 'middle', 
            cellPadding: 2.5 
          },
          headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
          columnStyles: {
            0: { cellWidth: 10 }, // S.No
            1: { cellWidth: 32, fontStyle: 'bold' }, // Team Name
            2: { cellWidth: 45, halign: 'left' },   // Full Name
            3: { cellWidth: 25 }, // Reg No
            4: { cellWidth: 28 }, // Phone
            5: { cellWidth: 15 }, // Sec
            6: { cellWidth: 30 }  // Session
          },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 1) {
              const spanInfo = rowSpans.find(s => s.index === data.row.index);
              if (spanInfo) data.cell.rowSpan = spanInfo.span;
            }
          }
        });
      });
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} | Helix-26 Spectrum Management`, 105, 288, { align: 'center' });
    }

    doc.save(`${event?.title}_Full_OD_List.pdf`);
  };

  const generateEvaluationReport = () => {
    if (!activeRoundNum) return showToast('Please select a specific round first', 'error');
    
    const doc = new jsPDF();
    const tableColumn = ["S.No", "Team Name", "Members", "Judge", "Score"];
    
    const tableRows = [];
    const rowSpans = [];
    let sNo = 1;
    let rowIndex = 0;

    filteredRegistrations.forEach(reg => {
      const teamScoreInfo = getTeamScoreInfo(reg._id);
      if (!teamScoreInfo) return; // Skip if no scores

      const scores = teamScoreInfo.all;
      const mCount = scores.length;
      
      rowSpans.push({ index: rowIndex, span: mCount });
      
      scores.forEach((s, idx) => {
        const judgeName = s.evaluator?.name || 'Unknown';
        const totalScore = s.totalScore;
        const criteriaList = s.scores.map(m => `${m.criteriaName}: ${m.score}`).join('\n');
        const remarks = s.remarks ? `\nRemarks: ${s.remarks}` : '';

        tableRows.push([
          idx === 0 ? sNo++ : '',
          idx === 0 ? reg.teamName : '',
          idx === 0 ? reg.members.map(m => m.user?.name).join(', ') : '',
          judgeName,
          `${totalScore}\n(${criteriaList})${remarks}`
        ]);
      });
      rowIndex += mCount;
    });

    if (tableRows.length === 0) {
      showToast('No scores found for this round.', 'error');
      return;
    }

    // Branding Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("Dr. Mahalingam College of Engineering and Technology", 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("ECE Department Association - SPECTRUM", 105, 22, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(20, 26, 190, 26);

    doc.setFontSize(16);
    doc.setTextColor(40, 44, 52);
    doc.text(`EVALUATION REPORT - ROUND ${activeRoundNum}`, 105, 36, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(63, 81, 181);
    doc.text(event?.title || 'Evaluation', 105, 43, { align: 'center' });

    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 50, { align: 'center' });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', valign: 'middle', cellPadding: 2 },
      headStyles: { fillColor: [63, 81, 181], textColor: 255 },
      columnStyles: {
        1: { cellWidth: 35, halign: 'left', fontStyle: 'bold' }, // Team Name
        2: { cellWidth: 40, halign: 'left' },                   // Members
        3: { cellWidth: 30, halign: 'left' },                   // Judge
        4: { cellWidth: 70, halign: 'left' }                    // Score & Remarks
      },
      didParseCell: function (data) {
        if (data.section === 'body' && (data.column.index === 0 || data.column.index === 1 || data.column.index === 2)) {
          const spanInfo = rowSpans.find(s => s.index === data.row.index);
          if (spanInfo) {
            data.cell.rowSpan = spanInfo.span;
          }
        }
      }
    });

    doc.save(`${event?.title}_Round_${activeRoundNum}_Evaluation.pdf`);
  };

  const handleEndAttendance = async () => {
    try {
      await axios.post(`${API_URL}/api/attendance/end`, { eventId: event?._id || id }, { withCredentials: true });
      setQrActive(false);
      setQrSession(null);
      showToast('Attendance session ended.');
    } catch { showToast('Failed to end session.', 'error'); }
  };

  const toggleAttendance = async (regId, roundNum) => {
    try {
      const reg = registrations.find(r => r._id === regId);
      const targetRound = roundNum || 1; // Default to Round 1 if not specified (e.g. from Shortlisted tab)
      const isPresent = reg.attendance?.some(a => a.round === targetRound);
      
      setActionLoading(true);
      const res = await axios.post(`${API_URL}/api/attendance/manual`, { 
        registrationId: regId, 
        round: targetRound, 
        status: isPresent ? 'Absent' : 'Present' 
      }, { withCredentials: true });
      
      if (res.data.success) {
        setRegistrations(prev => prev.map(r => r._id === regId ? res.data.registration : r));
        showToast(`Attendance updated for ${reg.teamName}`);
      }
    } catch { showToast('Failed to update attendance.', 'error'); }
    finally { setActionLoading(false); }
  };

  const counts = {
    all: registrations.filter(r => !r.isShortlisted && r.currentRound === 0 && !r.isDisqualified && !r.isWinner).length,
    shortlisted: registrations.filter(r => r.isShortlisted && !r.isDisqualified && !r.isWinner).length,
    winners: registrations.filter(r => r.isWinner).length,
    dq: registrations.filter(r => r.isDisqualified).length,
  };
  for (let i = 1; i <= (event?.rounds || 0); i++) {
    counts[`round-${i}`] = registrations.filter(r => r.currentRound === i && !r.isDisqualified && !r.isWinner).length;
  }

  // Active round config if tab is round-N
  const activeRoundNum = activeTab.startsWith('round-') ? parseInt(activeTab.split('-')[1]) : null;
  const activeRoundConfig = event?.roundConfig?.find(r => r.roundNumber === activeRoundNum);
  const isJuryRound = activeRoundConfig?.evaluationType === 'jury';

  const getTeamScoreInfo = (regId) => {
    const teamScores = scores.filter(s => s.registration === regId && s.roundNumber === activeRoundNum);
    if (!teamScores.length) return null;
    
    const avg = teamScores.reduce((sum, s) => sum + s.totalScore, 0) / teamScores.length;
    return { avg: avg.toFixed(1), count: teamScores.length, all: teamScores };
  };

  // if (loading) return <Loader fullScreen text="Loading participant lists..." />;
  if (!loading && !event) return <div className="ae-error"><h2>Event not found</h2><button onClick={() => navigate('/admin/events')}>Back</button></div>;

  const allSelected = selected.size === filteredRegistrations.length && filteredRegistrations.length > 0;

  return (
    <div className="ae-wrapper">
      {toast.text && <div className={`ae-toast status-alert ${toast.type}`}>{toast.text}</div>}

      {/* ── Header ── */}
      <header className="ae-header glass">
        <div className="ae-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}`)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div>
            <h1 className="ae-title">{event?.title}</h1>
            <p className="ae-subtitle">Participant Management · {event?.rounds} Round{event?.rounds !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="ae-header-right no-print">
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/attendance`)}>
            📅 Attendance Tracking
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/evaluators`)}>
            🧑‍⚖️ Manage Evaluators
          </button>
          {(event?.title?.toLowerCase()?.includes('innovator') || event?.roundConfig?.some(r => r.evaluationType === 'jury')) && (
            <button className="btn btn-accent btn-sm" onClick={() => navigate(`/admin/events/${event?.slug || event?._id || id}/project-review`)}>
              📁 Review Project Details
            </button>
          )}
          
          {/* Admin Scanner Trigger */}
          {(event?.attendanceMode === 'admin_scan' || event?.attendanceMode === 'both') && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdminScanner(true)}>
              📷 Scan Participant
            </button>
          )}

          <button className="btn btn-accent btn-sm" onClick={generateEvaluationReport}>🏆 Export Evaluation Report</button>
          
          <div className="ae-search-box">
            <Select 
              value={selectedDept} 
              onChange={e => setSelectedDept(e.target.value)}
              className="form-input"
              style={{ width: 'auto' }}
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </option>
              ))}
            </Select>
            <input 
              type="text" 
              placeholder="Search team or leader…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="form-input" 
              style={{ flex: 1 }}
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={generateODList}>📄 Export OD List (PDF)</button>
        </div>
      </header>

      {loading && (
        <div style={{ padding: '6rem 0' }}>
          <Loader text="Fetching participant data..." />
        </div>
      )}

      {/* ── Bulk Actions Bar ── */}
      {selected.size > 0 && (
        <div className="ae-bulk-bar glass animate-fade-in no-print">
          <div className="ae-bulk-info">
            <strong>{selected.size}</strong>&nbsp;team{selected.size > 1 ? 's' : ''} selected
          </div>
          <div className="ae-bulk-divider" />
          <div className="ae-bulk-btns">
            {canShortlist > 0 && (
              <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => runBulkAction('shortlist')}>
                ⭐ Shortlist <span className="ae-count-badge">{canShortlist}</span>
              </button>
            )}
            {canStart > 0 && (
              <button className="btn btn-sm btn-primary" disabled={actionLoading} onClick={() => runBulkAction('round', 1)}>
                ▶ Start Round 1 <span className="ae-count-badge">{canStart}</span>
              </button>
            )}
            {roundAdvanceButtons.map(btn => (
              <button key={btn.to} className="btn btn-sm btn-accent" disabled={actionLoading} onClick={() => runBulkAction('round', btn.to)}>
                ➡ R{btn.from}→R{btn.to} <span className="ae-count-badge">{btn.count}</span>
              </button>
            ))}
            {canRevert > 0 && (
              <button className="btn btn-sm btn-ghost" disabled={actionLoading} onClick={() => runBulkAction('revert')}>
                ⬅ Revert <span className="ae-count-badge">{canRevert}</span>
              </button>
            )}
            {canDQ > 0 && (
              <button className="btn btn-sm btn-danger" disabled={actionLoading} onClick={() => runBulkAction('disqualify')}>
                🚫 Disqualify <span className="ae-count-badge">{canDQ}</span>
              </button>
            )}
            {canReinstate > 0 && (
              <button className="btn btn-sm btn-success" disabled={actionLoading} onClick={() => runBulkAction('reinstate')}>
                ✅ Reinstate <span className="ae-count-badge">{canReinstate}</span>
              </button>
            )}
            {canWin > 0 && (
              <button className="btn btn-sm" style={{ background: 'var(--accent)', color: '#000' }} disabled={actionLoading} onClick={() => runBulkAction('winner')}>
                🏆 Mark Winners <span className="ae-count-badge">{canWin}</span>
              </button>
            )}
            {canUnwin > 0 && (
              <button className="btn btn-sm btn-ghost" disabled={actionLoading} onClick={() => runBulkAction('unwinner')}>
                Remove Winners <span className="ae-count-badge">{canUnwin}</span>
              </button>
            )}
            <button className="btn btn-sm btn-danger" disabled={actionLoading} onClick={() => runBulkAction('delete')} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete Selected
            </button>
          </div>
          <button className="btn btn-ghost btn-sm ae-bulk-cancel" onClick={() => setSelected(new Set())}>✕</button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="ae-tabs-container glass no-print">
        <div className="ae-tabs">
          {[
            { key: 'all', label: 'Registered Participants' },
            { key: 'shortlisted', label: 'Shortlisted' },
            ...[...Array(event?.rounds || 0)].map((_, i) => ({ key: `round-${i+1}`, label: `Round ${i+1}` })),
            { key: 'winners', label: '🏆 Winners' },
            { key: 'disqualified', label: 'Disqualified', danger: true }
          ].map(tab => {
            const currentCount = counts[tab.key] !== undefined ? counts[tab.key] : counts.dq;
            let limit = null;
            if (tab.key === 'shortlisted' && event?.maxShortlisted > 0) limit = event.maxShortlisted;
            if (tab.key === 'winners' && event?.numberOfWinners > 0) limit = event.numberOfWinners;
            if (tab.key.startsWith('round-')) {
              const rNum = parseInt(tab.key.split('-')[1]);
              const rCfg = event?.roundConfig?.find(rc => rc.roundNumber === rNum);
              if (rCfg?.maxAdvance > 0) limit = rCfg.maxAdvance;
            }

            return (
              <button
                key={tab.key}
                className={`ae-tab${tab.danger ? ' ae-tab-danger' : ''}${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setSelected(new Set()); }}
              >
                {tab.label} 
                <span className={`ae-tab-count ${limit && currentCount >= limit ? 'limit-reached' : ''}`}>
                  {currentCount}{limit ? ` / ${limit}` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="ae-list-results animate-fade-in">
        {filteredRegistrations.length === 0 ? (
          <div className="ae-empty"><span>📭</span><p>No teams in this category.</p></div>
        ) : (
          <div className="ae-table-wrapper card glass hide-on-mobile">
            <table className="ae-table printable">
              <thead>
                <tr>
                  <th className="no-print ae-th-check">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="ae-th-num">#</th>
                  <th className="ae-th-team">Team & Members</th>
                  <th className="hide-mobile ae-th-leader">Leader</th>
                  <th className="hide-mobile ae-th-time">Reg. Time</th>
                  {isJuryRound && <th className="ae-th-score">Jury Score</th>}
                  {activeTab !== 'attendance' && <th className="ae-th-status">Status</th>}
                  {activeTab.startsWith('round-') && <th className="ae-th-at">At.</th>}
                  {activeTab === 'shortlisted' && <th className="ae-th-at">At. (R1)</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, i) => {
                  const scoreInfo = isJuryRound ? getTeamScoreInfo(reg._id) : null;
                  const attendedThisRound = reg.attendance?.some(a => a.round === activeRoundNum);
                  return (
                    <tr
                      key={reg._id}
                    className={[
                      selected.has(reg._id) ? 'selected-row' : '',
                      reg.isDisqualified ? 'disqualified-row' : ''
                    ].filter(Boolean).join(' ')}
                    onClick={() => toggleSelect(reg._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="no-print ae-td-check" onClick={e => { e.stopPropagation(); toggleSelect(reg._id); }}>
                      <input type="checkbox" checked={selected.has(reg._id)} onChange={() => {}} />
                    </td>
                    <td className="ae-td-num">
                      <span className="ae-row-num">#{i + 1}</span>
                    </td>
                    <td data-label="Team">
                      <div className="ae-team-group">
                        <div className="ae-team-header">
                          <strong>{reg.teamName || 'Unnamed Team'}</strong>
                          {reg.isDisqualified && <span className="badge badge-danger">🚫 DQ</span>}
                          {reg.isWinner && reg.winnerPosition && <span className="badge" style={{ background: 'var(--accent)', color: '#000', marginLeft: '6px' }}>🏆 {reg.winnerPosition}</span>}
                        </div>
                        <div className="ae-member-pills">
                          {reg.members.map((m, idx) => (
                            <span
                              key={m.user?._id || idx}
                              className={`ae-member-pill${m.user?._id === reg.teamLeader?._id ? ' leader' : ''}`}
                            >
                              {m.user?.name || 'Unknown'}
                              <small className="ae-roll"> · {m.user?.registerNumber || 'N/A'}</small>
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile" data-label="Leader">
                      <div className="ae-leader-info">
                        <strong>{reg.teamLeader?.name || 'Unknown'}</strong>
                        <code>{reg.teamLeader?.registerNumber || 'N/A'}</code>
                        <small>{reg.teamLeader?.department || '—'}</small>
                      </div>
                    </td>
                    <td className="hide-mobile" data-label="Reg Time" style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                      {new Date(reg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    {isJuryRound && (
                      <td data-label="Score">
                        {scoreInfo ? (
                          <div className="ae-score-cell" onClick={(e) => { e.stopPropagation(); setScoreDetailTeam({ reg, scoreInfo }); }}>
                            <strong className="ae-score-avg">{scoreInfo.avg}</strong>
                            <small className="ae-score-count">({scoreInfo.count} judges)</small>
                          </div>
                        ) : (
                          <span className="ae-score-none">No scores yet</span>
                        )}
                      </td>
                    )}
                    {activeTab !== 'attendance' && (
                    <td data-label="Status">
                      <div className="ae-status-stack">
                        {reg.isDisqualified ? (
                          <span className="badge badge-danger">Disqualified</span>
                        ) : reg.isWinner ? (
                          <span className="badge" style={{ background: 'var(--accent)', color: '#000' }}>🏆 Winner</span>
                        ) : reg.currentRound > 0 ? (
                          <>
                            <span className="badge badge-success">⭐ Shortlisted</span>
                            <span className="badge badge-accent">Round {reg.currentRound}</span>
                          </>
                        ) : reg.isShortlisted ? (
                          <span className="badge badge-success">⭐ Shortlisted</span>
                        ) : (
                          <span className="badge badge-muted">Registered</span>
                        )}
                      </div>
                    </td>
                    )}
                    {(activeTab.startsWith('round-') || activeTab === 'shortlisted') && (
                      <td data-label="At.">
                         <div 
                           className={`ae-at-indicator ${reg.attendance?.some(a => a.round === (activeRoundNum || 1)) ? 'present' : 'absent'}`}
                           onClick={(e) => { e.stopPropagation(); toggleAttendance(reg._id, activeRoundNum || 1); }}
                           title={reg.attendance?.some(a => a.round === (activeRoundNum || 1)) ? 'Marked Present' : 'Marked Absent'}
                         >
                           {reg.attendance?.some(a => a.round === (activeRoundNum || 1)) ? '✅' : '❌'}
                         </div>
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Score Details Modal */}
      {scoreDetailTeam && (
        <div className="ae-modal-overlay" onClick={() => setScoreDetailTeam(null)}>
          <div className="ae-modal glass-strong animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="ae-modal-header">
              <h3>Scores: {scoreDetailTeam.reg.teamName}</h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setScoreDetailTeam(null)}>✕</button>
            </div>
            <div className="ae-modal-body">
              {scoreDetailTeam.scoreInfo.all.map((s, idx) => (
                <div key={idx} className="ae-score-detail-card">
                  <div className="ae-score-detail-header">
                    <strong>Judge: {s.evaluator?.name || 'Unknown'}</strong>
                    <span className="ae-score-total">{s.totalScore} pts</span>
                  </div>
                  <div className="ae-score-metrics">
                    {s.scores.map(m => (
                      <div key={m.criteriaName} className="ae-score-metric">
                        <span>{m.criteriaName}</span>
                        <strong>{m.score}</strong>
                      </div>
                    ))}
                  </div>
                  {s.remarks && (
                    <div className="ae-score-remarks">
                      <small>Remarks: {s.remarks}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selection hint when nothing selected */}
      {selected.size === 0 && filteredRegistrations.length > 0 && (
        <p className="ae-hint no-print">☝️ Click rows or use the checkbox to select teams, then use the action bar above.</p>
      )}

      {/* Admin QR Scanner Modal */}
      {showAdminScanner && (
        <AttendanceScanner 
          eventId={id} 
          isAdminScanner={true}
          initialRound={event?.activeAttendance?.round || 1}
          eventRounds={event?.rounds || 1}
          onComplete={(msg) => {
            showToast(msg || `Participant checked in!`);
            setShowAdminScanner(false);
            fetchData();
          }}
          onCancel={() => setShowAdminScanner(false)}
        />
      )}
    </div>
  );
};

export default AdminParticipantManagement;
