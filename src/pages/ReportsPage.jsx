import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { reportApi } from '../lib/api'

function downloadCSV(rows, filename) {
  const header = Object.keys(rows[0]).join(',')
  const body = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [eventReport, setEventReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  useEffect(() => {
    reportApi.summary()
      .then(({ summaries }) => setSummary(summaries))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadEventReport = async (eventId) => {
    setReportLoading(true)
    try {
      const data = await reportApi.event(eventId)
      setEventReport(data)
      setSelected(eventId)
    } catch (err) { alert(err.message) }
    finally { setReportLoading(false) }
  }

  const exportSummaryCSV = () => {
    if (!summary.length) return
    downloadCSV(summary.map(s => ({
      Event: s.event.title,
      Date: new Date(s.event.date).toLocaleDateString('en-IN'),
      City: s.event.city,
      Category: s.event.category,
      'Tickets Sold': s.ticketsSold,
      'Total Tickets': s.totalTickets,
      Revenue: `₹${s.revenue.toLocaleString()}`,
      Bookings: s.bookingCount,
    })), 'evently-summary.csv')
  }

  const exportEventCSV = () => {
    if (!eventReport) return
    downloadCSV(eventReport.bookings.map(b => ({
      'Booking Ref': b.bookingRef,
      Guest: b.user?.name,
      Email: b.user?.email,
      Seats: b.seats,
      'Total Paid': `₹${b.totalPrice}`,
      Status: b.status,
      Date: new Date(b.createdAt).toLocaleDateString('en-IN'),
    })), `report-${eventReport.event.title.replace(/\s+/g, '-')}.csv`)
  }

  const exit = () => { logout(); navigate('/') }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <nav className="admin-nav">
          <button onClick={() => navigate('/dashboard')}><span>🏠</span> Dashboard</button>
          <button onClick={() => navigate('/admin')}><span>⚙</span> Admin Panel</button>
          <button className="active"><span>📄</span> Reports</button>
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-badge">Admin</span>
          <span className="admin-name">{user.name}</span>
          <button className="logout-link" onClick={exit}>Log out</button>
        </div>
      </aside>

      <div className="admin-content">
        <div className="admin-section">
          <div className="admin-section-header">
            <h1>Event Reports</h1>
            <button className="outline-button" onClick={exportSummaryCSV} disabled={!summary.length}>⬇ Export Summary CSV</button>
          </div>

          {loading ? <p className="admin-loading">Loading reports…</p> : (
            <>
              {/* Summary table */}
              <div className="dash-card">
                <h2>Registration Summary — All Events</h2>
                <div className="table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Event</th><th>Date</th><th>City</th><th>Sold</th><th>Total</th><th>Fill %</th><th>Revenue</th><th>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No events yet.</td></tr>}
                      {summary.map((s, i) => (
                        <tr key={i} className={selected === s.event._id ? 'selected-row' : ''}>
                          <td><strong>{s.event.title}</strong></td>
                          <td>{new Date(s.event.date).toLocaleDateString('en-IN')}</td>
                          <td>{s.event.city}</td>
                          <td>{s.ticketsSold}</td>
                          <td>{s.totalTickets}</td>
                          <td>
                            <div className="fill-bar">
                              <div className="fill-inner" style={{ width: `${s.totalTickets ? (s.ticketsSold/s.totalTickets)*100 : 0}%` }}></div>
                              <span>{s.totalTickets ? Math.round((s.ticketsSold/s.totalTickets)*100) : 0}%</span>
                            </div>
                          </td>
                          <td>₹{s.revenue.toLocaleString()}</td>
                          <td>
                            <button className="icon-btn" onClick={() => loadEventReport(s.event._id)}>👁</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-event report */}
              {reportLoading && <p className="admin-loading">Loading event report…</p>}
              {eventReport && !reportLoading && (
                <div className="dash-card">
                  <div className="admin-section-header">
                    <h2>Attendee Report: {eventReport.event.title}</h2>
                    <button className="outline-button" onClick={exportEventCSV}>⬇ Export CSV</button>
                  </div>
                  <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card stat-purple">
                      <div className="stat-icon">🎟</div>
                      <div className="stat-body"><span className="stat-label">Tickets Sold</span><strong className="stat-value">{eventReport.ticketsSold}</strong></div>
                    </div>
                    <div className="stat-card stat-lime">
                      <div className="stat-icon">💰</div>
                      <div className="stat-body"><span className="stat-label">Revenue</span><strong className="stat-value">₹{eventReport.revenue.toLocaleString()}</strong></div>
                    </div>
                    <div className="stat-card stat-blue">
                      <div className="stat-icon">👥</div>
                      <div className="stat-body"><span className="stat-label">Bookings</span><strong className="stat-value">{eventReport.bookings.length}</strong></div>
                    </div>
                  </div>
                  <div className="table-wrap">
                    <table className="analytics-table">
                      <thead>
                        <tr><th>Ref</th><th>Guest</th><th>Email</th><th>Seats</th><th>Paid</th><th>Status</th><th>Booked</th></tr>
                      </thead>
                      <tbody>
                        {eventReport.bookings.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No bookings yet.</td></tr>}
                        {eventReport.bookings.map(b => (
                          <tr key={b._id}>
                            <td><code>{b.bookingRef}</code></td>
                            <td>{b.user?.name}</td>
                            <td>{b.user?.email}</td>
                            <td>{b.seats}</td>
                            <td>₹{b.totalPrice.toLocaleString()}</td>
                            <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                            <td>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
