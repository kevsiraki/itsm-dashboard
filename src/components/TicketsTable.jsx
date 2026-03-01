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
          placeholder="Search by subject, ticket number, or requester..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="actions">
          <button className="btn" onClick={() => exportCSV(visible, 'tickets.csv')}>
            Export as CSV
          </button>
          <div className="small-muted">Sort by</div>
          <select
            value={`${sortBy.key}:${sortBy.dir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(':')
              setSortBy({ key: k, dir: d })
            }}
          >
            <option value="created:asc">Created (Newest first)</option>
            <option value="created:desc">Created (Oldest first)</option>
            <option value="priority_id:desc">Priority (Highest first)</option>
            <option value="number:asc">Ticket number (A-Z)</option>
          </select>
        </div>
      </div>
      {loading && <div className="status">Loading ticket data...</div>}
      {error && <div className="status error">Unable to load ticket data: {error}</div>}

      {!loading && !error && (
        <>
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
                  <th>Requester</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="status">
                      No tickets match the current filters.
                    </td>
                  </tr>
                )}
                {visible.map((t) => {
                  const pLabel = priorityLabel(t.priority_id)
                  return (
                    <tr key={t.id}>
                      <td data-label="ID">{t.id}</td>
                      <td data-label="Ticket Number">{t.number}</td>
                      <td data-label="Priority">
                        <span className={`priority-pill p-${pLabel.toLowerCase()}`}>{pLabel}</span>
                      </td>
                      <td data-label="Subject" className="subject">{t.subject}</td>
                      <td data-label="Status">
                        <div className="status-cell">
                          <span className={`dot ${statusDot(t.status)}`}></span>
                          <span className="status-text">{t.status}</span>
                        </div>
                      </td>
                      <td data-label="Department">{t.dept}</td>
                      <td data-label="Created">{prettyDate(t.created)}</td>
                      <td data-label="Requester">{t.user?.name?.name || t.user?.email?.email || '-'}</td>
                      <td data-label="Summary" className="message">{t.message}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="tickets-mobile">
            {visible.length === 0 && <div className="status">No tickets match the current filters.</div>}
            {visible.map((t) => {
              const pLabel = priorityLabel(t.priority_id)
              return (
                <article key={`mobile-${t.id}`} className="ticket-card">
                  <div className="ticket-card-top">
                    <div className="ticket-id">#{t.number || t.id}</div>
                    <span className={`priority-pill p-${pLabel.toLowerCase()}`}>{pLabel}</span>
                  </div>
                  <h4 className="ticket-subject">{t.subject || 'Untitled ticket'}</h4>
                  <div className="ticket-status">
                    <span className={`dot ${statusDot(t.status)}`}></span>
                    <span className="status-text">{t.status || 'Unknown'}</span>
                  </div>
                  <p className="ticket-message">{t.message || 'No summary available.'}</p>
                  <div className="ticket-meta">
                    <div>
                      <span className="ticket-meta-label">Requester</span>
                      <span className="ticket-meta-value">{t.user?.name?.name || t.user?.email?.email || '-'}</span>
                    </div>
                    <div>
                      <span className="ticket-meta-label">Department</span>
                      <span className="ticket-meta-value">{t.dept || '-'}</span>
                    </div>
                    <div>
                      <span className="ticket-meta-label">Created</span>
                      <span className="ticket-meta-value">{prettyDate(t.created)}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
