import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { eventApi, bookingApi } from '../lib/api'
import CameraQrScanner from '../components/CameraQrScanner'

const CATEGORIES = ['Music', 'Technology', 'Workshop', 'Sports', 'Arts', 'Food', 'Business', 'Other']
const blank = { title: '', description: '', category: 'Music', date: '', time: '', venue: '', city: '', ticketsTotal: '', price: '' }

export default function OrganizerPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('events')
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [scanRef, setScanRef] = useState('')
  const [scannedBooking, setScannedBooking] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const fileRef = useRef()

  const loadEvents = () => {
    setLoading(true)
    eventApi.myEvents().then(({ events }) => setEvents(events)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadEvents() }, [])

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleBanner = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setSuccess('') } else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 3500)
  }

  const startEdit = (event) => {
    setEditing(event._id)
    setForm({
      title: event.title, description: event.description, category: event.category,
      date: event.date?.slice(0, 10), time: event.time, venue: event.venue, city: event.city,
      ticketsTotal: event.ticketsTotal, price: event.price,
    })
    setBannerPreview(event.bannerUrl ? `http://localhost:5001${event.bannerUrl}` : '')
    setBannerFile(null)
    setTab('add')
  }

  const resetForm = () => { setForm(blank); setEditing(null); setBannerFile(null); setBannerPreview('') }

  const submitEvent = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let saved
      if (editing) {
        const { event } = await eventApi.update(editing, form)
        saved = event
      } else {
        const { event } = await eventApi.create(form)
        saved = event
      }
      if (bannerFile) await eventApi.uploadBanner(saved._id, bannerFile)
      flash(editing ? 'Event updated!' : 'Event created!')
      resetForm()
      loadEvents()
      setTab('events')
    } catch (err) { flash(err.message, true) }
    finally { setSaving(false) }
  }

  const deleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return
    try { await eventApi.delete(id); flash('Event deleted.'); loadEvents() }
    catch (err) { flash(err.message, true) }
  }

  const togglePublish = async (id) => {
    try { const { event } = await eventApi.togglePublish(id); setEvents(ev => ev.map(e => e._id === id ? event : e)) }
    catch (err) { flash(err.message, true) }
  }

  const handleVerifyTicket = async (e) => {
    e?.preventDefault()
    if (!scanRef.trim()) return
    setScanning(true)
    try {
      const { booking } = await bookingApi.verify(scanRef.trim())
      setScannedBooking(booking)
      setError('')
    } catch (err) {
      flash(err.message, true)
      setScannedBooking(null)
    } finally { setScanning(false) }
  }

  const handleCheckInTicket = async () => {
    if (!scanRef.trim()) return
    setScanning(true)
    try {
      const res = await bookingApi.checkIn(scanRef.trim())
      flash(res.message)
      setScannedBooking(prev => ({ ...prev, checkedIn: true, checkedInAt: new Date() }))
    } catch (err) { flash(err.message, true) }
    finally { setScanning(false) }
  }

  const exit = () => { logout(); navigate('/') }

  const totalRevenue = events.reduce((s, e) => s + (e.price * (e.ticketsTotal - e.ticketsAvailable)), 0)
  const ticketsSold = events.reduce((s, e) => s + (e.ticketsTotal - e.ticketsAvailable), 0)

  return (
    <main className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar organizer-sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <nav className="admin-nav">
          <button className={tab === 'events' ? 'active' : ''} onClick={() => { setTab('events'); resetForm() }}>
            <span>📋</span> My Events
          </button>
          <button className={tab === 'scanner' ? 'active' : ''} onClick={() => { setTab('scanner'); setScanRef(''); setScannedBooking(null) }}>
            <span>🎟</span> Ticket Scanner
          </button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => { setTab('add'); resetForm() }}>
            <span>➕</span> {editing ? 'Edit Event' : 'Create Event'}
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <span>📊</span> Dashboard
          </button>
        </nav>

        {/* Quick stats in sidebar */}
        <div className="organizer-sidebar-stats">
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">MY EVENTS</span>
            <strong>{events.length}</strong>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">TICKETS SOLD</span>
            <strong>{ticketsSold}</strong>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">REVENUE</span>
            <strong>₹{totalRevenue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="admin-sidebar-footer">
          <span className="organizer-badge">Organizer</span>
          <span className="admin-name">{user.name}</span>
          <button className="logout-link" onClick={exit}>Log out</button>
        </div>
      </aside>

      {/* Main content */}
      <div className="admin-content">
        {(error || success) && (
          <div className={`admin-toast ${error ? 'error' : 'success'}`}>{error || success}</div>
        )}

        {/* My Events tab */}
        {tab === 'events' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h1>My Events</h1>
                <p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>Events you've created on Evently</p>
              </div>
              <button className="primary-button" onClick={() => { resetForm(); setTab('add') }}>+ Create Event</button>
            </div>

            {loading ? <p className="admin-loading">Loading your events…</p> : (
              <>
                {events.length === 0 ? (
                  <div className="organizer-empty">
                    <div className="organizer-empty-icon">🎪</div>
                    <h2>No events yet</h2>
                    <p>Create your first event and start selling tickets.</p>
                    <button className="primary-button" onClick={() => setTab('add')}>Create your first event <span>→</span></button>
                  </div>
                ) : (
                  <div className="admin-event-list">
                    {events.map(event => {
                      const sold = event.ticketsTotal - event.ticketsAvailable
                      const fillPct = event.ticketsTotal ? Math.round((sold / event.ticketsTotal) * 100) : 0
                      return (
                        <div className="admin-event-row organizer-event-row" key={event._id}>
                          <div className="admin-event-row-info">
                            {event.bannerUrl && <img className="admin-event-thumb" src={`http://localhost:5001${event.bannerUrl}`} alt="" />}
                            <div>
                              <strong>{event.title}</strong>
                              <span>{event.city} · {new Date(event.date).toLocaleDateString('en-IN')} · {event.time}</span>
                              <span>₹{event.price} · {sold}/{event.ticketsTotal} tickets sold ({fillPct}%)</span>
                              <div className="fill-bar" style={{ marginTop: 4, maxWidth: 180 }}>
                                <div className="fill-inner organizer-fill" style={{ width: `${fillPct}%` }}></div>
                              </div>
                            </div>
                          </div>
                          <div className="admin-event-row-actions">
                            <button className={`publish-btn ${event.isPublished ? 'published' : ''}`} onClick={() => togglePublish(event._id)}>
                              {event.isPublished ? '● Live' : '○ Draft'}
                            </button>
                            <button className="icon-btn edit-btn" onClick={() => startEdit(event)}>✏</button>
                            <button className="icon-btn delete-btn" onClick={() => deleteEvent(event._id)}>🗑</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Create / Edit tab */}
        {tab === 'add' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h1>{editing ? 'Edit Event' : 'Create Event'}</h1>
              {editing && <button className="outline-button" onClick={() => { resetForm(); setTab('events') }}>Cancel</button>}
            </div>
            <form className="admin-form" onSubmit={submitEvent} noValidate>
              <div className="admin-form-grid">
                <label className="full-width">Event Title
                  <input name="title" value={form.title} onChange={update} placeholder="e.g. Tech Summit 2026" required />
                </label>
                <label className="full-width">Description
                  <textarea name="description" value={form.description} onChange={update} rows={4} placeholder="Tell attendees what to expect…" required />
                </label>
                <label>Category
                  <select name="category" value={form.category} onChange={update}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label>Date
                  <input type="date" name="date" value={form.date} onChange={update} required />
                </label>
                <label>Time
                  <input name="time" value={form.time} onChange={update} placeholder="e.g. 07:00 PM" required />
                </label>
                <label>Venue
                  <input name="venue" value={form.venue} onChange={update} placeholder="e.g. Phoenix Marketcity" required />
                </label>
                <label>City
                  <input name="city" value={form.city} onChange={update} placeholder="e.g. Bengaluru" required />
                </label>
                <label>Total Tickets
                  <input type="number" name="ticketsTotal" value={form.ticketsTotal} onChange={update} min="1" required />
                </label>
                <label>Price per Ticket (₹) <small style={{ fontWeight: 400, color: 'var(--muted)' }}>— Enter 0 for free</small>
                  <input type="number" name="price" value={form.price} onChange={update} min="0" placeholder="0" required />
                </label>
                <label className="full-width">Banner Image
                  <div className="banner-upload" onClick={() => fileRef.current?.click()}>
                    {bannerPreview ? <img src={bannerPreview} alt="Preview" /> : <span>Click to upload event banner (max 5MB)</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleBanner} style={{ display: 'none' }} />
                </label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="auth-submit organizer-submit" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Event' : 'Create Event'} <span>→</span>
              </button>
            </form>
          </div>
        )}
        {/* Ticket Scanner tab */}
        {tab === 'scanner' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h1>Venue Ticket Scanner & Check-in</h1>
            </div>
            <div className="admin-card" style={{ maxWidth: 540 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Enter or scan an attendee's 8-character <strong>Booking Reference</strong> (e.g. <code>GSPGQKIQ</code>) to check them in at the venue.
              </p>
              <form onSubmit={handleVerifyTicket} className="admin-form-inline" style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Enter Booking Ref (8 chars)"
                  value={scanRef}
                  onChange={(e) => setScanRef(e.target.value.toUpperCase())}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)', font: '14px "DM Mono", monospace' }}
                  required
                />
                <button className="primary-button" type="submit" disabled={scanning}>
                  {scanning ? 'Searching…' : 'Verify Ticket'}
                </button>
                <button type="button" className="outline-button" onClick={() => setShowCamera(true)}>
                  📸 Scan Camera
                </button>
              </form>

              {showCamera && (
                <CameraQrScanner
                  onScanResult={(ref) => {
                    setScanRef(ref)
                    bookingApi.verify(ref).then(({ booking }) => setScannedBooking(booking)).catch(err => showNotification(err.message, 'error'))
                  }}
                  onClose={() => setShowCamera(false)}
                />
              )}

              {scannedBooking && (
                <div style={{ marginTop: 24, padding: 18, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--paper)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>{scannedBooking.event?.title}</h3>
                      <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 12px' }}>
                        Guest: <strong>{scannedBooking.user?.name}</strong> ({scannedBooking.user?.email})
                      </p>
                      <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                        <span>Seats: <strong>{scannedBooking.seats}</strong></span>
                        <span>Venue: <strong>{scannedBooking.event?.venue}</strong></span>
                      </div>
                    </div>
                    <span className={`status-badge ${scannedBooking.checkedIn ? 'confirmed' : ''}`}>
                      {scannedBooking.checkedIn ? 'Checked-In ✅' : 'Valid Ticket 🎟'}
                    </span>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px dashed var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {scannedBooking.checkedIn
                        ? `Checked in at ${new Date(scannedBooking.checkedInAt).toLocaleTimeString('en-IN')}`
                        : 'Ready for check-in'}
                    </span>
                    {!scannedBooking.checkedIn && (
                      <button className="primary-button" onClick={handleCheckInTicket} disabled={scanning}>
                        {scanning ? 'Checking in…' : '✓ Complete Check-In'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
