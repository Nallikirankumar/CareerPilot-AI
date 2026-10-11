import React from 'react';

export default function Navbar({ backendOnline }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className="brand-title">
          Career<span>Pilot</span> AI
        </div>
      </div>

      <div className="nav-badges">
        <span className="badge badge-phase">
          Phase 1: Deterministic Engine
        </span>
        <span className="badge badge-status">
          <span className={`status-dot ${backendOnline ? '' : 'offline'}`} />
          {backendOnline ? 'API Connected' : 'API Connecting...'}
        </span>
      </div>
    </header>
  );
}
