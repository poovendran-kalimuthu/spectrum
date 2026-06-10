import React from 'react';
import './Loader.css';

const Loader = ({ fullScreen = false, text = 'Loading...' }) => (
  <div className={`ld-overlay ${fullScreen ? 'ld-fullscreen' : 'ld-inline'}`}>
    <div className="ld-box">
      <div className="ld-spinner-wrap">
        <div className="ld-ring-outer" />
        <div className="ld-ring-inner" />
        <div className="ld-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
      </div>
      {text && <p className="ld-text">{text}</p>}
    </div>
  </div>
);

export default Loader;
