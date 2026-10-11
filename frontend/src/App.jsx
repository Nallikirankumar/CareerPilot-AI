import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TabNavigation from './components/TabNavigation';
import ResumeUpload from './components/ResumeUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import MatchResults from './components/MatchResults';
import ErrorAlert from './components/ErrorAlert';
import DashboardView from './components/DashboardView';
import RoadmapView from './components/RoadmapView';
import QualityLabView from './components/QualityLabView';
import InterviewCoachView from './components/InterviewCoachView';
import ApplicationTrackerView from './components/ApplicationTrackerView';
import HistoryExportView from './components/HistoryExportView';
import AuthModal from './components/AuthModal';
import {
  checkBackendHealth,
  analyzeResume,
  getUserProfile,
  clearAuth,
  getStoredUser,
  getSavedAnalyses
} from './services/api';

export default function App() {
  // Theme state: dark (default) or light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('careerpilot_theme') || 'dark';
  });

  // Active navigation workspace tab: dashboard, analyzer, analytics, roadmap, quality, interview, applications, history
  const [activeTab, setActiveTab] = useState('dashboard');

  // Authentication & Profile state
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Analysis workflow states
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Analysis History persistence
  const [historyList, setHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem('careerpilot_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Career tracker metrics
  const [applicationCount, setApplicationCount] = useState(0);
  const [roadmapCompletion, setRoadmapCompletion] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);

  // Check authenticated user profile & hydrate DB analyses on mount
  useEffect(() => {
    const initProfile = async () => {
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
        try {
          const dbAnalyses = await getSavedAnalyses();
          if (Array.isArray(dbAnalyses) && dbAnalyses.length > 0) {
            const formatted = dbAnalyses.map((a) => ({
              id: `db_${a.id}`,
              date: new Date(a.created_at).toLocaleDateString(),
              filename: a.filename,
              matchScore: a.match_percentage,
              matchedCount: a.analysis_data?.matched_skills?.length || 0,
              missingCount: a.analysis_data?.missing_skills?.length || 0,
              result: {
                filename: a.filename,
                analysis: a.analysis_data
              }
            }));
            setHistoryList(formatted);
          }
        } catch {
          // Keep localStorage history
        }
      }
    };
    initProfile();
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

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

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('careerpilot_history', JSON.stringify(historyList));
    } catch {
      // Ignore storage errors
    }
  }, [historyList]);

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

      // Add to history
      const historyItem = {
        id: `analysis_${Date.now()}`,
        date: new Date().toLocaleDateString(),
        filename: data.filename,
        matchScore: data.analysis.match_percentage,
        matchedCount: data.analysis.matched_skills.length,
        missingCount: data.analysis.missing_skills.length,
        result: data
      };
      setHistoryList((prev) => [historyItem, ...prev]);
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
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
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

        {/* 1. Career Intelligence Dashboard (Module A) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            result={result}
            onNavigate={setActiveTab}
            applicationCount={applicationCount}
            roadmapCompletion={roadmapCompletion}
            interviewCount={interviewCount}
            user={user}
          />
        )}

        {/* 2. Resume Analyzer (Module B & C) */}
        {activeTab === 'analyzer' && (
          <>
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Module B & C • In-Memory Parsing & Advanced Matcher
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

        {/* 3. Skill Gap Analytics View (Module C) */}
        {activeTab === 'analytics' && (
          <div className="workspace-placeholder-view">
            <div className="hero">
              <div className="hero-pill">
                <span>●</span> Module C • Categorized Skill Gap Intelligence
              </div>
              <h1 className="hero-title">
                Domain-Level <span className="gradient-text">Skill Gap Breakdown</span>
              </h1>
              <p className="hero-desc">
                Granular diagnosis of requirements versus candidate capabilities, categorized by engineering domains (Programming Languages, AI/ML, Frameworks, Databases, Cloud/DevOps, and CS Fundamentals).
              </p>
            </div>

            {result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Summary Banner */}
                <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Target Role Alignment</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                      {result.analysis.match_percentage}% Overall Match
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-status">
                      ✓ {result.analysis.matched_skills.length} Satisfied
                    </span>
                    <span className="badge badge-phase" style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
                      + {result.analysis.missing_skills.length} Target Gaps
                    </span>
                    {result.analysis.required_skills?.length > 0 && (
                      <span className="badge badge-phase">
                        📌 {result.analysis.required_skills.length} Required
                      </span>
                    )}
                  </div>
                </div>

                {/* Categorized Domains Grid */}
                <div className="category-grid">
                  {Object.entries(result.analysis.categorized_skills || {}).map(([category, breakdown]) => {
                    const totalReq = (breakdown.matched?.length || 0) + (breakdown.missing?.length || 0);
                    const matchedCount = breakdown.matched?.length || 0;
                    const catPct = totalReq > 0 ? Math.round((matchedCount / totalReq) * 100) : 100;
                    const fillColor = catPct >= 75 ? 'var(--success-text)' : catPct >= 40 ? 'var(--warning-text)' : 'var(--danger-text)';

                    return (
                      <div key={category} className="category-card">
                        <div className="category-card-header">
                          <div className="category-card-title">
                            {category}
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: fillColor }}>
                            {catPct}%
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="category-progress-track">
                          <div
                            className="category-progress-fill"
                            style={{ width: `${catPct}%`, backgroundColor: fillColor }}
                          />
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {matchedCount} of {totalReq} target requirement(s) satisfied
                        </div>

                        {/* Skills in Category */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                          {breakdown.matched?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--success-text)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Satisfied Skills:
                              </div>
                              <div className="skills-grid">
                                {breakdown.matched.map((s, i) => (
                                  <span key={i} className="skill-pill pill-matched">✓ {s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {breakdown.missing?.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--danger-text)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Missing Gaps to Bridge:
                              </div>
                              <div className="skills-grid">
                                {breakdown.missing.map((s, i) => (
                                  <span key={i} className="skill-pill pill-missing">+ {s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  Run an analysis in the <strong>Resume Analyzer</strong> to unlock deep domain categorization, requirement sources, and filters.
                </div>
                <button
                  type="button"
                  className="preset-btn"
                  style={{ marginTop: '1rem', color: 'var(--primary-400)' }}
                  onClick={() => setActiveTab('analyzer')}
                >
                  Go to Resume Analyzer →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Personalized Learning Roadmap (Module E) */}
        {activeTab === 'roadmap' && (
          <RoadmapView
            result={result}
            onProgressUpdate={(pct) => setRoadmapCompletion(pct)}
          />
        )}

        {/* 5. Resume Quality Lab (Module F) */}
        {activeTab === 'quality' && (
          <QualityLabView
            result={result}
            onNavigate={setActiveTab}
          />
        )}

        {/* 6. Technical Interview Coach (Module G) */}
        {activeTab === 'interview' && (
          <InterviewCoachView
            onSessionCompleted={() => setInterviewCount((prev) => prev + 1)}
          />
        )}

        {/* 7. Job Application Tracker (Module H) */}
        {activeTab === 'applications' && (
          <ApplicationTrackerView
            onCountChange={(count) => setApplicationCount(count)}
            user={user}
          />
        )}

        {/* 8. History & Report Export (Module J & K) */}
        {activeTab === 'history' && (
          <HistoryExportView
            historyList={historyList}
            currentResult={result}
            onLoadResult={(res) => {
              setResult(res);
              setActiveTab('analyzer');
            }}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(newUser) => setUser(newUser)}
      />

      {/* Footer */}
      <footer className="footer">
        CareerPilot AI 2.0 • Full-Stack Career Intelligence Platform • Built with React, FastAPI & PyMuPDF
      </footer>
    </div>
  );
}
