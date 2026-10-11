import React from 'react';

export default function Navbar({ backendOnline, theme, onToggleTheme, user, onOpenAuth, onLogout }) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <div className="brand-title">
          Career<span>Pilot</span> AI
        </div>
      </div>

      <div className="nav-actions">
        <span className="badge badge-phase">
          Deterministic Engine
        </span>

        <span className="badge badge-status">
          <span className={`status-dot ${backendOnline ? '' : 'offline'}`} />
          {backendOnline ? 'API Connected' : 'Connecting...'}
        </span>

        {/* User Account / Auth Actions */}
        {user ? (
          <div className="nav-user-pill">
            <span style={{ fontWeight: 600 }}>👤 {user.full_name || user.email.split('@')[0]}</span>
            {user.target_role && (
              <span className="nav-user-role">({user.target_role})</span>
            )}
            <button
              type="button"
              className="btn-nav-logout"
              onClick={onLogout}
              title="Sign out of your account"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-nav-auth"
            onClick={onOpenAuth}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Sign In / Register
          </button>
        )}

        <button
          type="button"
          className="btn-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            /* Sun Icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            /* Moon Icon */
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
