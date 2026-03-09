export function parseDate(s) {
  if (!s) return null
  const iso = s.includes(' ') ? s.replace(' ', 'T') : s
  const d = new Date(iso)
  if (isNaN(d)) return null
  return d
}

function flattenText(value, depth = 0) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((v) => flattenText(v, depth + 1)).filter(Boolean).join(' ')
  if (typeof value !== 'object' || depth > 2) return ''

  const keys = [
    'name',
    'label',
    'value',
    'title',
    'text',
    'status',
    'state',
    'display',
    'status_name',
    'ticket_status',
  ]
  const parts = keys.map((k) => flattenText(value[k], depth + 1)).filter(Boolean)
  if (!parts.length) return ''
  return parts.join(' ')
}

function hasTerminalText(value) {
  if (value == null) return false
  const text = flattenText(value).toLowerCase()
  return (
    text.includes('clos') ||
    text.includes('resolv') ||
    text.includes('solved') ||
    text.includes('done') ||
    text.includes('complete')
  )
}

function hasTruthyFlag(value) {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = String(value).trim().toLowerCase()
  return ['1', 'true', 'yes', 'y'].includes(text)
}

function hasTerminalDate(value) {
  if (value == null) return false
  const raw = String(value).trim()
  if (!raw) return false
  const normalized = raw.toLowerCase()
  if (
    normalized === '0' ||
    normalized === '0000-00-00' ||
    normalized === '0000-00-00 00:00:00' ||
    normalized === 'null' ||
    normalized === 'undefined' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'none' ||
    normalized === '-'
  ) {
    return false
  }
  return parseDate(raw) != null
}

export function isTerminalTicket(ticket) {
  if (!ticket || typeof ticket !== 'object') return false

  const lifecycle = ticketLifecycleText(ticket)
  const hasTerminalLifecycle = hasTerminalText(lifecycle)
  const hasActiveLifecycle = lifecycle.includes('open') || lifecycle.includes('pend')

  if (hasTerminalLifecycle && !hasActiveLifecycle) {
    return true
  }

  if (hasTruthyFlag(ticket.closed) || hasTruthyFlag(ticket.is_closed) || hasTruthyFlag(ticket.resolved)) {
    return true
  }

  if (
    hasTerminalDate(ticket.closed_at) ||
    hasTerminalDate(ticket.closedate) ||
    hasTerminalDate(ticket.closed_date) ||
    hasTerminalDate(ticket.resolved_at) ||
    hasTerminalDate(ticket.resolvedate) ||
    hasTerminalDate(ticket.resolved_date)
  ) {
    return true
  }

  return false
}

export function ticketLifecycleText(ticket) {
  if (!ticket || typeof ticket !== 'object') return ''
  return [
    flattenText(ticket.status),
    flattenText(ticket.state),
    flattenText(ticket.status_name),
    flattenText(ticket.ticket_status),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function prettyDate(s) {
  const d = parseDate(s)
  return d ? d.toLocaleString() : s
}

export function statusDot(status) {
  const s = (status || '').toLowerCase()
  if (s.includes('open') || s.includes('progress')) return 'green'
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
