import React from 'react'
import { ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts'

function KPI({ label, value, delta, color, children }) {
  return (
    <div className="kpi">
      <div className="kpi-head">
        <div className={`dot ${color}`}></div>
        <div className="kpi-label">{label}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {delta != null && <div className="kpi-delta">{delta}</div>}
      {children ? <div className="kpi-spark">{children}</div> : null}
    </div>
  )
}

export default function KpiRow({ metrics, trendData, throughput, p99Hours }) {
  return (
    <section className="kpi-row">
      <KPI label="Total Tickets" value={metrics.total} delta={`Open rate ${metrics.openRate}%`} color="blue">
        <ResponsiveContainer width="100%" height={36}>
          <LineChart data={trendData}>
            <Line type="monotone" dataKey="count" stroke="#64d2ff" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </KPI>

      <KPI label="Open Queue" value={metrics.open} delta={`${metrics.pending} pending`} color="green">
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={throughput}>
            <Area type="monotone" dataKey="count" stroke="#34c759" fill="#34c759" fillOpacity={0.16} />
          </AreaChart>
        </ResponsiveContainer>
      </KPI>

      <KPI label="Closed" value={metrics.closed} delta={`Close rate ${metrics.closedRate}%`} color="gray">
        <ResponsiveContainer width="100%" height={36}>
          <LineChart data={throughput}>
            <Line type="monotone" dataKey="ma" stroke="#8e8e93" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </KPI>

      <KPI label="High Priority" value={metrics.highPrio} delta={`P99 ${p99Hours}`} color="yellow">
        <ResponsiveContainer width="100%" height={36}>
          <LineChart data={throughput}>
            <Line type="monotone" dataKey="count" stroke="#ff9f0a" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </KPI>

      <KPI label="Emergency" value={metrics.emergency} delta={`${metrics.breachRate}% breach risk`} color="red" />
      <KPI label="Avg Ticket Age" value={metrics.avgAge} delta={`${metrics.breaches} SLA breaches`} color="blue" />
    </section>
  )
}
