import React from 'react';

const SAMPLE_PRESETS = [
  {
    label: 'Full-Stack Developer',
    text: `Job Title: Full-Stack Engineer
Requirements:
- Strong proficiency in Python, FastAPI, and React.
- Solid understanding of PostgreSQL and Redis databases.
- Experience with Docker, Git, CI/CD, and REST API design.
- Familiarity with TypeScript and Tailwind CSS is a plus.
- Good knowledge of Data Structures and Object-Oriented Programming.`
  },
  {
    label: 'AI / ML Engineer',
    text: `Job Title: Associate Machine Learning Engineer
Requirements:
- Bachelor's in Computer Science or related field with knowledge of Artificial Intelligence.
- Hands-on experience with Python, PyTorch, TensorFlow, Scikit-learn, and Pandas.
- Understanding of Deep Learning, NLP, and Computer Vision architectures.
- Experience building and deploying models with FastAPI or Flask and Docker.
- Strong grounding in Algorithms and Data Structures.`
  },
  {
    label: 'Backend Developer (Python)',
    text: `Job Title: Junior Backend Engineer
Requirements:
- Proficiency in Python and modern backend frameworks like FastAPI or Django.
- Experience creating RESTful APIs and querying SQL databases (PostgreSQL, MySQL).
- Knowledge of version control with Git and GitHub.
- Understanding of Linux environments and containerization with Docker.
- Solid foundation in DBMS, Operating Systems, and System Design.`
  }
];

export default function JobDescriptionInput({ value, onChange, onClear }) {
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          Target Job Description
        </div>

        {value && (
          <button
            type="button"
            className="preset-btn"
            onClick={onClear}
            style={{ color: '#fb7185' }}
          >
            Clear Text
          </button>
        )}
      </div>

      <div className="preset-pills">
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
          Quick Presets:
        </span>
        {SAMPLE_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            className="preset-btn"
            onClick={() => onChange(preset.text)}
          >
            + {preset.label}
          </button>
        ))}
      </div>

      <div className="textarea-wrapper">
        <textarea
          className="jd-textarea"
          placeholder="Paste the target job description or requirements here..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="jd-footer">
          <span>{value.length} characters • {value ? value.trim().split(/\s+/).length : 0} words</span>
          <span>Tip: Includes languages, frameworks, cloud, and CS fundamentals</span>
        </div>
      </div>
    </div>
  );
}
