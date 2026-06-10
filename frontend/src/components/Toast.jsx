import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Global Premium Toast Component
 * Usage: <Toast message="..." type="success|error|warning|info" onClose={fn} duration={3500} />
 */
const Toast = ({ message, type = 'info', onClose, duration = 3500, id }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), duration - 350);
    const closeTimer = setTimeout(() => onClose && onClose(id), duration);
    return () => { clearTimeout(exitTimer); clearTimeout(closeTimer); };
  }, [duration, id, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose && onClose(id), 320);
  };

  const icons = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    error: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    warning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    info: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
    ),
    danger: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
  };

  const resolvedType = type === 'danger' ? 'error' : type;

  return (
    <div className={`sp-toast-item sp-toast-${resolvedType} ${exiting ? 'sp-toast-exit' : ''}`} role="alert">
      <div className={`sp-toast-icon sp-toast-icon-${resolvedType}`}>
        {icons[type] || icons.info}
      </div>
      <span className="sp-toast-msg">{message}</span>
      <button className="sp-toast-close" onClick={handleClose} aria-label="Close">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div
        className={`sp-toast-progress sp-toast-progress-${resolvedType}`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

/**
 * Toast Container — renders multiple toasts stacked
 * Usage: <ToastContainer toasts={toasts} onClose={(id) => removeToast(id)} />
 */
export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;
  return createPortal(
    <div className="sp-toast-container" aria-live="polite" style={{ zIndex: 99999, position: 'fixed', bottom: '20px', right: '20px' }}>
      {toasts.map(t => (
        <Toast
          key={t.id}
          id={t.id}
          message={t.message}
          type={t.type}
          duration={t.duration || 3500}
          onClose={onClose}
        />
      ))}
    </div>,
    document.body
  );
};

/**
 * useToast hook — manage toast state
 * Usage:
 *   const { toasts, showToast, removeToast } = useToast();
 *   showToast('Saved!', 'success');
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};

export default Toast;
