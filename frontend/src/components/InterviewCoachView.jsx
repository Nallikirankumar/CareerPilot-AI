import React, { useState } from 'react';

const QUESTIONS_BANK = [
  {
    id: 'py_1',
    topic: 'Python',
    difficulty: 'Intermediate',
    question: 'Explain the Global Interpreter Lock (GIL) in CPython. How does it impact multithreaded CPU-bound tasks versus I/O-bound tasks?',
    hint: 'Think about thread synchronization, mutex locks around Python bytecode execution, and how asyncio or multiprocessing bypasses this.',
    expectedKeywords: ['mutex', 'thread', 'bytecode', 'cpu', 'i/o', 'multiprocessing', 'concurrency', 'asyncio'],
    modelAnswer: 'The GIL is a mutex lock in CPython that prevents multiple native threads from executing Python bytecodes at once. For CPU-bound tasks (e.g. heavy math, matrix operations), multithreading cannot achieve true parallelism and multiprocessing should be used instead. For I/O-bound tasks (network requests, database calls), the GIL is released while waiting on I/O, allowing threads or asyncio event loops to run concurrently.'
  },
  {
    id: 'dsa_1',
    topic: 'DSA',
    difficulty: 'Foundational',
    question: 'How do Hash Maps achieve O(1) average time complexity for lookup and insertions? What occurs when a hash collision happens?',
    hint: 'Mention hash functions, bucket arrays, and collision resolution techniques like Separate Chaining or Open Addressing.',
    expectedKeywords: ['hash function', 'bucket', 'collision', 'chaining', 'linked list', 'open addressing', 'amortized'],
    modelAnswer: 'Hash Maps use a deterministic hash function to convert keys into integer array indices (buckets), providing direct O(1) memory access. When two distinct keys hash to the same bucket (collision), resolution techniques are used: Separate Chaining (storing collided entries in a linked list or balanced tree in that bucket) or Open Addressing (probing for the next available bucket slot).'
  },
  {
    id: 'db_1',
    topic: 'Databases & SQL',
    difficulty: 'Intermediate',
    question: 'What are the ACID properties in relational database management systems (DBMS)? Provide a brief definition of each.',
    hint: 'Atomicity, Consistency, Isolation, Durability.',
    expectedKeywords: ['atomicity', 'consistency', 'isolation', 'durability', 'transaction', 'rollback', 'commit'],
    modelAnswer: 'ACID guarantees reliable transactions: Atomicity ensures all statements in a transaction succeed or all are rolled back. Consistency ensures database state transitions strictly adhere to defined schema constraints and rules. Isolation ensures concurrent transactions execute without interfering with one another. Durability guarantees committed changes survive system crashes or power failures.'
  },
  {
    id: 'sd_1',
    topic: 'System Design',
    difficulty: 'Advanced',
    question: 'Compare Horizontal Scaling (Scale-out) with Vertical Scaling (Scale-up). What architectural challenges arise when scaling horizontally?',
    hint: 'Consider hardware limits, stateless microservices, distributed caching, and database consistency (CAP theorem).',
    expectedKeywords: ['horizontal', 'vertical', 'load balancer', 'stateless', 'consistency', 'cache', 'database'],
    modelAnswer: 'Vertical scaling upgrades existing machine hardware (CPU, RAM), which is simple but reaches hard physical and cost limits. Horizontal scaling adds more machines behind a load balancer. While horizontal scaling offers virtually unlimited scale, it introduces challenges: requiring stateless services, distributed session storage (e.g. Redis), distributed database replication, and network partition consistency management.'
  },
  {
    id: 'ml_1',
    topic: 'AI & ML',
    difficulty: 'Intermediate',
    question: 'What is Overfitting in machine learning models, and what are 3 effective techniques to prevent it?',
    hint: 'Consider train vs test loss curves, regularization (L1/L2), dropout, and cross-validation.',
    expectedKeywords: ['training', 'generalize', 'overfitting', 'regularization', 'dropout', 'cross-validation', 'early stopping'],
    modelAnswer: 'Overfitting occurs when a model learns noise and specific details of the training data rather than generalizing to unseen data (low training error, high test error). Key techniques to mitigate it: 1) Regularization (L1/L2 penalizing large weights), 2) Cross-Validation and Early Stopping during training, and 3) Dropout or data augmentation in deep neural networks.'
  }
];

export default function InterviewCoachView({ onSessionCompleted }) {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const topics = ['All', 'Python', 'DSA', 'Databases & SQL', 'System Design', 'AI & ML'];

  const filteredQuestions = selectedTopic === 'All'
    ? QUESTIONS_BANK
    : QUESTIONS_BANK.filter((q) => q.topic === selectedTopic);

  const activeQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];

  const handleEvaluate = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const lowerAns = userAnswer.toLowerCase();
    const matchedKeywords = activeQuestion.expectedKeywords.filter((kw) => lowerAns.includes(kw.toLowerCase()));
    const missingKeywords = activeQuestion.expectedKeywords.filter((kw) => !lowerAns.includes(kw.toLowerCase()));

    // Score calculation (0 to 100)
    const keywordPct = (matchedKeywords.length / activeQuestion.expectedKeywords.length) * 70;
    const lengthScore = Math.min(30, Math.round((userAnswer.trim().split(/\s+/).length / 40) * 30));
    const totalScore = Math.min(95, Math.round(keywordPct + lengthScore));

    const result = {
      score: totalScore,
      matchedKeywords,
      missingKeywords,
      modelAnswer: activeQuestion.modelAnswer
    };

    setFeedback(result);
    if (onSessionCompleted) {
      onSessionCompleted(totalScore);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setShowHint(false);
    setFeedback(null);
    setCurrentQuestionIndex((prev) => (prev + 1) % filteredQuestions.length);
  };

  return (
    <div className="workspace-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-pill">
          <span>●</span> Module G • Technical Interview Coach
        </div>
        <h1 className="hero-title">
          Targeted <span className="gradient-text">Technical Interview Preparation</span>
        </h1>
        <p className="hero-desc">
          Practice core engineering questions across Python, DSA, DBMS, System Design, and AI/ML. 
          Receive transparent rubric evaluations with key concept coverage checks.
        </p>
      </div>

      {/* Topic Filter Chips */}
      <div className="filter-chip-bar">
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            className={`filter-chip ${selectedTopic === t ? 'active' : ''}`}
            onClick={() => {
              setSelectedTopic(t);
              setCurrentQuestionIndex(0);
              setUserAnswer('');
              setFeedback(null);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Interactive Question Card */}
      {activeQuestion && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="badge badge-phase">{activeQuestion.topic}</span>
              <span className="badge badge-status">{activeQuestion.difficulty}</span>
            </div>
            <button
              type="button"
              className="preset-btn"
              onClick={handleNextQuestion}
              style={{ color: 'var(--primary-400)' }}
            >
              Next Question →
            </button>
          </div>

          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
            {activeQuestion.question}
          </div>

          {/* Hint Toggle */}
          <div>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setShowHint(!showHint)}
              style={{ fontSize: '0.8rem', color: 'var(--warning-text)' }}
            >
              {showHint ? '▲ Hide Hint' : '💡 Need a Hint?'}
            </button>
            {showHint && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--warning-text)' }}>
                {activeQuestion.hint}
              </div>
            )}
          </div>

          {/* Answer Input */}
          <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              className="jd-textarea"
              style={{ minHeight: '140px' }}
              placeholder="Type your technical answer here (explain principles, tradeoffs, and examples)..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {userAnswer ? userAnswer.trim().split(/\s+/).filter(Boolean).length : 0} words
              </span>
              <button
                type="submit"
                className="btn-analyze"
                style={{ width: 'auto', padding: '0.65rem 1.5rem' }}
                disabled={!userAnswer.trim()}
              >
                Evaluate Answer
              </button>
            </div>
          </form>

          {/* Feedback Section */}
          {feedback && (
            <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: feedback.score >= 70 ? 'var(--success-text)' : 'var(--warning-text)' }}>
                  Rubric Assessment Score: {feedback.score}%
                </span>
                <span className="badge badge-phase">
                  {feedback.score >= 80 ? 'Comprehensive' : feedback.score >= 50 ? 'Satisfactory' : 'Needs More Depth'}
                </span>
              </div>

              {/* Concepts Covered */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success-text)', marginBottom: '0.35rem' }}>
                  ✓ Key Concepts Identified ({feedback.matchedKeywords.length}):
                </div>
                <div className="skills-grid">
                  {feedback.matchedKeywords.length > 0 ? (
                    feedback.matchedKeywords.map((kw, i) => (
                      <span key={i} className="skill-pill pill-matched">{kw}</span>
                    ))
                  ) : (
                    <span className="empty-skills-msg">No core technical keywords detected in response.</span>
                  )}
                </div>
              </div>

              {/* Missing Concepts */}
              {feedback.missingKeywords.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '0.35rem' }}>
                    + Conceptual Gaps to Include ({feedback.missingKeywords.length}):
                  </div>
                  <div className="skills-grid">
                    {feedback.missingKeywords.map((kw, i) => (
                      <span key={i} className="skill-pill pill-missing">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Reference Answer */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-400)', marginBottom: '0.35rem' }}>
                  Model Reference Answer:
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {feedback.modelAnswer}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
