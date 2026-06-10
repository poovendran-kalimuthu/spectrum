import React, { useState } from 'react';
import { Shield, Layers, ArrowRight, Sparkles, ChevronRight, BarChart2, Zap, Key, Cloud } from 'lucide-react';
import Loader from './Loader';
import { API_URL } from '../config';
import './Login.css';
import LightRays from './LightRays';
// Custom UI Mockup Component matching premium dashboard aesthetics
const HeroIllustrationUI = () => (
  <div className="relative flex items-center justify-center ln-ui-mockup mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
    {/* Background glow */}
    <div className="absolute inset-0 bg-[#5b6ef5]/10 blur-[80px] sm:blur-[100px] rounded-full pointer-events-none" />

    {/* Main Dashboard Card */}
    <div className="relative z-10 w-full max-w-[380px] bg-[#0a0a16]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b6ef5]/20 flex items-center justify-center text-[#5b6ef5]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-medium text-sm sm:text-base tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--clr-text-heading)' }}>Genesis 2026</h3>
            <p className="text-[11px] sm:text-xs" style={{ color: 'var(--clr-text-subtle)' }}>Main Tech Festival</p>
          </div>
        </div>
        <div className="px-2.5 py-1 sm:px-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
        </div>
      </div>

      {/* Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-default group">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs mb-2 transition-colors group-hover:text-gray-300" style={{ color: 'var(--clr-text-muted)' }}>
              <Layers size={14} /> Registrations
            </div>
            <div className="font-bold text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--clr-text-heading)' }}>1,248</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-default group">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs mb-2 transition-colors group-hover:text-gray-300" style={{ color: 'var(--clr-text-muted)' }}>
              <Shield size={14} /> Verified Teams
            </div>
            <div className="font-bold text-2xl sm:text-3xl tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--clr-text-heading)' }}>84</div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium tracking-wide" style={{ color: 'var(--clr-text-heading)' }}>Recent Activity</span>
            <span className="text-[#5b6ef5] text-[10px] sm:text-xs cursor-pointer hover:underline font-medium">View All</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
              <Key size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium truncate" style={{ color: 'var(--clr-text-heading)' }}>New team "CyberKnights" joined</p>
              <p className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: 'var(--clr-text-subtle)' }}>2 mins ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#5b6ef5]/20 flex items-center justify-center text-[#5b6ef5] flex-shrink-0">
              <Cloud size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs font-medium truncate" style={{ color: 'var(--clr-text-heading)' }}>Cloud resources deployed</p>
              <p className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: 'var(--clr-text-subtle)' }}>15 mins ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Elements - Hidden on very small screens, shown and positioned properly on larger ones */}
    <div className="hidden sm:flex absolute -top-8 -right-8 z-20 animate-bounce" style={{ animationDuration: '4s' }}>
      <div className="bg-[#1c1f3a]/95 backdrop-blur-md border border-[#5b6ef5]/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-2xl flex flex-col items-center gap-1.5 sm:gap-2 hover:scale-105 transition-transform cursor-pointer">
        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#5b6ef5]/20 rounded-full flex items-center justify-center text-[#5b6ef5]">
          <BarChart2 size={24} className="sm:w-7 sm:h-7" />
        </div>
        <span className="text-[10px] sm:text-xs font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--clr-text-heading)' }}>Analytics</span>
      </div>
    </div>

    <div className="hidden sm:flex absolute -bottom-6 -left-8 z-20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
      <div className="bg-[#1c1f3a]/95 backdrop-blur-md border border-green-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center gap-2.5 sm:gap-3 hover:scale-105 transition-transform cursor-pointer">
        <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
          <Zap size={18} className="sm:w-6 sm:h-6" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--clr-text-heading)' }}>Systems Go</p>
          <p className="text-[9px] sm:text-[10px]" style={{ color: 'var(--clr-text-subtle)' }}>100% Uptime</p>
        </div>
      </div>
    </div>
  </div>
);

// Decorative circles SVG
const GeometricBg = () => (
  <svg viewBox="0 0 700 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="ln-geo-bg" preserveAspectRatio="xMidYMid slice">
    {/* Large circle top-right */}
    <circle cx="580" cy="80" r="200" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" fill="none" />
    <circle cx="580" cy="80" r="140" stroke="rgba(91,110,245,0.15)" strokeWidth="1" fill="none" />
    {/* Arc top-right (partial) */}
    <path d="M 680 -20 A 200 200 0 0 1 500 180" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
    {/* Vertical line right */}
    <line x1="660" y1="0" x2="660" y2="600" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
    {/* Circle bottom-left */}
    <circle cx="180" cy="460" r="120" stroke="rgba(91,110,245,0.15)" strokeWidth="1.5" fill="none" />
    {/* Small circle left side */}
    <circle cx="60" cy="280" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
    {/* Dot accent */}
    <circle cx="450" cy="310" r="4" fill="#5b6ef5" />
  </svg>
);

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => setShowTip(true), 8000);
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="ln-wrapper" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={1}
          rayLength={2}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
          followMouse
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
        />
      </div>

      {loading && (
        <Loader
          fullScreen
          text={showTip ? 'Waking up server… (Render free tier takes ~30s)' : 'Redirecting to Google…'}
        />
      )}

      {/* ── Geometric background decoration ── */}
      <GeometricBg />

      {/* ── Navigation ── */}
      <nav className="ln-nav animate-fade-in">
        <div className="ln-nav-left">
          <button className="ln-hamburger" aria-label="Menu">
            <span /><span />
          </button>
        </div>
        <div className="ln-brand">
          <div className="ln-logo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#05050a" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span>Spectrum</span>
        </div>
        <div className="ln-nav-right" />
      </nav>

      {/* ── Hero Content ── */}
      <main className="ln-hero">
        {/* Left: Copy */}
        <div className="ln-left animate-fade-in-up">
          {/* Label row */}
          <div className="ln-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#5b6ef5" />
            <span>the best platform for college events</span>
          </div>

          {/* Big headline */}
          <h1 className="ln-headline" style={{ display: 'flex', flexDirection: 'column', gap: '0.1em' }}>
            <span className="ln-headline-line1">Manage your</span>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.3em' }}>
              <span className="ln-pill-word">events</span>
              <span>
                seamlessly<span className="ln-dot">.</span>
              </span>
            </div>
          </h1>

          {/* Sub copy */}
          <p className="ln-sub animate-fade-in-up stagger-2" style={{ maxWidth: '400px' }}>
            Instant registration, team management, and real-time
            updates — all in one campus platform.
          </p>

          {/* CTAs */}
          <div className="ln-actions animate-fade-in-up stagger-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="ln-btn-secondary" onClick={handleLogin} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            <button className="ln-btn-secondary" onClick={() => {
              setLoading(true);
              setTimeout(() => setShowTip(true), 8000);
              window.location.href = `${API_URL}/api/auth/microsoft`;
            }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
              <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              College ID
            </button>
          </div>

          {/* Security note */}
          <div className="ln-security animate-fade-in-up stagger-4">
            <Shield size={14} />
            Protected by Enterprise SSO
          </div>
        </div>

        {/* Right: Illustration */}
        <div className="ln-right animate-scale-in stagger-1">
          <HeroIllustrationUI />
        </div>
      </main>
    </div>
  );
};

export default Login;
