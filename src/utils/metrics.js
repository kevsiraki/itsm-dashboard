// Utility functions for metrics and data transformations
export function percentile(values = [], p = 0.5) {
  if (!values.length) return 0
  const arr = values.slice().sort((a, b) => a - b)
  const idx = (arr.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return arr[lo]
  return arr[lo] + (arr[hi] - arr[lo]) * (idx - lo)
}

export function movingAverage(values = [], window = 3) {
  if (!values.length) return []
  const result = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = values.slice(start, i + 1)
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length
    result.push(Number(avg.toFixed(2)))
  }
  return result
}

export function groupByHour(tickets = [], hours = 24) {
  // returns array of { hour, count } for last `hours` hours
  const now = Date.now()
  const buckets = {}
  for (let i = 0; i < hours; i++) {
    const t = new Date(now - (hours - 1 - i) * 3600 * 1000)
    const key = t.toISOString().slice(0, 13) // YYYY-MM-DDTHH
    buckets[key] = 0
  }

  tickets.forEach((t) => {
    if (!t.created) return
    const ts = t.created.replace(' ', 'T')
    const d = new Date(ts)
    if (isNaN(d)) return
    const key = d.toISOString().slice(0, 13)
    if (key in buckets) buckets[key]++
  })

  return Object.entries(buckets).map(([k, v]) => ({ hour: k, count: v }))
}

export function secondsSinceCreated(created) {
  if (!created) return null
  const d = new Date((created || '').replace(' ', 'T'))
  if (isNaN(d)) return null
  return (Date.now() - d.getTime()) / 1000
}

export function exportCSV(rows = [], filename = 'export.csv') {
  if (!rows || !rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys.join(',')]
  for (const r of rows) {
    const line = keys.map((k) => {
      const v = r[k] == null ? '' : String(r[k]).replace(/"/g, '""')
      return `"${v.replace(/\n/g, ' ')}"`
    })
    csv.push(line.join(','))
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function mean(values = []) {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stddev(values = []) {
  if (!values.length) return 0
  const m = mean(values)
  const v = values.reduce((acc, x) => acc + Math.pow(x - m, 2), 0) / values.length
  return Math.sqrt(v)
}

export function ewma(values = [], alpha = 0.2) {
  if (!values.length) return []
  const out = []
  let s = values[0]
  out.push(Number(s.toFixed(2)))
  for (let i = 1; i < values.length; i++) {
    s = alpha * values[i] + (1 - alpha) * s
    out.push(Number(s.toFixed(2)))
  }
  return out
}

export function zscore(values = [], x = null) {
  if (!values.length) return 0
  const m = mean(values)
  const sd = stddev(values)
  const val = x == null ? values[values.length - 1] : x
  return sd === 0 ? 0 : (val - m) / sd
}

export function rateOfChange(values = []) {
  if (values.length < 2) return 0
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  if (!prev) return 0
  return (last - prev) / Math.abs(prev || 1)
}

export function sharpeLike(values = []) {
  const m = mean(values)
  const sd = stddev(values)
  if (sd === 0) return 0
  return m / sd
}

