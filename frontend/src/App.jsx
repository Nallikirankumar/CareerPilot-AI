import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ResumeUpload from './components/ResumeUpload';
import JobDescriptionInput from './components/JobDescriptionInput';
import MatchResults from './components/MatchResults';
import ErrorAlert from './components/ErrorAlert';
import { checkBackendHealth, analyzeResume } from './services/api';

export default function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Check backend health on initial load and periodically
  const verifyBackendStatus = useCallback(async () => {
    const health = await checkBackendHealth();
    setBackendOnline(Boolean(health && health.status === 'healthy'));
  }, []);

  useEffect(() => {
    verifyBackendStatus();
    const intervalId = setInterval(verifyBackendStatus, 15000);
    return () => clearInterval(intervalId);
  }, [verifyBackendStatus]);

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
      <Navbar backendOnline={backendOnline} />

      <main className="main-content">
        {/* Hero Section */}
        <div className="hero">
          <div className="hero-pill">
            <span>●</span> Phase 1 • In-Memory Parsing & Rule-Based Matcher
          </div>
          <h1 className="hero-title">
            Evaluate Your Resume Against Any <span className="gradient-text">Tech Role</span>
          </h1>
          <p className="hero-desc">
            Upload your resume PDF and paste the target job description. CareerPilot AI extracts technical skills, identifies missing competencies, and calculates an explainable match score.
          </p>
        </div>

        {/* Global Error Banner */}
        <ErrorAlert message={error} onClose={() => setError(null)} />

        {/* Two-Column Responsive Dashboard */}
        <div className="dashboard-grid">
          {/* Left Column: Input Form */}
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Analyze Resume Alignment
                </>
              )}
            </button>
          </section>

          {/* Right Column: Results & Explainability */}
          <section className="results-column">
            <MatchResults result={result} loading={loading} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        CareerPilot AI • Built with React, Vite, FastAPI & PyMuPDF • Deterministic Keyword Matching Architecture
      </footer>
    </div>
  );
}
