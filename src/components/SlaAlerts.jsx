import React from 'react'
import { secondsSinceCreated } from '../utils/metrics'
import { prettyDate } from '../utils/ticketHelpers'

export default function SlaAlerts({ slaBreaches }) {
  
  return (
    <aside className="alerts">
      <h4>Active SLA Breaches</h4>
      {slaBreaches.length === 0 && <div className="small-muted">No active SLA breaches.</div>}
      {slaBreaches.slice(0, 8).map((b) => (
        <div key={b.id} className="alert">
          <div className="alert-left">
            <div className="alert-subject">
              #{b.number} - {b.subject}
            </div>
            <div className="small-muted">
              {b.user?.name?.name || b.user?.email?.email} - Created {prettyDate(b.created)}
            </div>
          </div>
          <div className="alert-right">
            <div className="pill">{Math.round(secondsSinceCreated(b.created) / 3600)}h overdue</div>
          </div>
        </div>
      ))}
    </aside>
  )
}
