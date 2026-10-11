import React, { useState, useMemo } from 'react';

export default function HistoryExportView({
  historyList = [],
  currentResult,
  onLoadResult
}) {
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const hasHistory = historyList.length > 0 || Boolean(currentResult);

  // Combine currentResult into history display if not already in it
  const displayList = useMemo(() => {
    const list = [...historyList];
    if (currentResult && !list.some((h) => h.id === currentResult.id)) {
      list.unshift({
        id: currentResult.id || 'current_session',
        date: currentResult.date || 'Active Session',
        filename: currentResult.filename,
        matchScore: currentResult.analysis.match_percentage,
        matchedCount: currentResult.analysis.matched_skills.length,
        missingCount: currentResult.analysis.missing_skills.length,
        result: currentResult
      });
    }
    return list;
  }, [historyList, currentResult]);

  const handleExportJSON = () => {
    if (!currentResult) return;
    const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareerPilot_Report_${currentResult.filename.replace(/\.pdf$/i, '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCompare = (item) => {
    if (selectedForCompare.some((s) => s.id === item.id)) {
      setSelectedForCompare(selectedForCompare.filter((s) => s.id !== item.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, item]);
    }
  };

  const isComparing = selectedForCompare.length === 2;
  const compA = selectedForCompare[0];
  const compB = selectedForCompare[1];

  return (
    <div className="workspace-view" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="hero">
        <div className="hero-pill">
          <span>●</span> Module J & K • History & Report Export
        </div>
        <h1 className="hero-title">
          Analysis History & <span className="gradient-text">Comparison Lab</span>
        </h1>
        <p className="hero-desc">
          Review previous resume analyses, measure skill acquisition progress across revisions, and generate printable PDF summary reports.
        </p>
      </div>

      {/* Action Bar */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Saved Analyses</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {displayList.length} Session(s) Recorded
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="preset-btn"
            style={{ color: 'var(--primary-400)' }}
            onClick={() => window.print()}
            disabled={!currentResult}
          >
            🖨️ Print / Save PDF Report
          </button>

          <button
            type="button"
            className="preset-btn"
            style={{ color: 'var(--accent-cyan)' }}
            onClick={handleExportJSON}
            disabled={!currentResult}
          >
            📥 Export JSON
          </button>
        </div>
      </div>

      {/* Comparison Drawer (if 2 selected) */}
      {isComparing && (
        <div className="card" style={{ border: '2px solid var(--primary-500)', background: 'var(--bg-secondary)' }}>
          <div className="card-header">
            <div className="card-title">
              ⚖️ Side-by-Side Analysis Comparison
            </div>
            <button
              type="button"
              className="preset-btn"
              onClick={() => setSelectedForCompare([])}
            >
              Clear Comparison
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Version A */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Version A • {compA.date}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>{compA.filename}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                {compA.matchScore}% Match
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {compA.matchedCount} matched skills • {compA.missingCount} gaps
              </div>
            </div>

            {/* Version B */}
            <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Version B • {compB.date}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.25rem 0' }}>{compB.filename}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success-text)' }}>
                {compB.matchScore}% Match
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {compB.matchedCount} matched skills • {compB.missingCount} gaps
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.85rem' }}>
            Score Difference:{' '}
            <strong style={{ color: compB.matchScore >= compA.matchScore ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {compB.matchScore >= compA.matchScore ? '+' : ''}
              {(compB.matchScore - compA.matchScore).toFixed(1)}%
            </strong>
          </div>
        </div>
      )}

      {/* History List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {!hasHistory ? (
          <div className="card empty-state">
            <div className="empty-state-title">No Analysis History Yet</div>
            <div className="empty-state-desc">
              Analyses run in the <strong>Analysis Workspace</strong> will automatically be tracked here for historical progress analysis and exports.
            </div>
          </div>
        ) : (
          displayList.map((item) => {
            const isSelected = selectedForCompare.some((s) => s.id === item.id);
            return (
              <div key={item.id} className="card" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.filename}
                    </span>
                    <span className="badge badge-phase">{item.date}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Score: <strong>{item.matchScore}%</strong> • {item.matchedCount} matched • {item.missingCount} gaps
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`filter-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleCompare(item)}
                  >
                    {isSelected ? '✓ Selected for Compare' : '+ Compare'}
                  </button>

                  {item.result && onLoadResult && (
                    <button
                      type="button"
                      className="preset-btn"
                      style={{ color: 'var(--primary-400)' }}
                      onClick={() => onLoadResult(item.result)}
                    >
                      Reload Result
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
