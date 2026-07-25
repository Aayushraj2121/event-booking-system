import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventApi, bookingApi } from '../lib/api'
import { useAuth } from '../context/auth'
import VisualSeatMap from '../components/VisualSeatMap'
import PaymentGatewayModal from '../components/PaymentGatewayModal'

export default function BookingPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seats, setSeats] = useState(1)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showPayment, setShowPayment] = useState(false)
  const [booking, setBooking] = useState(null) // confirmed booking
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    eventApi.get(eventId)
      .then(({ event }) => setEvent(event))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [eventId])

  const [selectedTier, setSelectedTier] = useState('General')

  const currentTierObj = event?.ticketTiers?.find(t => t.name === selectedTier)
  const activePrice = currentTierObj ? currentTierObj.price : event?.price || 0
  const maxSeats = Math.min(10, currentTierObj ? currentTierObj.available : event?.ticketsAvailable || 0)

  // Calculate dynamic seat pricing (VIP Rows A & B = 1.5x, Standard Rows C-E = 1.0x)
  const calculateTotal = () => {
    if (selectedSeats.length === 0) return activePrice * seats
    return selectedSeats.reduce((sum, seatId) => {
      const row = seatId.split('-')[0]
      const isVip = row === 'A' || row === 'B'
      const price = isVip ? Math.round(activePrice * 1.5) : activePrice
      return sum + price
    }, 0)
  }

  const total = calculateTotal()

  const handleStartCheckout = () => {
    setError('')
    setShowPayment(true)
  }

  const confirmBooking = async () => {
    setSubmitting(true)
    setError('')
    try {
      const seatCount = selectedSeats.length > 0 ? selectedSeats.length : seats
      const { booking: b } = await bookingApi.create({ eventId, seats: seatCount, tierName: selectedTier, selectedSeats })
      setBooking(b)
      setShowPayment(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-loader">Loading event…</div>
  if (!event) return null

  const dateObj = new Date(event.date)
  const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })

  // Confirmation screen
  if (booking) {
    return (
      <main className="booking-page">
        <header className="dashboard-header">
          <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        </header>
        <div className="booking-confirmation-inline">
          <div className="confirmation-icon">✓</div>
          <h1>Booking Confirmed!</h1>
          <p className="confirmation-subtitle">Your tickets are secured. See you there!</p>
          <div className="confirmation-ticket">
            <div className="ticket-header">
              <span>EVENTLY / TICKET</span>
              <span className="booking-ref-badge">{booking.bookingRef}</span>
            </div>
            <div className="ticket-body">
              <h2>{booking.event?.title || event.title}</h2>
              <div className="ticket-meta">
                <div><span>📅</span>{formattedDate} · {event.time}</div>
                <div><span>📍</span>{event.venue}, {event.city}</div>
                <div><span>🎟</span>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</div>
                <div><span>💰</span>₹{booking.totalPrice.toLocaleString()}</div>
              </div>
            </div>
            <div className="ticket-footer">
              <span>Issued to {user.name}</span>
              <span>{new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
          <div className="confirmation-actions">
            <Link to={`/booking/${booking._id}/confirmation`} className="primary-button">View Full Confirmation <span>→</span></Link>
            <Link to="/dashboard" className="outline-button">Go to Dashboard</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="booking-page">
      <header className="dashboard-header">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <Link to={`/events/${eventId}`} className="back-home">← Back to event</Link>
      </header>

      <div className="booking-layout">
        {/* Event summary */}
        <div className="booking-event-summary">
          <p className="eyebrow"><span></span> YOU'RE BOOKING</p>
          <h1>{event.title}</h1>
          <div className="booking-event-meta">
            <span>📅 {formattedDate} · {event.time}</span>
            <span>📍 {event.venue}, {event.city}</span>
          </div>
          {event.bannerUrl && <img className="booking-banner" src={`http://localhost:5001${event.bannerUrl}`} alt={event.title} />}
        </div>

        {/* Booking form */}
        <div className="booking-form-card">
          <h2>Select Tickets</h2>

          {event.ticketTiers?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Ticket Tier</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {event.ticketTiers.map(tier => (
                  <button
                    key={tier.name}
                    type="button"
                    onClick={() => setSelectedTier(tier.name)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
                      borderRadius: 10, border: selectedTier === tier.name ? '2px solid #745ec5' : '1px solid var(--line)',
                      background: selectedTier === tier.name ? 'rgba(116,94,197,.08)' : 'var(--paper)', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{tier.name}</strong>
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>{tier.available} left</span>
                    </div>
                    <strong style={{ fontSize: 15, color: 'var(--ink)' }}>₹{tier.price.toLocaleString()}</strong>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive 2D Visual Seat Map */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Select Visual Seat Map (Optional)</label>
            <VisualSeatMap onSeatsSelected={(s) => { setSelectedSeats(s); if (s.length > 0) setSeats(s.length); }} maxSeats={maxSeats} />
          </div>

          <div className="seat-selector">
            <label>Number of Seats</label>
            <div className="seat-controls">
              <button className="seat-btn" onClick={() => setSeats(s => Math.max(1, s - 1))} aria-label="Decrease">−</button>
              <span className="seat-count">{selectedSeats.length > 0 ? selectedSeats.length : seats}</span>
              <button className="seat-btn" onClick={() => setSeats(s => Math.min(maxSeats, s + 1))} aria-label="Increase">+</button>
            </div>
            <p className="seat-hint">{maxSeats} tickets available · max 10 per booking</p>
          </div>

          <div className="booking-price-breakdown">
            <div className="price-row">
              <span>Price per ticket ({selectedTier})</span>
              <span>₹{activePrice === 0 ? 'Free' : activePrice.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>Seats selected {selectedSeats.length > 0 ? `(${selectedSeats.join(', ')})` : ''}</span>
              <span>× {selectedSeats.length > 0 ? selectedSeats.length : seats}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>{activePrice === 0 ? 'Free' : `₹${total.toLocaleString()}`}</span>
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="auth-submit" onClick={handleStartCheckout} disabled={submitting || maxSeats === 0}>
            Proceed to Checkout <span>→</span>
          </button>
          <p className="booking-note">256-Bit Encrypted Secure Checkout.</p>

          {showPayment && (
            <PaymentGatewayModal
              amount={total}
              onPaymentSuccess={confirmBooking}
              onClose={() => setShowPayment(false)}
            />
          )}
        </div>
      </div>
    </main>
  )
}
