import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import './AdminEvents.css';

const EvaluatorPortal = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [scoresDict, setScoresDict] = useState({}); // Pre-existing scores mapping: regId -> ScoreDoc
  
  // Scoring state
  const [scoringTeam, setScoringTeam] = useState(null);
  const [currentScores, setCurrentScores] = useState({});
  const [currentRemarks, setCurrentRemarks] = useState('');
  const [submittingScore, setSubmittingScore] = useState(false);

  const evaluatorInfo = JSON.parse(localStorage.getItem('evaluatorInfo') || '{}');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/evaluator/assignments`, { withCredentials: true });
      if (res.data.success) {
        setAssignments(res.data.assignments);
        if (res.data.assignments.length > 0) {
          handleSelectAssignment(res.data.assignments[0]);
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/evaluator/login');
      } else {
        alert('Failed to load assignments');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssignment = async (assignment) => {
    setActiveAssignment(assignment);
    setScoringTeam(null);
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/evaluator/assignments/${assignment.eventId}/${assignment.roundNumber}/participants`, { withCredentials: true });
      if (res.data.success) {
        setParticipants(res.data.registrations);
        const sDict = {};
        res.data.scores.forEach(s => sDict[s.registration] = s);
        setScoresDict(sDict);
      }
    } catch (err) {
      alert('Error fetching participants');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/evaluator/logout`, {}, { withCredentials: true });
      localStorage.removeItem('evaluatorInfo');
      navigate('/evaluator/login');
    } catch {
      navigate('/evaluator/login');
    }
  };

  const openScoring = (team) => {
    setScoringTeam(team);
    const existing = scoresDict[team._id];
    if (existing) {
      const scoresMap = {};
      existing.scores.forEach(s => scoresMap[s.criteriaName] = s.score);
      setCurrentScores(scoresMap);
      setCurrentRemarks(existing.remarks || '');
    } else {
      // Initialize with empty
      const scoresMap = {};
      activeAssignment.criteria.forEach(c => scoresMap[c.name] = '');
      setCurrentScores(scoresMap);
      setCurrentRemarks('');
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    setSubmittingScore(true);

    const scoresArray = activeAssignment.criteria.map(c => ({
      criteriaName: c.name,
      score: Number(currentScores[c.name]) || 0
    }));

    try {
      const payload = {
        eventId: activeAssignment.eventId,
        roundNumber: activeAssignment.roundNumber,
        registrationId: scoringTeam._id,
        scores: scoresArray,
        remarks: currentRemarks
      };

      const res = await axios.post(`${API_URL}/api/evaluator/score`, payload, { withCredentials: true });
      if (res.data.success) {
        setScoresDict(prev => ({ ...prev, [scoringTeam._id]: res.data.score }));
        setScoringTeam(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setSubmittingScore(false);
    }
  };

  if (loading && assignments.length === 0) return <Loader fullScreen text="Loading portal..." />;

  const isComplete = (teamId) => !!scoresDict[teamId];
  const completedCount = participants.filter(p => isComplete(p._id)).length;

  return (
    <div className="ae-wrapper">
      <header className="ae-header glass">
        <div className="ae-header-left">
          <h1 className="ae-title">Jury Dashboard</h1>
          <p className="ae-subtitle">Welcome, {evaluatorInfo.name}</p>
        </div>
        <button className="btn btn-outline" style={{ borderColor: '#f87171', color: '#f87171' }} onClick={handleLogout}>
          Log out
        </button>
      </header>

      {assignments.length === 0 ? (
        <div className="ae-empty">
          <span>📋</span>
          <p>You have not been assigned to evaluate any rounds yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexDirection: window.innerWidth > 900 ? 'row' : 'column' }}>
          
          {/* Assignments Sidebar */}
          <div className="ae-tabs-container" style={{ flex: '0 0 250px', height: 'fit-content', flexDirection: 'column', display: 'flex' }}>
            <h4 style={{ padding: '12px', margin: 0, color: 'var(--clr-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Assignments</h4>
            {assignments.map(ar => (
              <button 
                key={`${ar.eventId}-${ar.roundNumber}`}
                className={`ae-tab ${activeAssignment?.eventId === ar.eventId && activeAssignment?.roundNumber === ar.roundNumber ? 'active' : ''}`}
                style={{ justifyContent: 'flex-start', padding: '12px 16px', borderRadius: '8px' }}
                onClick={() => handleSelectAssignment(ar)}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '600' }}>{ar.eventTitle}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Round {ar.roundNumber} - {ar.roundName}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {activeAssignment && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: 'var(--clr-text-heading)' }}>
                    Teams to Evaluate ({completedCount} / {participants.length} scored)
                  </h3>
                </div>

                <div className="ae-table-wrapper glass">
                  <table className="ae-table">
                    <thead>
                      <tr>
                        <th className="ae-td-num">#</th>
                        <th>Team & Leader</th>
                        <th>Status</th>
                        <th>Score</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.length === 0 && (
                         <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'gray' }}>No teams active in this round yet.</td></tr>
                      )}
                      {participants.map((p, idx) => {
                        const scoreDoc = scoresDict[p._id];
                        return (
                          <tr key={p._id}>
                            <td className="ae-td-num">{idx + 1}</td>
                            <td>
                              <div className="ae-team-group">
                                <div className="ae-team-header">
                                  <strong>{p.teamName}</strong>
                                </div>
                                <div className="ae-leader-info">
                                  <span>{p.teamLeader?.name}</span>
                                  <code>{p.teamLeader?.registerNumber}</code>
                                </div>
                              </div>
                            </td>
                            <td>
                              {scoreDoc ? (
                                <span className="ae-member-pill" style={{ color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)', background: 'rgba(74, 222, 128, 0.1)' }}>Completed</span>
                              ) : (
                                <span className="ae-member-pill" style={{ color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)', background: 'rgba(251, 191, 36, 0.1)' }}>Pending</span>
                              )}
                            </td>
                            <td>
                              {scoreDoc ? <strong>{scoreDoc.totalScore} pts</strong> : '-'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className={`btn btn-sm ${scoreDoc ? 'btn-outline' : 'btn-primary'}`} onClick={() => openScoring(p)}>
                                {scoreDoc ? 'Edit Score' : 'Evaluate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scoring Modal */}
      {scoringTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div className="ae-form-card glass-strong animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '25px', borderRadius: '16px' }}>
            <h2 style={{ marginTop: 0, color: 'var(--clr-primary)' }}>Evaluating: {scoringTeam.teamName}</h2>
            <p style={{ color: 'var(--clr-text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Leader: {scoringTeam.teamLeader?.name}</p>

            <form onSubmit={handleSubmitScore}>
              {activeAssignment.criteria.map(c => (
                <div key={c.name} className="form-group" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>{c.name}</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>Max: {c.maxScore}</span>
                  </div>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min="0" 
                    max={c.maxScore} 
                    step="0.5"
                    value={currentScores[c.name] ?? ''}
                    onChange={e => setCurrentScores(prev => ({ ...prev, [c.name]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="form-group" style={{ marginTop: '15px' }}>
                <label className="form-label">Remarks / Feedback (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  rows={3}
                  value={currentRemarks}
                  onChange={e => setCurrentRemarks(e.target.value)}
                  placeholder="Private notes on the team's performance"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submittingScore}>
                  {submittingScore ? 'Saving...' : 'Submit Score'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setScoringTeam(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EvaluatorPortal;
