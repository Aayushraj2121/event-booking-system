import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { bookingApi, reportApi } from '../lib/api'
import { useAuth } from '../context/auth'
import { showNotification } from '../components/NotificationToast'

export default function BookingConfirmationPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    reportApi.booking(id)
      .then(({ booking }) => setBooking(booking))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleResendEmail = async () => {
    setSendingEmail(true)
    try {
      const res = await bookingApi.sendEmail(id)
      showNotification(res.message, 'success')
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) return <div className="page-loader">Loading confirmation…</div>
  if (error || !booking) return (
    <main className="error-page">
      <h1>Booking not found</h1>
      <Link to="/dashboard" className="primary-button">← Go to Dashboard</Link>
    </main>
  )

  const event = booking.event
  const dateObj = new Date(event?.date)
  const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const issuedOn = new Date(booking.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="confirmation-page">
      {/* Screen-only header */}
      <header className="dashboard-header no-print">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="outline-button" onClick={handleResendEmail} disabled={sendingEmail}>
            {sendingEmail ? 'Sending Email…' : '✉ Email Ticket Confirmation'}
          </button>
          <button className="primary-button" onClick={() => window.print()}>🖨 Print / Download</button>
          <Link to="/dashboard" className="outline-button">Dashboard</Link>
        </div>
      </header>

      {/* Printable area */}
      <div className="confirmation-printable">
        {/* Brand header */}
        <div className="print-header">
          <div className="print-brand">
            <span className="brand-mark print-mark"><i></i><i></i><i></i></span>
            <span>Evently</span>
          </div>
          <div className="print-status">
            <span className={`status-badge ${booking.status}`}>{booking.status.toUpperCase()}</span>
          </div>
        </div>

        {/* Ticket */}
        <div className="print-ticket">
          <div className="print-ticket-left">
            <p className="ticket-label">BOOKING CONFIRMATION</p>
            <h1 className="print-event-title">{event?.title}</h1>
            <div className="print-meta-grid">
              <div><span>Date</span><strong>{formattedDate}</strong></div>
              <div><span>Time</span><strong>{event?.time}</strong></div>
              <div><span>Venue</span><strong>{event?.venue}</strong></div>
              <div><span>City</span><strong>{event?.city}</strong></div>
              <div><span>Category</span><strong>{event?.category}</strong></div>
              <div><span>Seats</span><strong>{booking.seats}</strong></div>
              <div><span>Price/Seat</span><strong>₹{event?.price?.toLocaleString()}</strong></div>
              <div><span>Total Amount</span><strong>₹{booking.totalPrice?.toLocaleString()}</strong></div>
            </div>
          </div>
          <div className="print-ticket-divider">
            <div className="ticket-notch top"></div>
            <div className="ticket-dashes"></div>
            <div className="ticket-notch bottom"></div>
          </div>
          <div className="print-ticket-stub">
            <div className="stub-ref">
              <p>BOOKING REF</p>
              <h2>{booking.bookingRef}</h2>
              <span className={`status-badge ${booking.checkedIn ? 'confirmed' : ''}`} style={{ marginTop: 6, fontSize: 11 }}>
                {booking.checkedIn ? 'Checked-In ✅' : 'Venue Pass 🎟'}
              </span>
            </div>
            <div className="stub-qr" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '12px 0' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${booking.bookingRef}`}
                alt={`QR Code for ${booking.bookingRef}`}
                style={{ width: 120, height: 120, borderRadius: 8, border: '1px solid var(--line)', background: '#fff', padding: 4 }}
              />
              <small style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Scan for Venue Check-in</small>
            </div>
            <div className="stub-guest">
              <p>GUEST</p>
              <strong>{user?.name || booking.user?.name}</strong>
              <span>{user?.email || booking.user?.email}</span>
            </div>
            <div className="stub-issued">
              <p>ISSUED ON</p>
              <strong>{issuedOn}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="print-footer">
          <p>This is your official booking confirmation from Evently. Please carry this document to the venue.</p>
          <p>For support, contact help@evently.in</p>
        </div>
      </div>
    </main>
  )
}
