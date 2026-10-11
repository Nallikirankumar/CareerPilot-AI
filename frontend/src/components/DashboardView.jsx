import React from 'react';

export default function DashboardView({
  result,
  onNavigate,
  applicationCount = 0,
  roadmapCompletion = 0,
  interviewCount = 0,
  user = null
}) {
  const hasAnalysis = Boolean(result && result.analysis);
  const matchScore = hasAnalysis ? result.analysis.match_percentage : 0;
  const matchedCount = hasAnalysis ? result.analysis.matched_skills.length : 0;
  const missingCount = hasAnalysis ? result.analysis.missing_skills.length : 0;
  const displayName = user?.full_name || (user?.email ? user.email.split('@')[0] : (hasAnalysis ? (result.analysis.target_role || 'Candidate') : 'Future Tech Leader'));
  const userRoleSubtitle = user?.target_role ? ` • Target: ${user.target_role}` : '';

  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399';
    if (score >= 45) return '#fbbf24';
    return '#fb7185';
  };

  return (
    <div className="dashboard-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome & Readiness Banner */}
      <div className="hero" style={{ textAlign: 'left', padding: '1.75rem 2rem' }}>
        <div className="hero-pill" style={{ margin: '0 0 0.75rem 0' }}>
          <span>●</span> Career Intelligence Overview • CareerPilot AI 2.0{userRoleSubtitle}
        </div>
        <h1 className="hero-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Welcome back, <span className="gradient-text">{displayName}</span>
        </h1>
        <p className="hero-desc" style={{ maxWidth: '640px', margin: 0 }}>
          {hasAnalysis
            ? `Your resume for ${result.filename} is analyzed with a ${matchScore}% alignment score. You have tracked ${applicationCount} job application(s), completed ${roadmapCompletion}% of your roadmap, and practiced ${interviewCount} interview question(s). Review your diagnosed gaps and recommended next actions below.`
            : 'Get started by analyzing your resume against target job requirements or logging in to sync your profile and application pipeline.'}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Card 1: Match Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Resume Match Score</span>
            <span className="badge badge-status">
              {hasAnalysis ? 'Active Analysis' : 'Pending'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: getScoreColor(matchScore) }}>
              {hasAnalysis ? `${matchScore}%` : '—'}
            </span>
            {hasAnalysis && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                alignment
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {hasAnalysis
              ? `${matchedCount} skills matched • ${missingCount} skill gap(s)`
              : 'Upload a resume to calculate alignment'}
          </div>
          <button
            type="button"
            className="preset-btn"
            style={{ marginTop: 'auto', color: 'var(--primary-400)', alignSelf: 'flex-start' }}
            onClick={() => onNavigate('analyzer')}
          >
            {hasAnalysis ? 'Inspect Analysis →' : 'Launch Analyzer →'}
          </button>
        </div>

        {/* Card 2: Skill Gap Analytics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Skill Gaps</span>
            <span className="badge badge-phase">Domain Breakdown</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: missingCount > 0 ? 'var(--danger-text)' : 'var(--success-text)' }}>
              {hasAnalysis ? missingCount : '0'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>target gaps to bridge</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {hasAnalysis
              ? `${Object.keys(result.analysis.categorized_skills || {}).length} technical domains evaluated`
              : 'Identifies missing frameworks, databases & tools'}
          </div>
          <button
            type="button"
            className="preset-btn"
            style={{ marginTop: 'auto', color: 'var(--primary-400)', alignSelf: 'flex-start' }}
            onClick={() => onNavigate('analytics')}
          >
            View Gap Analytics →
          </button>
        </div>

        {/* Card 3: Learning Roadmap */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Roadmap Progress</span>
            <span className="badge badge-phase">Active Tasks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--primary-400)' }}>
              {roadmapCompletion}%
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>completed</span>
          </div>
          <div className="category-progress-track">
            <div
              className="category-progress-fill"
              style={{ width: `${roadmapCompletion}%`, backgroundColor: 'var(--primary-500)' }}
            />
          </div>
          <button
            type="button"
            className="preset-btn"
            style={{ marginTop: 'auto', color: 'var(--primary-400)', alignSelf: 'flex-start' }}
            onClick={() => onNavigate('roadmap')}
          >
            Go to Roadmap →
          </button>
        </div>

        {/* Card 4: Job Applications */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Job Applications</span>
            <span className="badge badge-status">Pipeline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {applicationCount}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>tracked roles</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Track interviews, follow-ups, and offer statuses
          </div>
          <button
            type="button"
            className="preset-btn"
            style={{ marginTop: 'auto', color: 'var(--primary-400)', alignSelf: 'flex-start' }}
            onClick={() => onNavigate('applications')}
          >
            Open Application Tracker →
          </button>
        </div>
      </div>

      {/* Recommended Next Actions */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-icon">⚡</span>
            Recommended Next Actions
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
          {!hasAnalysis ? (
            <div
              style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
              onClick={() => onNavigate('analyzer')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: '0.4rem' }}>
                <span>1.</span> Run Your First Resume Analysis
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Upload your PDF resume and compare it against target tech roles (Full-Stack, Python Backend, AI/ML, Data Analyst).
              </p>
            </div>
          ) : (
            <>
              <div
                style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                onClick={() => onNavigate('roadmap')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--success-text)', marginBottom: '0.4rem' }}>
                  <span>✓</span> Bridge Top Skill Gaps
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  You have {missingCount} missing skill(s). Follow your personalized learning roadmap with verified exercises and project templates.
                </p>
              </div>

              <div
                style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                onClick={() => onNavigate('quality')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--warning-text)', marginBottom: '0.4rem' }}>
                  <span>🔍</span> Audit Resume Quality & Metrics
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Verify that your bullet points use strong action verbs and quantified impact metrics (% improved, scale, latencies).
                </p>
              </div>

              <div
                style={{ padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                onClick={() => onNavigate('interview')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: '0.4rem' }}>
                  <span>💬</span> Practice Technical Interview Questions
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Practice real questions on Python, DSA, System Design, and ML with instant scoring rubrics.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
