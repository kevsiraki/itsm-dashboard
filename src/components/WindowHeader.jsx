import React from 'react'

export default function WindowHeader({
  isDark,
  paused,
  setTheme,
  setPaused,
  lastUpdated,
  riskLevel,
  breachRate,
  closureGap,
  openRate,
  emergency,
  p50Hours,
  ageROC,
}) {
  return (
    <>
      <div className="window-toolbar">
        <button className="theme-toggle" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
          {isDark ? 'Switch to Light' : 'Switch to Dark'}
        </button>
        <div className="window-title">Service Desk Operations Console</div>
        <div className="toolbar-actions">
          <button className="btn ghost" onClick={() => setPaused((v) => !v)}>
            {paused ? 'Resume Data Feed' : 'Pause Data Feed'}
          </button>
        </div>
      </div>

      <header className="app-header hero">
        <div className="header-copy">
          <div className="eyebrow">Operations Intelligence</div>
          <h1>Incident & Request Performance</h1>
          <p className="muted">
            Real-time queue telemetry, refreshed every 60 seconds. Last synchronized at{' '}
            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'not yet available'}.
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card">
            <div className="meta-label">Operational Risk</div>
            <div className={`meta-value risk-${riskLevel.toLowerCase()}`}>{riskLevel}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">SLA Breach Exposure</div>
            <div className="meta-value">{breachRate}%</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Open vs Resolved Delta</div>
            <div className="meta-value">{closureGap >= 0 ? `+${closureGap}` : closureGap}</div>
          </div>
        </div>
      </header>

      <section className="executive-strip">
        <div className="exec-item">
          <span className="exec-label">Active Queue Pressure</span>
          <span className="exec-value">{openRate}% open tickets</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Emergency Backlog</span>
          <span className="exec-value">{emergency}</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Median Ticket Age</span>
          <span className="exec-value">{p50Hours}</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Throughput Trend Signal</span>
          <span className="exec-value">{ageROC >= 0 ? `+${ageROC}%` : `${ageROC}%`}</span>
        </div>
      </section>
    </>
  )
}
