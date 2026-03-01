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
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div className="window-title">ITSM Command Center</div>
        <div className="toolbar-actions">
          <button className="btn ghost" onClick={() => setPaused((v) => !v)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <header className="app-header hero">
        <div className="header-copy">
          <div className="eyebrow">osTicket Dashboards</div>
          <h1>Ticket Command Deck</h1>
          <p className="muted">
            Live queue telemetry every 60s - Last sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}
          </p>
        </div>
        <div className="hero-meta">
          <div className="meta-card">
            <div className="meta-label">Operational Risk</div>
            <div className={`meta-value risk-${riskLevel.toLowerCase()}`}>{riskLevel}</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">SLA Exposure</div>
            <div className="meta-value">{breachRate}%</div>
          </div>
          <div className="meta-card">
            <div className="meta-label">Open-Closed Delta</div>
            <div className="meta-value">{closureGap >= 0 ? `+${closureGap}` : closureGap}</div>
          </div>
        </div>
      </header>

      <section className="executive-strip">
        <div className="exec-item">
          <span className="exec-label">Queue Pressure</span>
          <span className="exec-value">{openRate}% open</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Critical Tickets</span>
          <span className="exec-value">{emergency}</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Median Ticket Age</span>
          <span className="exec-value">{p50Hours}</span>
        </div>
        <div className="exec-divider"></div>
        <div className="exec-item">
          <span className="exec-label">Throughput Signal</span>
          <span className="exec-value">{ageROC >= 0 ? `+${ageROC}%` : `${ageROC}%`}</span>
        </div>
      </section>
    </>
  )
}
