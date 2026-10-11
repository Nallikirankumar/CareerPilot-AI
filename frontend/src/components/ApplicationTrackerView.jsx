import React, { useState, useEffect } from 'react';
import { getApplications, createApplication, updateApplication, deleteApplication } from '../services/api';

const INITIAL_APPLICATIONS = [
  {
    id: 'app_1',
    company: 'Stripe',
    role: 'Software Engineer - Backend',
    status: 'Interview',
    appliedDate: '2026-10-01',
    followUpDate: '2026-10-15',
    notes: 'Completed technical phone screen on Python and systems. Next: System Architecture virtual onsite.'
  },
  {
    id: 'app_2',
    company: 'Datadog',
    role: 'Junior Full-Stack Developer',
    status: 'Applied',
    appliedDate: '2026-10-05',
    followUpDate: '2026-10-19',
    notes: 'Submitted tailored resume highlighting FastAPI, React, and Docker competencies.'
  }
];

export default function ApplicationTrackerView({ onCountChange, user }) {
  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_applications');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New application form state
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('Applied');
  const [newAppliedDate, setNewAppliedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Sync with backend API when user is logged in
  useEffect(() => {
    let ignore = false;
    if (user) {
      getApplications()
        .then((serverApps) => {
          if (!ignore && Array.isArray(serverApps)) {
            const formatted = serverApps.map((a) => ({
              id: a.id,
              company: a.company,
              role: a.role,
              status: a.status,
              appliedDate: a.applied_date,
              followUpDate: a.follow_up_date,
              notes: a.notes
            }));
            setApplications(formatted);
          }
        })
        .catch((err) => {
          console.warn('Could not sync applications from API:', err);
        });
    }
    return () => {
      ignore = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('careerpilot_applications', JSON.stringify(applications));
      } catch {
        // Ignore storage errors
      }
    }
    if (onCountChange) {
      onCountChange(applications.length);
    }
  }, [applications, onCountChange, user]);

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    if (user) {
      try {
        const created = await createApplication({
          company: newCompany.trim(),
          role: newRole.trim(),
          status: newStatus,
          appliedDate: newAppliedDate || null,
          followUpDate: newFollowUpDate || null,
          notes: newNotes.trim() || null
        });
        const formatted = {
          id: created.id,
          company: created.company,
          role: created.role,
          status: created.status,
          appliedDate: created.applied_date,
          followUpDate: created.follow_up_date,
          notes: created.notes
        };
        setApplications((prev) => [formatted, ...prev]);
      } catch (err) {
        alert(err.message || 'Failed to save application to server.');
        return;
      }
    } else {
      const newApp = {
        id: `app_${Date.now()}`,
        company: newCompany.trim(),
        role: newRole.trim(),
        status: newStatus,
        appliedDate: newAppliedDate,
        followUpDate: newFollowUpDate,
        notes: newNotes.trim()
      };
      setApplications((prev) => [newApp, ...prev]);
    }

    setNewCompany('');
    setNewRole('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleDeleteApplication = async (id) => {
    if (user && typeof id === 'number') {
      try {
        await deleteApplication(id);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleStatusChange = async (id, nextStatus) => {
    if (user && typeof id === 'number') {
      try {
        await updateApplication(id, { status: nextStatus });
      } catch (err) {
        console.error('Status update failed:', err);
      }
    }
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: nextStatus } : app))
    );
  };

  const filteredApps = applications.filter((app) => {
    const matchesStatus = filterStatus === 'All' || app.status === filterStatus;
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Offer':
        return { background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' };
      case 'Interview':
        return { background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-400)', borderColor: 'rgba(99, 102, 241, 0.3)' };
      case 'Applied':
        return { background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' };
      case 'Rejected':
        return { background: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' };
      default:
        return { background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' };
    }
  };

  return (
    <div className="workspace-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-pill">
          <span>●</span> Module H • Job Application Tracker
        </div>
        <h1 className="hero-title">
          Manage Your <span className="gradient-text">Job Applications & Interviews</span>
        </h1>
        <p className="hero-desc">
          Track target roles, interview rounds, deadlines, and offer progression in one private, organized workspace.
        </p>
      </div>

      {/* Top Action Bar & Metrics */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Tracked</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{applications.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interviewing</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-400)' }}>
              {applications.filter((a) => a.status === 'Interview').length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Offers</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-text)' }}>
              {applications.filter((a) => a.status === 'Offer').length}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-analyze"
          style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
          onClick={() => setShowAddModal(true)}
        >
          + Add New Application
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="jd-textarea"
          style={{ minHeight: 'auto', height: '42px', padding: '0.5rem 1rem', maxWidth: '300px' }}
          placeholder="Search by company or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="filter-chip-bar" style={{ margin: 0 }}>
          {['All', 'Planned', 'Applied', 'Interview', 'Offer', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-chip ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredApps.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-title">No Applications Found</div>
            <div className="empty-state-desc">Try clearing your search query or click '+ Add New Application' to record your first job application.</div>
          </div>
        ) : (
          filteredApps.map((app) => (
            <div key={app.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {app.role}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--primary-400)', fontWeight: 600, marginTop: '0.2rem' }}>
                    🏢 {app.company}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      ...getStatusBadgeStyle(app.status)
                    }}
                  >
                    <option value="Planned">Planned</option>
                    <option value="Applied">Applied</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleDeleteApplication(app.id)}
                    title="Delete application"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {app.notes && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)' }}>
                  {app.notes}
                </p>
              )}

              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Applied: {app.appliedDate || 'Not specified'}</span>
                {app.followUpDate && <span>Follow-up: {app.followUpDate}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="evidence-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="evidence-modal" onClick={(e) => e.stopPropagation()}>
            <div className="evidence-modal-header">
              <div className="evidence-modal-title">
                💼 Add New Job Application
              </div>
              <button
                type="button"
                className="btn-remove"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Amazon, Stripe"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="jd-textarea"
                  style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Role Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Backend Engineer"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="jd-textarea"
                  style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="jd-textarea"
                    style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
                  >
                    <option value="Planned">Planned</option>
                    <option value="Applied">Applied</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Applied Date</label>
                  <input
                    type="date"
                    value={newAppliedDate}
                    onChange={(e) => setNewAppliedDate(e.target.value)}
                    className="jd-textarea"
                    style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Follow-Up Deadline</label>
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="jd-textarea"
                    style={{ minHeight: 'auto', height: '40px', padding: '0.5rem 0.75rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Notes / Interview Details</label>
                <textarea
                  placeholder="Notes on recruiters, salary range, interview rounds..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="jd-textarea"
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="preset-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-analyze"
                  style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
