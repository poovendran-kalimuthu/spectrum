import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import './WinnersBoard.css';

const WinnersBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/events/${id}/winners`, { withCredentials: true });
        if (res.data.success) {
          setEvent(res.data.event);
          setWinners(res.data.winners);
        }
      } catch (err) {
        console.error('Failed to fetch winners', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWinners();
  }, [id]);

  if (loading) return <Loader fullScreen text="Loading results..." />;
  if (!event) return <div className="wb-error"><h2>Event not found</h2><button onClick={() => navigate('/events')}>Back to Events</button></div>;

  return (
    <div className="wb-wrapper">
      <nav className="wb-nav">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/events/${id}`)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Event
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--clr-text-heading)' }}>Results</span>
        <div style={{width: 80}} />
      </nav>

      <div className="wb-content">
        <header className="wb-header">
          <h1 className="wb-title">{event.title} — Results</h1>
          <p className="wb-subtitle">Congratulations to the winners!</p>
        </header>

        {winners.length === 0 ? (
          <div className="wb-empty">
            <span className="wb-empty-icon">🏆</span>
            <h3>Results are not published yet</h3>
            <p>Check back later to see the winners for this event.</p>
          </div>
        ) : (
          <div className="wb-grid">
            {winners.map((winner, idx) => (
              <div key={winner._id} className="wb-card animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="wb-card-header">
                  <div className="wb-position-badge">
                    🏆 {winner.winnerPosition || 'Winner'}
                  </div>
                  <h3 className="wb-team-name">{winner.teamName || 'Unnamed Team'}</h3>
                </div>
                
                <div className="wb-members">
                  <h4 className="wb-section-title">Team Members</h4>
                  <div className="wb-member-list">
                    {/* Leader */}
                    <div className="wb-member-item leader">
                      <div className="wb-member-avatar">
                        {winner.teamLeader?.profilePicture ? (
                          <img src={winner.teamLeader.profilePicture} alt={winner.teamLeader.name} />
                        ) : (
                          <div className="wb-avatar-fallback">{winner.teamLeader?.name?.charAt(0) || '?'}</div>
                        )}
                        <span className="wb-leader-star">⭐</span>
                      </div>
                      <div className="wb-member-info">
                        <strong>{winner.teamLeader?.name || 'Unknown'}</strong>
                        <span>{winner.teamLeader?.department || 'Participant'}</span>
                      </div>
                    </div>
                    {/* Members */}
                    {winner.members.filter(m => m.user?._id !== winner.teamLeader?._id).map(m => (
                      <div key={m.user?._id} className="wb-member-item">
                        <div className="wb-member-avatar">
                          {m.user?.profilePicture ? (
                            <img src={m.user.profilePicture} alt={m.user.name} />
                          ) : (
                            <div className="wb-avatar-fallback">{m.user?.name?.charAt(0) || '?'}</div>
                          )}
                        </div>
                        <div className="wb-member-info">
                          <strong>{m.user?.name || 'Unknown'}</strong>
                          <span>{m.user?.department || 'Participant'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WinnersBoard;
