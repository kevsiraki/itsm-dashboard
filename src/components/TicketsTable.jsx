import React from 'react'
import { exportCSV } from '../utils/metrics'
import { prettyDate, priorityLabel, statusDot } from '../utils/ticketHelpers'

export default function TicketsTable({
  loading,
  error,
  query,
  setQuery,
  sortBy,
  setSortBy,
  visible,
}) {
  return (
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
            <option value="created:asc">Newest</option>
            <option value="created:desc">Oldest</option>
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
  )
}
