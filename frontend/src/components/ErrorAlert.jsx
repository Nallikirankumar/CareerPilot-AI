import React from 'react';

export default function ErrorAlert({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="error-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
