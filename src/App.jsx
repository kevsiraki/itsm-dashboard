import React, { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  percentile,
  movingAverage,
  groupByHour,
  secondsSinceCreated,
  exportCSV,
  stddev,
  ewma,
  zscore,
  rateOfChange,
  sharpeLike,
} from './utils/metrics'

const API_URL =
  'https://demo.kevinsiraki.com/CommonServices/osticket?key=Fz%402%24%5EkTn!X8!B0eM1qWz%40Jr0Hf8jS6V!R2X1H9!fZb7eW8!g1c8'

const STATUS_COLORS = ['#34c759', '#ff9f0a', '#ff3b30', '#8e8e93']
const PRIORITY_COLORS = {
  Low: '#30d158',
  Normal: '#64d2ff',
  High: '#ff9f0a',
  Emergency: '#ff453a',
}
const SLA_SECONDS = 48 * 3600

function parseDate(s) {
  if (!s) return null
  const iso = s.includes(' ') ? s.replace(' ', 'T') : s
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d
}

function prettyDate(s) {
  const d = parseDate(s)
  return d ? d.toLocaleString() : s
}

function statusDot(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('open')) return 'green'
  if (s.includes('pend')) return 'yellow'
  if (s.includes('clos')) return 'gray'
  return 'gray'
}

function priorityLabel(priorityId) {
  const map = {
    1: 'Low',
    2: 'Normal',
    3: 'High',
    4: 'Emergency',
  }
  const id = Number(priorityId)
  return map[id] || String(priorityId || '-')
}

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

function formatHours(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0h'
  return `${Math.round(seconds / 3600)}h`
}

export default function App() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [paused, setPaused] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    if (saved === 'light' || saved === 'dark') return saved
    return 'dark'
  })
  const mounted = useRef(true)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState({ key: 'created', dir: 'desc' })
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    mounted.current = true
    let id = null

    const fetchData = async () => {
      if (paused) return
      try {
        setError(null)
        const res = await fetch(API_URL)
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = await res.json()
        if (mounted.current) {
          setTickets(Array.isArray(data) ? data : [])
          setLastUpdated(new Date())
          setLoading(false)
        }
      } catch (err) {
        if (mounted.current) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    fetchData()
    id = setInterval(fetchData, 60000)

    return () => {
      mounted.current = false
      if (id) clearInterval(id)
    }
  }, [paused])

  const metrics = useMemo(() => {
    const total = tickets.length
    let open = 0
    let closed = 0
    let pending = 0
    let highPrio = 0
    let emergency = 0
    let breaches = 0
    const statusCount = {}
    const ages = []

    tickets.forEach((t) => {
      const status = (t.status || '').toLowerCase()
      if (status.includes('open')) open += 1
      if (status.includes('clos')) closed += 1
      if (status.includes('pend')) pending += 1

      const prio = Number(t.priority_id)
      if (prio >= 3) highPrio += 1
      if (prio === 4) emergency += 1

      const ageSec = secondsSinceCreated(t.created)
      if (ageSec != null) {
        ages.push(ageSec)
        if (ageSec > SLA_SECONDS) breaches += 1
      }

      const raw = t.status || 'Unknown'
      statusCount[raw] = (statusCount[raw] || 0) + 1
    })

    const avgAgeSec = ages.length ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0

    return {
      total,
      open,
      closed,
      pending,
      highPrio,
      emergency,
      statusCount,
      breaches,
      avgAgeSec,
      avgAge: avgAgeSec ? formatHours(avgAgeSec) : '-',
      breachRate: total ? Math.round((breaches / total) * 100) : 0,
      openRate: total ? Math.round((open / total) * 100) : 0,
      closedRate: total ? Math.round((closed / total) * 100) : 0,
    }
  }, [tickets])

  const statusData = useMemo(
    () =>
      Object.entries(metrics.statusCount || {}).map(([name, value], i) => ({
        name,
        value,
        color: STATUS_COLORS[i % STATUS_COLORS.length],
      })),
    [metrics],
  )

  const trendData = useMemo(() => {
    const map = {}
    tickets.forEach((t) => {
      const d = parseDate(t.created)
      if (!d) return
      const day = d.toISOString().slice(0, 10)
      map[day] = (map[day] || 0) + 1
    })
    const arr = Object.entries(map)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, count]) => ({ day, count }))
    if (!arr.length) return [{ day: new Date().toISOString().slice(0, 10), count: 0 }]
    const ma = movingAverage(arr.map((x) => x.count), 3)
    return arr.map((x, i) => ({ ...x, ma: ma[i] }))
  }, [tickets])

  const throughput = useMemo(() => {
    const g = groupByHour(tickets, 24)
    const rows = g.map((p) => ({ hour: p.hour.slice(11), count: p.count }))
    const ma = movingAverage(rows.map((x) => x.count), 4)
    return rows.map((x, i) => ({ ...x, ma: ma[i] }))
  }, [tickets])

  const priorityData = useMemo(() => {
    const base = { Low: 0, Normal: 0, High: 0, Emergency: 0 }
    tickets.forEach((t) => {
      const label = priorityLabel(t.priority_id)
      if (label in base) base[label] += 1
    })
    return Object.entries(base).map(([name, value]) => ({
      name,
      value,
      color: PRIORITY_COLORS[name],
    }))
  }, [tickets])

  const deptData = useMemo(() => {
    const counts = {}
    tickets.forEach((t) => {
      const dept = t.dept || 'Unknown'
      counts[dept] = (counts[dept] || 0) + 1
    })
    return Object.entries(counts)
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [tickets])

  const agesSec = useMemo(() => tickets.map((t) => secondsSinceCreated(t.created)).filter(Boolean), [tickets])
  const p50 = useMemo(() => Math.round(percentile(agesSec, 0.5) || 0), [agesSec])
  const p90 = useMemo(() => Math.round(percentile(agesSec, 0.9) || 0), [agesSec])
  const p99 = useMemo(() => Math.round(percentile(agesSec, 0.99) || 0), [agesSec])
  const ageStd = useMemo(() => Math.round(stddev(agesSec) || 0), [agesSec])
  const ageEWMA = useMemo(() => {
    const arr = ewma(agesSec, 0.25)
    return Math.round(arr[arr.length - 1] || 0)
  }, [agesSec])
  const ageZ = useMemo(() => {
    const z = zscore(agesSec, agesSec[agesSec.length - 1] || 0)
    return Number(z.toFixed(2))
  }, [agesSec])
  const ageROC = useMemo(() => Math.round((rateOfChange(agesSec) || 0) * 100), [agesSec])
  const ageSharpe = useMemo(() => Number(sharpeLike(agesSec).toFixed(2)), [agesSec])
  const closureGap = useMemo(() => metrics.open - metrics.closed, [metrics.open, metrics.closed])
  const riskLevel = useMemo(() => {
    if (metrics.breachRate >= 25 || metrics.emergency >= 5) return 'Critical'
    if (metrics.breachRate >= 12 || metrics.emergency >= 2) return 'Elevated'
    return 'Stable'
  }, [metrics.breachRate, metrics.emergency])

  const slaBreaches = useMemo(
    () =>
      tickets.filter((t) => {
        const s = secondsSinceCreated(t.created)
        return s != null && s > SLA_SECONDS
      }),
    [tickets],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let arr = tickets.filter((t) => {
      if (!q) return true
      return (
        String(t.subject || '')
          .toLowerCase()
          .includes(q) ||
        String(t.number || '')
          .toLowerCase()
          .includes(q) ||
        String(t.user?.name?.name || '')
          .toLowerCase()
          .includes(q)
      )
    })
    const key = sortBy.key
    const dir = sortBy.dir === 'asc' ? 1 : -1
    arr = arr.slice().sort((a, b) => {
      const va = a[key] == null ? '' : a[key]
      const vb = b[key] == null ? '' : b[key]
      if (key === 'created') return (new Date(va) - new Date(vb)) * -dir
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
    return arr
  }, [tickets, query, sortBy])

  const chartTick = isDark ? '#a7b7ce' : '#42516a'
  const chartGrid = isDark ? 'rgba(180, 197, 224, 0.18)' : 'rgba(37, 58, 92, 0.15)'
  const tooltipProps = {
    contentStyle: {
      background: isDark ? '#162338' : '#ffffff',
      color: isDark ? '#f2f6ff' : '#122033',
      border: isDark ? '1px solid rgba(193, 208, 235, 0.34)' : '1px solid rgba(59, 84, 126, 0.26)',
      borderRadius: '10px',
      boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.32)' : '0 10px 28px rgba(18,31,55,0.15)',
    },
    labelStyle: {
      color: isDark ? '#f2f6ff' : '#1c2d44',
      fontWeight: 600,
    },
    itemStyle: {
      color: isDark ? '#dbe7ff' : '#243a59',
    },
  }

  return (
    <div className="app">
      <div className="container">
        <div className="window-shell">
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
              <div className="eyebrow">ITSM Dashboard</div>
              <h1>Ticket Intelligence Command Deck</h1>
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
                <div className="meta-value">{metrics.breachRate}%</div>
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
              <span className="exec-value">{metrics.openRate}% open</span>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Critical Tickets</span>
              <span className="exec-value">{metrics.emergency}</span>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Median Ticket Age</span>
              <span className="exec-value">{formatHours(p50)}</span>
            </div>
            <div className="exec-divider"></div>
            <div className="exec-item">
              <span className="exec-label">Throughput Signal</span>
              <span className="exec-value">{ageROC >= 0 ? `+${ageROC}%` : `${ageROC}%`}</span>
            </div>
          </section>

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

            <KPI label="High Priority" value={metrics.highPrio} delta={`P99 ${formatHours(p99)}`} color="yellow">
              <ResponsiveContainer width="100%" height={36}>
                <LineChart data={throughput}>
                  <Line type="monotone" dataKey="count" stroke="#ff9f0a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </KPI>

            <KPI label="Emergency" value={metrics.emergency} delta={`${metrics.breachRate}% breach risk`} color="red" />
            <KPI label="Avg Ticket Age" value={metrics.avgAge} delta={`${metrics.breaches} SLA breaches`} color="blue" />
          </section>

          <section className="panels">
            <div className="panel left">
              <h3>Ticket Volume Trend</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData} margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volumeGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#64d2ff" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#64d2ff" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
                    <XAxis dataKey="day" tick={{ fill: chartTick }} />
                    <YAxis tick={{ fill: chartTick }} />
                    <Tooltip {...tooltipProps} />
                    <Legend />
                    <Area type="monotone" dataKey="count" stroke="#0a84ff" fill="url(#volumeGlow)" name="Daily count" />
                    <Line type="monotone" dataKey="ma" stroke="#30d158" strokeWidth={2} dot={false} name="Moving avg" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel right">
              <h3>Status Distribution</h3>
              <div className="chart mini">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={78} paddingAngle={3}>
                      {statusData.map((entry, index) => (
                        <Cell key={`status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipProps} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel left">
              <h3>Priority Pressure</h3>
              <div className="chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData} margin={{ top: 8, right: 14, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
                    <XAxis dataKey="name" tick={{ fill: chartTick }} />
                    <YAxis tick={{ fill: chartTick }} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {priorityData.map((entry) => (
                        <Cell key={`priority-${entry.name}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel right">
              <h3>Department Load</h3>
              <div className="chart mini">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={deptData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} />
                    <XAxis dataKey="dept" tick={{ fill: chartTick }} />
                    <YAxis tick={{ fill: chartTick }} />
                    <Tooltip {...tooltipProps} />
                    <Bar dataKey="count" fill="#5e5ce6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="quant panel">
            <h3>Quant Metrics</h3>
            <div className="quant-grid">
              <div className="quant-card">
                <div className="quant-title">P50 Age</div>
                <div className="quant-value">{formatHours(p50)}</div>
              </div>
              <div className="quant-card">
                <div className="quant-title">P90 Age</div>
                <div className="quant-value">{formatHours(p90)}</div>
              </div>
              <div className="quant-card">
                <div className="quant-title">P99 Age</div>
                <div className="quant-value">{formatHours(p99)}</div>
              </div>
              <div className="quant-card">
                <div className="quant-title">EWMA Age</div>
                <div className="quant-value">{formatHours(ageEWMA)}</div>
              </div>
              <div className="quant-card">
                <div className="quant-title">Std Dev</div>
                <div className="quant-value">{formatHours(ageStd)}</div>
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

          <main className="table-area">
            <div className="table-controls">
              <input
                className="search"
                placeholder="Search subject, number, user..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="actions">
                <button className="btn" onClick={() => exportCSV(visible, 'tickets.csv')}>
                  Export CSV
                </button>
                <div className="small-muted">Sort:</div>
                <select
                  value={`${sortBy.key}:${sortBy.dir}`}
                  onChange={(e) => {
                    const [k, d] = e.target.value.split(':')
                    setSortBy({ key: k, dir: d })
                  }}
                >
                  <option value="created:desc">Newest</option>
                  <option value="created:asc">Oldest</option>
                  <option value="priority_id:desc">Priority</option>
                  <option value="number:asc">Number</option>
                </select>
              </div>
            </div>
            {loading && <div className="status">Loading...</div>}
            {error && <div className="status error">Error: {error}</div>}

            {!loading && !error && (
              <div className="table-wrap">
                <table className="tickets">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Number</th>
                      <th>Priority</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Dept</th>
                      <th>Created</th>
                      <th>User</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => {
                      const pLabel = priorityLabel(t.priority_id)
                      return (
                        <tr key={t.id}>
                          <td>{t.id}</td>
                          <td>{t.number}</td>
                          <td>
                            <span className={`priority-pill p-${pLabel.toLowerCase()}`}>{pLabel}</span>
                          </td>
                          <td className="subject">{t.subject}</td>
                          <td>
                            <div className="status-cell">
                              <span className={`dot ${statusDot(t.status)}`}></span>
                              <span className="status-text">{t.status}</span>
                            </div>
                          </td>
                          <td>{t.dept}</td>
                          <td>{prettyDate(t.created)}</td>
                          <td>{t.user?.name?.name || t.user?.email?.email || '-'}</td>
                          <td className="message">{t.message}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </main>

          <aside className="alerts">
            <h4>Live Alerts - SLA Breaches</h4>
            {slaBreaches.length === 0 && <div className="small-muted">No breaches</div>}
            {slaBreaches.slice(0, 8).map((b) => (
              <div key={b.id} className="alert">
                <div className="alert-left">
                  <div className="alert-subject">
                    #{b.number} - {b.subject}
                  </div>
                  <div className="small-muted">
                    {b.user?.name?.name || b.user?.email?.email} - {prettyDate(b.created)}
                  </div>
                </div>
                <div className="alert-right">
                  <div className="pill">{Math.round(secondsSinceCreated(b.created) / 3600)}h</div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  )
}
