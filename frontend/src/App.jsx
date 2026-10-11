import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TabNavigation from './components/TabNavigation';
import ResumeUpload from './components/ResumeUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import MatchResults from './components/MatchResults';
import ErrorAlert from './components/ErrorAlert';
import { checkBackendHealth, analyzeResume } from './services/api';

export default function App() {
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('careerpilot_theme') || 'dark';
  });

  // Active navigation workspace tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Analysis workflow states
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Apply data-theme attribute on <html> element whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('careerpilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Check backend health on initial load and periodically with cleanup flag
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      const health = await checkBackendHealth();
      if (isMounted) {
        setBackendOnline(Boolean(health && health.status === 'healthy'));
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setError(null);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const handleJdChange = (text) => {
    setJobDescription(text);
    if (error && text.trim()) {
      setError(null);
    }
  };

  const handleJdClear = () => {
    setJobDescription('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please upload a resume PDF before analyzing.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Please provide a target job description to match against.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await analyzeResume(file, jobDescription);
      setResult(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during resume analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Application Bar */}
      <Navbar
        backendOnline={backendOnline}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Workspace Navigation Bar */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hasAnalysis={Boolean(result)}
      />

      <main className="main-content">
        {/* Global Error Alert */}
        <ErrorAlert message={error} onClose={() => setError(null)} />

        {/* 1. Dashboard Analysis Workspace */}
        {activeTab === 'dashboard' && (
          <>
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Workspace • In-Memory Parsing & Rule-Based Matcher
              </div>
              <h1 className="hero-title">
                Next-Generation <span className="gradient-text">Resume Intelligence</span>
              </h1>
              <p className="hero-desc">
                Evaluate your technical resume against target tech roles. Extract validated competencies, 
                diagnose skill gaps, and view transparent, explainable alignment scores.
              </p>
            </div>

            <div className="dashboard-grid">
              {/* Input Column */}
              <section className="input-column">
                <ResumeUpload
                  file={file}
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  onError={(msg) => setError(msg)}
                />

                <JobDescriptionInput
                  value={jobDescription}
                  onChange={handleJdChange}
                  onClear={handleJdClear}
                />

                <button
                  type="button"
                  className="btn-analyze"
                  onClick={handleAnalyze}
                  disabled={loading || !file || !jobDescription.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Analyze Resume Alignment
                    </>
                  )}
                </button>
              </section>

              {/* Results Column */}
              <section className="results-column">
                <MatchResults result={result} loading={loading} />
              </section>
            </div>
          </>
        )}

        {/* 2. Skill Gap Analytics Placeholder View */}
        {activeTab === 'analytics' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Feature 4 • Skill Gap Analytics
              </div>
              <h1 className="hero-title">
                Categorized <span className="gradient-text">Skill Gap Intelligence</span>
              </h1>
              <p className="hero-desc">
                Granular breakdown of satisfied requirements versus missing capabilities, categorized by domain (Languages, Frameworks, Cloud, Databases, AI/ML, and Core CS Fundamentals).
              </p>
            </div>

            {result ? (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </span>
                    Skill Breakdown for {result.filename}
                  </div>
                  <span className="badge badge-status">
                    {result.analysis.matched_skills.length} Matched / {result.analysis.missing_skills.length} Missing
                  </span>
                </div>

                <div className="skills-section">
                  <div className="skills-group">
                    <div className="skills-group-header">
                      <span className="skills-group-title" style={{ color: 'var(--success-text)' }}>
                        ✓ Satisfied Skills ({result.analysis.matched_skills.length})
                      </span>
                    </div>
                    <div className="skills-grid">
                      {result.analysis.matched_skills.map((s, i) => (
                        <span key={i} className="skill-pill pill-matched">✓ {s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="skills-group">
                    <div className="skills-group-header">
                      <span className="skills-group-title" style={{ color: 'var(--danger-text)' }}>
                        + Missing Requirements ({result.analysis.missing_skills.length})
                      </span>
                    </div>
                    <div className="skills-grid">
                      {result.analysis.missing_skills.map((s, i) => (
                        <span key={i} className="skill-pill pill-missing">+ {s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <div className="empty-state-title">No Active Analysis Data</div>
                <div className="empty-state-desc">
                  Run an analysis in the <strong>Analysis Workspace</strong> to unlock deep domain categorization, requirement sources, and filters in Phase C.
                </div>
                <button
                  type="button"
                  className="preset-btn"
                  style={{ marginTop: '1rem', color: 'var(--primary-400)' }}
                  onClick={() => setActiveTab('dashboard')}
                >
                  Go to Analysis Workspace →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Learning Roadmap Placeholder View */}
        {activeTab === 'roadmap' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Feature 5 • Personalized Learning Roadmap
              </div>
              <h1 className="hero-title">
                Targeted <span className="gradient-text">Skill Acquisition Roadmap</span>
              </h1>
              <p className="hero-desc">
                Actionable learning pathways generated from your diagnosed skill gaps. Prioritized from foundational prerequisites to advanced architectural concepts with practice exercises and project ideas.
              </p>
            </div>

            <div className="placeholder-feature-grid">
              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 14 14" />
                  </svg>
                  Tiered Learning Pathways
                </div>
                <p className="feature-preview-desc">
                  Structures your learning into Beginner, Intermediate, and Advanced milestones based strictly on missing skills detected in your target job posting.
                </p>
              </div>

              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Interactive Progress Checklist
                </div>
                <p className="feature-preview-desc">
                  Track completed exercises, project milestones, and revisit learning targets directly in your browser.
                </p>
              </div>

              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  Verified Resource Curation
                </div>
                <p className="feature-preview-desc">
                  Direct links to official documentation, foundational tutorials, and open-source project repositories with zero fabricated claims.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Resume Quality Lab Placeholder View */}
        {activeTab === 'quality' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Feature 6 • Resume Quality Lab
              </div>
              <h1 className="hero-title">
                Automated <span className="gradient-text">Resume Structure & Quality Lab</span>
              </h1>
              <p className="hero-desc">
                Diagnostic feedback evaluating essential sections (Summary, Education, Experience, Projects, Skills), action-verb impact, and bullet-point clarity without fabricating credentials.
              </p>
            </div>

            <div className="placeholder-feature-grid">
              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  Section Completeness Check
                </div>
                <p className="feature-preview-desc">
                  Identifies standard engineering sections (Education, Projects, Technical Skills, Experience) to ensure clean parsing by recruiters.
                </p>
              </div>

              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Action Verb & Clarity Heuristics
                </div>
                <p className="feature-preview-desc">
                  Detects passive wording and highlights opportunities to lead bullets with decisive engineering verbs (Engineered, Architected, Optimized).
                </p>
              </div>

              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Strict Privacy Guarantees
                </div>
                <p className="feature-preview-desc">
                  Quality checks run locally or through strict in-memory byte inspection. No candidate text is permanently stored or leaked to public models.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Interview Practice Placeholder View */}
        {activeTab === 'interview' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Feature 7 • Interview Preparation Workspace
              </div>
              <h1 className="hero-title">
                Targeted <span className="gradient-text">Technical Interview Preparation</span>
              </h1>
              <p className="hero-desc">
                Interview questions generated directly from matched competencies and job description requirements, paired with transparent evaluation rubrics.
              </p>
            </div>

            <div className="placeholder-feature-grid">
              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Requirement-Derived Questions
                </div>
                <p className="feature-preview-desc">
                  Questions focus on the actual technologies in your target role (Python, SQL, DSA, System Design, AI/ML concepts).
                </p>
              </div>

              <div className="feature-preview-card">
                <div className="feature-preview-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Objective Scoring Rubrics
                </div>
                <p className="feature-preview-desc">
                  Self-evaluation across Relevance, Technical Accuracy, Clarity, and Edge-Case Handling using transparent criteria.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. History & Export Placeholder View */}
        {activeTab === 'history' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Feature 8 • Analysis History & Export
              </div>
              <h1 className="hero-title">
                Analysis History & <span className="gradient-text">Report Export</span>
              </h1>
              <p className="hero-desc">
                Reopen previous analyses and export clean, printable PDF reports. Stored exclusively in your browser storage for 100% privacy.
              </p>
            </div>

            {result ? (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <span className="card-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </span>
                    Current Session Summary
                  </div>
                  <button
                    type="button"
                    className="preset-btn"
                    onClick={() => window.print()}
                    style={{ color: 'var(--primary-400)' }}
                  >
                    🖨️ Print / Save as PDF
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target File</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700 }}>{result.filename}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alignment Score</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-500)' }}>
                      {result.analysis.match_percentage}%
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matched Skills</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success-text)' }}>
                      {result.analysis.matched_skills.length} skills
                    </div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skill Gaps</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--danger-text)' }}>
                      {result.analysis.missing_skills.length} gaps
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card empty-state">
                <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div className="empty-state-title">No Saved Sessions Yet</div>
                <div className="empty-state-desc">
                  Analyses performed in your session will appear here with full export capabilities in Phase E.
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        CareerPilot AI • Built with React, Vite, FastAPI & PyMuPDF • Deterministic Keyword Matching Architecture
      </footer>
    </div>
  );
}
