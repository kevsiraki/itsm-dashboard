import React, { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { API_URL, PRIORITY_COLORS, SLA_SECONDS, STATUS_COLORS } from './constants/dashboard'
import {
  percentile,
  movingAverage,
  groupByHour,
  secondsSinceCreated,
  stddev,
  ewma,
  zscore,
  rateOfChange,
  sharpeLike,
} from './utils/metrics'
import { formatHours, parseDate, priorityLabel } from './utils/ticketHelpers'
import WindowHeader from './components/WindowHeader'
import KpiRow from './components/KpiRow'
import ChartsPanel from './components/ChartsPanel'
import QuantMetrics from './components/QuantMetrics'
import TicketsTable from './components/TicketsTable'
import SlaAlerts from './components/SlaAlerts'

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
  const [sortBy, setSortBy] = useState({ key: 'created', dir: 'asc' })
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
  const p50Hours = useMemo(() => formatHours(p50), [p50])
  const p90Hours = useMemo(() => formatHours(p90), [p90])
  const p99Hours = useMemo(() => formatHours(p99), [p99])
  const ageEwmaHours = useMemo(() => formatHours(ageEWMA), [ageEWMA])
  const ageStdHours = useMemo(() => formatHours(ageStd), [ageStd])
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
          <WindowHeader
            isDark={isDark}
            paused={paused}
            setTheme={setTheme}
            setPaused={setPaused}
            lastUpdated={lastUpdated}
            riskLevel={riskLevel}
            breachRate={metrics.breachRate}
            closureGap={closureGap}
            openRate={metrics.openRate}
            emergency={metrics.emergency}
            p50Hours={p50Hours}
            ageROC={ageROC}
          />

          <KpiRow metrics={metrics} trendData={trendData} throughput={throughput} p99Hours={p99Hours} />

          <ChartsPanel
            trendData={trendData}
            statusData={statusData}
            priorityData={priorityData}
            deptData={deptData}
            chartTick={chartTick}
            chartGrid={chartGrid}
            tooltipProps={tooltipProps}
          />

          {/*<QuantMetrics
            p50Hours={p50Hours}
            p90Hours={p90Hours}
            p99Hours={p99Hours}
            ageEwmaHours={ageEwmaHours}
            ageStdHours={ageStdHours}
            ageZ={ageZ}
            ageROC={ageROC}
            ageSharpe={ageSharpe}
          />*/}

          <TicketsTable
            loading={loading}
            error={error}
            query={query}
            setQuery={setQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            visible={visible}
          />

          <SlaAlerts slaBreaches={slaBreaches} />
        </div>
      </div>
    </div>
  )
}
