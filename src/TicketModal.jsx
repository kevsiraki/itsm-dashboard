import React from 'react'

export default function TicketModal({ ticket, onClose }) {
  if (!ticket) return null
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <div className="modal-sub">Ticket #{ticket.number}</div>
            <h3 className="modal-title">{ticket.subject}</h3>
            <div className="small-muted">{ticket.user?.name?.name || ticket.user?.email?.email} · {ticket.created}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-col">
            <div className="modal-card">
              <div className="small-muted">Status</div>
              <div style={{marginTop:6, fontWeight:700}}>{ticket.status}</div>
            </div>
            <div className="modal-card">
              <div className="small-muted">Dept</div>
              <div style={{marginTop:6}}>{ticket.dept}</div>
            </div>
            <div className="modal-card">
              <div className="small-muted">Priority</div>
              <div style={{marginTop:6}}>{ticket.priority_id || '—'}</div>
            </div>
          </div>
          <div className="modal-col wide">
            <div className="modal-message" style={{whiteSpace:'pre-wrap'}}>{ticket.message}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
