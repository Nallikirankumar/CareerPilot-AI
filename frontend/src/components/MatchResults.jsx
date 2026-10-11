import React, { useState } from 'react';

export default function MatchResults({ result, loading }) {
  const [showExtractedText, setShowExtractedText] = useState(false);

  if (loading) {
    return (
      <div className="card empty-state">
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 1.5rem', borderWidth: '3px' }} />
        <div className="empty-state-title">Analyzing Resume & Extracting Skills...</div>
        <div className="empty-state-desc">
          Parsing PDF stream safely via PyMuPDF in RAM and running deterministic taxonomy matching.
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="card empty-state">
        <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="empty-state-title">No Analysis Generated Yet</div>
        <div className="empty-state-desc">
          Upload your resume PDF and enter a target job description, then click "Analyze Resume" to view your skill breakdown and match score.
        </div>
      </div>
    );
  }

  const { analysis, filename, page_count, extracted_text } = result;
  const {
    matched_skills = [],
    missing_skills = [],
    resume_skills = [],
    job_description_skills = [],
    match_percentage = 0,
    methodology,
    explanation
  } = analysis || {};

  // Color-coded styling based on score threshold
  const getScoreColor = (score) => {
    if (score >= 75) return '#34d399'; // Green
    if (score >= 45) return '#fbbf24'; // Amber
    return '#fb7185'; // Rose
  };

  const scoreColor = getScoreColor(match_percentage);

  return (
    <div className="results-container">
      {/* 1. Score Overview Card */}
      <div className="score-hero-card">
        <div className="score-circle" style={{ borderColor: scoreColor, boxShadow: `0 0 20px ${scoreColor}40` }}>
          <span className="score-number" style={{ color: scoreColor }}>
            {match_percentage}%
          </span>
          <span className="score-label">Skill Match</span>
        </div>

        <div className="score-details">
          <h3 className="score-title">
            {match_percentage >= 75
              ? 'Strong Alignment'
              : match_percentage >= 45
              ? 'Moderate Alignment'
              : 'Growth Opportunity'}
          </h3>
          <p className="score-explanation">{explanation}</p>
          <div className="methodology-tag">
            Methodology: {methodology}
          </div>
        </div>
      </div>

      {/* 2. Skills Breakdowns */}
      <div className="skills-section">
        {/* Matched Skills */}
        <div className="skills-group">
          <div className="skills-group-header">
            <span className="skills-group-title" style={{ color: '#34d399' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Matching Skills ({matched_skills.length})
            </span>
            <span className="skills-count count-matched">
              {matched_skills.length} / {job_description_skills.length} required
            </span>
          </div>

          <div className="skills-grid">
            {matched_skills.length > 0 ? (
              matched_skills.map((skill, index) => (
                <span key={index} className="skill-pill pill-matched">
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="empty-skills-msg">
                No overlapping skills detected between your resume and the target role.
              </span>
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="skills-group">
          <div className="skills-group-header">
            <span className="skills-group-title" style={{ color: '#fb7185' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Missing Target Skills ({missing_skills.length})
            </span>
            <span className="skills-count count-missing">
              Target gaps to prepare
            </span>
          </div>

          <div className="skills-grid">
            {missing_skills.length > 0 ? (
              missing_skills.map((skill, index) => (
                <span key={index} className="skill-pill pill-missing">
                  + {skill}
                </span>
              ))
            ) : (
              <span className="empty-skills-msg" style={{ color: '#34d399' }}>
                Awesome! You have all the skills requested in this job description.
              </span>
            )}
          </div>
        </div>

        {/* All Extracted Resume Skills */}
        <div className="skills-group">
          <div className="skills-group-header">
            <span className="skills-group-title" style={{ color: 'var(--text-secondary)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              All Identified Skills in Resume ({resume_skills.length})
            </span>
            <span className="skills-count count-all">
              from {page_count} page(s)
            </span>
          </div>

          <div className="skills-grid">
            {resume_skills.length > 0 ? (
              resume_skills.map((skill, index) => (
                <span key={index} className="skill-pill pill-neutral">
                  {skill}
                </span>
              ))
            ) : (
              <span className="empty-skills-msg">
                No technical skills recognized in the uploaded resume.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Collapsible Extracted Resume Text Inspector */}
      <div className="text-preview-box">
        <div
          className="text-preview-header"
          onClick={() => setShowExtractedText(!showExtractedText)}
        >
          <span className="text-preview-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 7 4 4 20 4 20 7" />
              <line x1="9" y1="20" x2="15" y2="20" />
              <line x1="12" y1="4" x2="12" y2="20" />
            </svg>
            PyMuPDF Extracted Text Inspector ({filename})
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {showExtractedText ? '▲ Hide' : '▼ Click to View Raw Text'}
          </span>
        </div>

        {showExtractedText && (
          <div className="text-preview-content">
            {extracted_text}
          </div>
        )}
      </div>
    </div>
  );
}
