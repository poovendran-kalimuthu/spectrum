import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Users, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Globe, 
  Lock, 
  X, 
  Star,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  DollarSign,
  GraduationCap,
  Layers,
  FileText,
  Video
} from 'lucide-react';
import Loader from './Loader';
import { API_URL } from '../config';
import './Login.css';
import bannerIllustration from '../assets/banner_award.jpg';

const Login = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [redirectText, setRedirectText] = useState('Redirecting to Google…');

  const handleGoogleLogin = () => {
    setRedirectText('Redirecting to Google…');
    setLoading(true);
    setTimeout(() => setShowTip(true), 8000);
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    setRedirectText('Redirecting to College ID…');
    setLoading(true);
    setTimeout(() => setShowTip(true), 8000);
    window.location.href = `${API_URL}/api/auth/microsoft`;
  };

  return (
    <div className="meetup-home">
      {loading && (
        <Loader
          fullScreen
          text={showTip ? 'Waking up server… (Render free tier takes ~30s)' : redirectText}
        />
      )}

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <a className="nav-logo" href="#">
            <div className="nav-logo-icon">S</div>
            <span className="nav-logo-name">spectrum</span>
          </a>
          <div className="nav-links">
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Explore</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Rules</a>
            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Log in</a>
            <button className="btn-primary" onClick={() => setShowAuthModal(true)}>Sign up — it's free</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="animate">
            <div className="hero-eyebrow">
              <div className="hero-eyebrow-dot"></div>
              University Event Portal
            </div>
            <h1 className="hero-title">Manage your campus <span>events</span>,<br />seamlessly</h1>
            <p className="hero-subtitle">Team registrations, document approvals, evaluation metrics, and real-time dashboard tracking — built for coordinators and students.</p>
            <div className="hero-search">
              <input className="hero-search-input" type="text" placeholder="Search events, hackathons, symposiums…" onClick={() => setShowAuthModal(true)} readOnly />
              <button className="btn-primary" style={{ padding: '12px 24px' }} onClick={() => setShowAuthModal(true)}>
                <Search size={16} />
                Search
              </button>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-num">1,200+</div>
                <div className="hero-stat-label">Registrations</div>
              </div>
              <div>
                <div className="hero-stat-num">80+</div>
                <div className="hero-stat-label">Teams Formed</div>
              </div>
              <div>
                <div className="hero-stat-num">24+</div>
                <div className="hero-stat-label">Events Managed</div>
              </div>
            </div>
          </div>
          <div className="hero-visual animate delay-2">
            <img className="hero-city-img" src={bannerIllustration} alt="Spectrum Dashboard Hero Illustration" />
            <div className="hero-card-float">
              <div className="hero-card-float-label">Next Deadline</div>
              <div className="hero-card-float-event">Genesis 2026: Project Abstract Submission</div>
              <div className="hero-card-float-meta">
                <Calendar size={13} style={{ color: 'var(--c-magenta)' }} />
                <span>Due in 2 days</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="section">
        <div className="container">
          <div className="section-header-row animate">
            <div>
              <div className="section-label">Discover</div>
              <h2 className="section-title">Active Events</h2>
            </div>
            <a href="#" className="btn-outline" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Browse all events →</a>
          </div>

          <div className="category-strip animate delay-1">
            <a href="#" className="cat-pill active" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>🌐 All</a>
            <a href="#" className="cat-pill" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>💻 Technology</a>
            <a href="#" className="cat-pill active-mag" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>🎨 Cultural</a>
            <a href="#" className="cat-pill" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>⚙️ Technical</a>
            <a href="#" className="cat-pill" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>🔬 Workshops</a>
            <a href="#" className="cat-pill" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>📈 Management</a>
          </div>

          <div className="events-grid animate delay-2">
            {/* Card 1 */}
            <div className="event-card" onClick={() => setShowAuthModal(true)}>
              <img className="event-img" src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&auto=format&fit=crop&q=60" alt="Genesis 2026 Hackathon" />
              <div className="event-body">
                <span className="event-badge online">💻 Hybrid</span>
                <div className="event-title">Genesis 2026: 36-Hour National Hackathon</div>
                <div className="event-date">Thu, Jun 25 · 9:00 AM</div>
                <div className="event-meta">
                  <MapPin size={13} style={{ marginRight: '4px' }} />
                  CSE Department Lab
                </div>
                <div className="event-attendees">
                  <img src="https://secure.meetupstatic.com/photos/member/2/e/7/b/thumb_324251899.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/3/9/a/1/thumb_320894753.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/4/c/e/b/thumb_325339691.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <span>84 teams registered</span>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="event-card" onClick={() => setShowAuthModal(true)}>
              <img className="event-img" src="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&auto=format&fit=crop&q=60" alt="ElectroQuest" />
              <div className="event-body">
                <span className="event-badge">🔬 In Person</span>
                <div className="event-title">ElectroQuest: IoT Challenge &amp; Circuit Design</div>
                <div className="event-date">Sat, Jun 27 · 10:00 AM</div>
                <div className="event-meta">
                  <MapPin size={13} style={{ marginRight: '4px' }} />
                  ECE Lab 402
                </div>
                <div className="event-attendees">
                  <img src="https://secure.meetupstatic.com/photos/member/6/0/d/c/thumb_322344796.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/6/6/8/d/thumb_314366253.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <span>32 teams registered</span>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="event-card" onClick={() => setShowAuthModal(true)}>
              <img className="event-img" src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop&q=60" alt="Cyberia CTF" />
              <div className="event-body">
                <span className="event-badge">🛡️ Online</span>
                <div className="event-title">Cyberia: Cybersecurity &amp; Capture The Flag (CTF)</div>
                <div className="event-date">Fri, Jun 26 · 6:00 PM</div>
                <div className="event-meta">
                  <MapPin size={13} style={{ marginRight: '4px' }} />
                  Virtual Platform
                </div>
                <div className="event-attendees">
                  <img src="https://secure.meetupstatic.com/photos/member/8/d/1/9/thumb_325656121.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/b/0/5/7/thumb_322005143.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <span>45 teams registered</span>
                </div>
              </div>
            </div>
            {/* Card 4 */}
            <div className="event-card" onClick={() => setShowAuthModal(true)}>
              <img className="event-img" src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60" alt="CADQuest" />
              <div className="event-body">
                <span className="event-badge">⚙️ In Person</span>
                <div className="event-title">CADQuest: 3D Modeling &amp; Prototyping Challenge</div>
                <div className="event-date">Mon, Jun 29 · 1:30 PM</div>
                <div className="event-meta">
                  <MapPin size={13} style={{ marginRight: '4px' }} />
                  CAD Lab
                </div>
                <div className="event-attendees">
                  <img src="https://secure.meetupstatic.com/photos/member/c/b/c/a/thumb_325192170.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/e/4/d/c/thumb_322678588.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <img src="https://secure.meetupstatic.com/photos/member/e/5/6/f/thumb_318178735.jpeg?w=48" className="mini-avatar" alt="Member" />
                  <span>24 teams registered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY SPECTRUM */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header animate">
            <div className="section-label">Why Spectrum</div>
            <h2 className="section-title">Everything you need to<br />coordinate and compete</h2>
            <p className="section-desc">Designed from the ground up for university department heads, event coordinators, and student teams.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card animate delay-1">
              <div className="feature-icon icon-teal">
                <Users size={20} />
              </div>
              <div className="feature-title">Fast Team registrations</div>
              <p className="feature-desc">Form teams, invite teammates, and register for symposiums or hackathons with immediate verification status.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Learn team rules →</a>
            </div>
            <div className="feature-card animate delay-2">
              <div className="feature-icon icon-magenta">
                <Layers size={20} />
              </div>
              <div className="feature-title">Coordinator Dashboards</div>
              <p className="feature-desc">Monitor total metrics, verify participating teams, track audit logs, and manage event workflows with ease.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Access coordinator area →</a>
            </div>
            <div className="feature-card animate delay-3">
              <div className="feature-icon icon-neutral">
                <FileText size={20} />
              </div>
              <div className="feature-title">Seamless Document Approvals</div>
              <p className="feature-desc">Upload abstracts, slides, and payment proofs. Coordinators can approve or reject with custom feedback.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>View upload guidelines →</a>
            </div>
            <div className="feature-card animate delay-1">
              <div className="feature-icon icon-teal">
                <Video size={20} />
              </div>
              <div className="feature-title">Google Meet Integration</div>
              <p className="feature-desc">Schedule and generate secure Google Meet session links dynamically from the administrator panel.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>See integrations →</a>
            </div>
            <div className="feature-card animate delay-2">
              <div className="feature-icon icon-magenta">
                <Shield size={20} />
              </div>
              <div className="feature-title">Secure 3-Tier Hierarchy</div>
              <p className="feature-desc">Dedicated dashboard panels tailored for Super Admins, Admin T1 coordinators, and Admin T2 evaluators.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Read role definitions →</a>
            </div>
            <div className="feature-card animate delay-3">
              <div className="feature-icon icon-neutral">
                <Calendar size={20} />
              </div>
              <div className="feature-title">Interactive Event Schedules</div>
              <p className="feature-desc">A unified calendar view of active timelines, review rounds, registration deadlines, and presentation slots.</p>
              <a href="#" className="feature-link" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>View schedule →</a>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section className="section">
        <div className="container">
          <div className="section-header animate" style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto 48px' }}>
            <div className="section-label" style={{ textAlign: 'center' }}>Explore by Departments</div>
            <h2 className="section-title">Participating Branches</h2>
          </div>
          <div className="cities-grid animate delay-1">
            <div className="city-card" onClick={() => setShowAuthModal(true)}>
              <img className="city-img" src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=60" alt="Computer Science" />
              <div className="city-overlay"></div>
              <div className="city-label">
                <div className="city-name">Computer Science</div>
                <div className="city-count">12 Active Events</div>
              </div>
            </div>
            <div className="city-card" onClick={() => setShowAuthModal(true)}>
              <img className="city-img" src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&fit=crop&q=60" alt="ECE" />
              <div className="city-overlay"></div>
              <div className="city-label">
                <div className="city-name">Electronics &amp; Comm.</div>
                <div className="city-count">8 Active Events</div>
              </div>
            </div>
            <div className="city-card" onClick={() => setShowAuthModal(true)}>
              <img className="city-img" src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60" alt="IT" />
              <div className="city-overlay"></div>
              <div className="city-label">
                <div className="city-name">Information Tech.</div>
                <div className="city-count">6 Active Events</div>
              </div>
            </div>
            <div className="city-card" style={{ background: 'linear-gradient(160deg, var(--c-teal-light), var(--c-magenta-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', textAlign: 'center', padding: '24px' }}>
              <GraduationCap size={40} style={{ color: 'var(--c-teal)' }} />
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--c-text-1)' }}>Other Departments</div>
              <p style={{ fontSize: '14px', color: 'var(--c-text-2)', lineHeight: 1.5 }}>Mechanical, Civil, MBA, and more campus branches.</p>
              <button className="btn-primary" style={{ marginTop: '8px' }} onClick={() => setShowAuthModal(true)}>Explore all</button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section section-alt">
        <div className="container">
          <div className="section-header animate" style={{ maxWidth: '520px' }}>
            <div className="section-label">Real Feedback</div>
            <h2 className="section-title">Coordinators &amp; Students</h2>
            <p className="section-desc">See what our university coordinators and students think about managing events on Spectrum.</p>
          </div>
          <div className="testimonials-grid animate delay-1">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">"Managing Genesis 2026 used to take weeks of Google Forms and Sheets. With Spectrum, we verified 80+ teams and generated meeting links in under an hour."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'var(--c-teal)' }}>AK</div>
                <div>
                  <div className="testimonial-name">Aravind K.</div>
                  <div className="testimonial-role">General Coordinator · CSE Dept</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">"Forming teams and uploading document proofs was extremely fast. The dashboard was simple and kept our project team updated on approval phases."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: 'var(--c-magenta)' }}>RS</div>
                <div>
                  <div className="testimonial-name">Rohan S.</div>
                  <div className="testimonial-role">Student Participant · ECE Dept</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-quote">"As a T1 evaluator, approving document submissions and keeping track of evaluation scores across multiple rounds was absolutely seamless."</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: '#6c4fc4' }}>PR</div>
                <div>
                  <div className="testimonial-name">Dr. Priya R.</div>
                  <div className="testimonial-role">Evaluator · IT Dept</div>
                </div>
              </div>
            </div>
          </div>

          <div className="trust-bar animate delay-2">
            <div className="trust-stat">
              <div className="trust-num">1,200+</div>
              <div className="trust-label">Total registrations</div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-stat">
              <div className="trust-num">80+</div>
              <div className="trust-label">Teams Formed</div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-stat">
              <div className="trust-num">24+</div>
              <div className="trust-label">Events Tracked</div>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-stat">
              <div className="trust-num">99.9%</div>
              <div className="trust-label">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="container">
        <div className="cta-banner animate">
          <div className="cta-text">
            <h2 className="cta-title">Ready to register or coordinate?</h2>
            <p className="cta-subtitle">Log in using your university account to register for active events, form team configurations, or manage evaluator workflows.</p>
          </div>
          <div className="cta-actions">
            <button className="btn-white" onClick={() => setShowAuthModal(true)}>
              <Sparkles size={16} />
              Access Portal
            </button>
            <button className="btn-ghost" onClick={() => setShowAuthModal(true)}>Rules &amp; guidelines →</button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-top">
            <div>
              <a href="#" className="footer-brand-logo">
                <div className="footer-logo-icon">S</div>
                <span className="footer-logo-name">spectrum</span>
              </a>
              <p className="footer-tagline">Building seamless campus event coordination. Register. Upload. Succeed.</p>
              <div className="footer-social">
                <a href="#" className="footer-social-btn" aria-label="Twitter">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="footer-social-btn" aria-label="Facebook">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="footer-social-btn" aria-label="Instagram">
                  <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" className="footer-social-btn" aria-label="LinkedIn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Portal</div>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Active Events</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>User Dashboard</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Team Manager</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Evaluations</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Departments</div>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Computer Science</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Electronics &amp; Comm.</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Information Tech.</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Mechanical Eng.</a></li>
              </ul>
            </div>
            <div>
              <div className="footer-col-title">Support</div>
              <ul className="footer-links">
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Help Center</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Guidelines</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>SSO FAQ</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true); }}>Contact Coordinator</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 Spectrum Event Portal. All rights reserved.</div>
            <div className="footer-bottom-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Settings</a>
              <a href="#">Campus Rules</a>
            </div>
          </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)}>
              <X size={18} />
            </button>
            <div className="auth-modal-logo">S</div>
            <h2 className="auth-modal-title">Welcome to Spectrum</h2>
            <p className="auth-modal-subtitle">Find your team, manage your college events.</p>
            <div className="auth-btn-group">
              <button className="auth-sso-btn" onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>
              <button className="auth-sso-btn" onClick={handleMicrosoftLogin}>
                <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Sign in with College ID
              </button>
            </div>
            <div className="auth-modal-security">
              <Shield size={14} />
              Protected by Enterprise SSO
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
