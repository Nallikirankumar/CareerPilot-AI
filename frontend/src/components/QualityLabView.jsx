import React, { useMemo } from 'react';

// Common technical resume evaluation heuristics
const ACTION_VERBS = [
  'engineered', 'architected', 'developed', 'optimized', 'implemented',
  'deployed', 'designed', 'automated', 'scaled', 'built', 'spearheaded',
  'refactored', 'integrated', 'streamlined', 'orchestrated', 'configured'
];

const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped with', 'assisted in', 'handled',
  'duties included', 'was part of'
];

export default function QualityLabView({ result, onNavigate }) {
  const extractedText = result?.extracted_text || '';
  const hasAnalysis = Boolean(result && extractedText);

  // Perform heuristic quality analysis on the extracted resume text
  const qualityReport = useMemo(() => {
    if (!hasAnalysis) return null;

    const lower = extractedText.toLowerCase();

    // 1. Section presence detection
    const sections = [
      { name: 'Education', detected: /education|degree|bachelor|university|college|gpa/i.test(extractedText) },
      { name: 'Work Experience / Internships', detected: /experience|employment|work history|internship/i.test(extractedText) },
      { name: 'Projects', detected: /projects|portfolio|personal projects/i.test(extractedText) },
      { name: 'Technical Skills', detected: /skills|technical skills|technologies|proficiencies/i.test(extractedText) },
      { name: 'Summary / Profile', detected: /summary|profile|about me|objective/i.test(extractedText) }
    ];

    // 2. Strong action verb detection
    const detectedVerbs = ACTION_VERBS.filter((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(lower));
    const detectedWeak = WEAK_PHRASES.filter((phrase) => lower.includes(phrase));

    // 3. Quantitative metrics detection (percentages, scale, numbers)
    const metricMatches = extractedText.match(/\b(?:\d+%(?: reduction| increase)?|\d+[kKmMbB]?\+? (?:users|requests|records|queries|ops)|\d+x (?:faster|improvement))\b/gi) || [];

    // 4. Compute overall quality score
    let score = 50; // base score
    const sectionsFound = sections.filter((s) => s.detected).length;
    score += sectionsFound * 7; // up to +35
    score += Math.min(detectedVerbs.length * 2, 10); // up to +10
    score += Math.min(metricMatches.length * 2, 10); // up to +10
    score -= Math.min(detectedWeak.length * 4, 15); // penalties
    score = Math.max(20, Math.min(98, score));

    return {
      score,
      sections,
      detectedVerbs,
      detectedWeak,
      metricMatches,
      sectionsFound
    };
  }, [hasAnalysis, extractedText]);

  return (
    <div className="workspace-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-pill">
          <span>●</span> Module F • Automated Resume Quality Lab
        </div>
        <h1 className="hero-title">
          Evidence-Based <span className="gradient-text">Resume Structure & Quality Lab</span>
        </h1>
        <p className="hero-desc">
          Automated heuristic audit of standard engineering sections, strong action verbs, and quantifiable impact metrics without inventing fake credentials.
        </p>
      </div>

      {!hasAnalysis ? (
        <div className="card empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div className="empty-state-title">No Resume Loaded for Audit</div>
          <div className="empty-state-desc">
            Upload a resume PDF in the <strong>Analysis Workspace</strong> to run the automated structure, action-verb, and metric checks.
          </div>
          <button
            type="button"
            className="preset-btn"
            style={{ marginTop: '1rem', color: 'var(--primary-400)' }}
            onClick={() => onNavigate('analyzer')}
          >
            Go to Analysis Workspace →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quality Overview Card */}
          <div className="score-hero-card">
            <div className="score-circle" style={{ borderColor: qualityReport.score >= 75 ? '#34d399' : '#fbbf24', boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)' }}>
              <span className="score-number" style={{ color: qualityReport.score >= 75 ? '#34d399' : '#fbbf24' }}>
                {qualityReport.score}
              </span>
              <span className="score-label">Quality Score</span>
            </div>

            <div className="score-details">
              <h3 className="score-title">
                {qualityReport.score >= 80 ? 'Well-Structured Resume' : qualityReport.score >= 60 ? 'Good Baseline with Growth Areas' : 'Needs Structural Improvement'}
              </h3>
              <p className="score-explanation">
                Detected {qualityReport.sectionsFound} of 5 essential engineering sections, {qualityReport.detectedVerbs.length} strong action verbs, and {qualityReport.metricMatches.length} quantifiable metric impacts in {result.filename}.
              </p>
              <div className="methodology-tag">
                Heuristic pattern evaluation • Zero credential fabrication guarantee
              </div>
            </div>
          </div>

          {/* Section Completeness Grid */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-icon">📁</span>
                Essential Section Completeness Check
              </div>
              <span className="badge badge-status">
                {qualityReport.sectionsFound} / 5 Sections Detected
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {qualityReport.sections.map((section) => (
                <div
                  key={section.name}
                  style={{
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `3px solid ${section.detected ? 'var(--success-text)' : 'var(--danger-text)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{section.name}</span>
                  <span style={{ fontSize: '0.8rem', color: section.detected ? 'var(--success-text)' : 'var(--danger-text)' }}>
                    {section.detected ? '✓ Found' : '✕ Missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Verbs & Impact Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Action Verbs */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-icon">⚡</span>
                  Strong Action Verbs ({qualityReport.detectedVerbs.length})
                </div>
              </div>
              <div className="skills-grid" style={{ marginTop: '0.75rem' }}>
                {qualityReport.detectedVerbs.length > 0 ? (
                  qualityReport.detectedVerbs.map((v, i) => (
                    <span key={i} className="skill-pill pill-matched">✓ {v}</span>
                  ))
                ) : (
                  <span className="empty-skills-msg">
                    No decisive engineering action verbs detected. Try leading bullet points with words like 'Engineered', 'Architected', or 'Optimized'.
                  </span>
                )}
              </div>

              {qualityReport.detectedWeak.length > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--danger-text)', fontWeight: 700, marginBottom: '0.4rem' }}>
                    ⚠️ Passive Phrases Detected ({qualityReport.detectedWeak.length}):
                  </div>
                  <div className="skills-grid">
                    {qualityReport.detectedWeak.map((w, i) => (
                      <span key={i} className="skill-pill pill-missing">✕ "{w}"</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantifiable Metrics */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-icon">📊</span>
                  Quantifiable Impact Metrics ({qualityReport.metricMatches.length})
                </div>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Recruiters prioritize evidence of measurable impact (e.g. latency reduced by 40%, scaled to 10k users, 99.9% uptime).
              </p>

              <div className="skills-grid" style={{ marginTop: '0.75rem' }}>
                {qualityReport.metricMatches.length > 0 ? (
                  qualityReport.metricMatches.map((m, i) => (
                    <span key={i} className="skill-pill pill-matched">📈 {m}</span>
                  ))
                ) : (
                  <span className="empty-skills-msg">
                    No numerical metrics or percentages detected. Enhance your project bullets with quantified results!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Before & After Rewrite Lab */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-icon">✍️</span>
                STAR Method Before & After Rewrite Guide
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--danger-text)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  ✕ Before (Passive / Weak):
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic' }}>
                  "Worked on the backend of an e-commerce website using Python and helped fix database issues."
                </p>
              </div>

              <div style={{ padding: '1rem', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--success-text)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  ✓ After (Action-Driven & Quantified):
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-primary)', margin: 0 }}>
                  "<strong>Architected</strong> asynchronous REST APIs with <strong>FastAPI & PostgreSQL</strong>, optimizing query execution times by <strong>35%</strong> for 10,000+ monthly active users."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
