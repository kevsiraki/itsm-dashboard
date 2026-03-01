import React from 'react'

export default function QuantMetrics({ p50Hours, p90Hours, p99Hours, ageEwmaHours, ageStdHours, ageZ, ageROC, ageSharpe }) {
  return (
    <section className="quant panel">
      <h3>Quant Metrics</h3>
      <div className="quant-grid">
        <div className="quant-card">
          <div className="quant-title">P50 Age</div>
          <div className="quant-value">{p50Hours}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">P90 Age</div>
          <div className="quant-value">{p90Hours}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">P99 Age</div>
          <div className="quant-value">{p99Hours}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">EWMA Age</div>
          <div className="quant-value">{ageEwmaHours}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">Std Dev</div>
          <div className="quant-value">{ageStdHours}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">Z-Score</div>
          <div className="quant-value">{ageZ}</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">Rate of Change</div>
          <div className="quant-value">{ageROC}%</div>
        </div>
        <div className="quant-card">
          <div className="quant-title">Sharpe-like</div>
          <div className="quant-value">{ageSharpe}</div>
        </div>
      </div>
    </section>
  )
}
