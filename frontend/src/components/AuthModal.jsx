import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetRole, setTargetRole] = useState('Full-Stack Developer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const data = await registerUser({ email, password, fullName, targetRole });
        onAuthSuccess(data.user);
      } else {
        const data = await loginUser({ email, password });
        onAuthSuccess(data.user);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evidence-modal-backdrop" onClick={onClose}>
      <div className="evidence-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="evidence-modal-header">
          <div className="evidence-modal-title">
            <span style={{ color: 'var(--primary-400)' }}>👤</span>
            {isRegister ? 'Create Your Account' : 'Welcome to CareerPilot AI'}
          </div>
          <button
            type="button"
            className="btn-remove"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.65rem 0.9rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger-text)', fontSize: '0.84rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="jd-textarea"
                style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address *</label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="jd-textarea"
              style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Password *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="jd-textarea"
              style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Target Technical Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="jd-textarea"
                style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
              >
                <option value="Full-Stack Developer">Full-Stack Developer</option>
                <option value="Python Backend Developer">Python Backend Developer</option>
                <option value="AI / ML Engineer">AI / ML Engineer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-analyze"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {isRegister ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-400)', cursor: 'pointer', fontWeight: 600 }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-400)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
