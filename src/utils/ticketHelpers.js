export function parseDate(s) {
  if (!s) return null
  const iso = s.includes(' ') ? s.replace(' ', 'T') : s
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d
}

export function prettyDate(s) {
  const d = parseDate(s)
  return d ? d.toLocaleString() : s
}

export function statusDot(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('open')) return 'green'
  if (s.includes('pend')) return 'yellow'
  if (s.includes('clos')) return 'gray'
  return 'gray'
}

export function priorityLabel(priorityId) {
  const map = {
    1: 'Low',
    2: 'Normal',
    3: 'High',
    4: 'Emergency',
  }
  const id = Number(priorityId)
  return map[id] || String(priorityId || '-')
}

export function formatHours(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0h'
  return `${Math.round(seconds / 3600)}h`
}
