import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { eventApi, authApi, userApi } from '../lib/api'

const CATEGORIES = ['Music', 'Technology', 'Workshop', 'Sports', 'Arts', 'Food', 'Business', 'Other']
const blank = { title: '', description: '', category: 'Music', date: '', time: '', venue: '', city: '', ticketsTotal: '', price: '' }

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState('events') // 'events' | 'users' | 'add' | 'settings'
  const [bannerFile, setBannerFile] = useState(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const fileRef = useRef()

  const loadEvents = () => {
    setLoading(true)
    eventApi.list({}).then(({ events }) => setEvents(events)).catch(() => {}).finally(() => setLoading(false))
  }

  const loadUsers = () => {
    setUsersLoading(true)
    userApi.list().then(({ users }) => setUsers(users)).catch((err) => flash(err.message, true)).finally(() => setUsersLoading(false))
  }

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (tab === 'users') loadUsers()
  }, [tab])

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
      flash(editing ? 'Event updated successfully!' : 'Event created & published live!')
      resetForm()
      loadEvents()
      setTab('events')
    } catch (err) { flash(err.message, true) }
    finally { setSaving(false) }
  }

  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try { await eventApi.delete(id); flash('Event deleted.'); loadEvents() }
    catch (err) { flash(err.message, true) }
  }

  const togglePublish = async (id) => {
    try { const { event } = await eventApi.togglePublish(id); setEvents(ev => ev.map(e => e._id === id ? event : e)); flash(`Event is now ${event.isPublished ? 'Live' : 'Draft'}.`) }
    catch (err) { flash(err.message, true) }
  }

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove user "${name}" from the platform? This will also remove their created events and bookings.`)) return
    try {
      const res = await userApi.delete(userId)
      flash(res.message)
      loadUsers()
    } catch (err) { flash(err.message, true) }
  }

  const handleRoleChange = async (userId, newRole, name) => {
    try {
      const res = await userApi.updateRole(userId, newRole)
      flash(res.message)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
    } catch (err) { flash(err.message, true) }
  }

  const makeAdmin = async (e) => {
    e.preventDefault()
    try { const res = await authApi.makeAdmin(adminEmail); flash(res.message); setAdminEmail(''); loadUsers() }
    catch (err) { flash(err.message, true) }
  }

  const exit = () => { logout(); navigate('/') }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <nav className="admin-nav">
          <button className={tab === 'events' ? 'active' : ''} onClick={() => { setTab('events'); resetForm() }}>
            <span>📋</span> Manage Events
          </button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
            <span>👥</span> Manage Users ({users.length || '...'})
          </button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => { setTab('add'); resetForm() }}>
            <span>➕</span> {editing ? 'Edit Event' : 'Create Event'}
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
            <span>⚙</span> Admin Settings
          </button>
          <button onClick={() => navigate('/admin/reports')}>
            <span>📄</span> Reports & Exports
          </button>
          <button onClick={() => navigate('/dashboard')}>
            <span>📊</span> Dashboard
          </button>
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-badge">Super Admin</span>
          <span className="admin-name">{user.name}</span>
          <button className="logout-link" onClick={exit}>Log out</button>
        </div>
      </aside>

      <div className="admin-content">
        {(error || success) && (
          <div className={`admin-toast ${error ? 'error' : 'success'}`}>{error || success}</div>
        )}

        {/* Manage Events Tab */}
        {tab === 'events' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h1>All Platform Events ({events.length})</h1>
              <button className="primary-button" onClick={() => { resetForm(); setTab('add') }}>+ Create Event</button>
            </div>

            {loading ? <p className="admin-loading">Loading events…</p> : (
              <div className="admin-event-list">
                {events.map(event => (
                  <div className="admin-event-row" key={event._id}>
                    <div className="admin-event-row-info">
                      {event.bannerUrl && <img className="admin-event-thumb" src={`http://localhost:5001${event.bannerUrl}`} alt="" />}
                      <div>
                        <strong>{event.title}</strong>
                        <span>{event.city} · {new Date(event.date).toLocaleDateString('en-IN')} · {event.time}</span>
                        <span>₹{event.price} · {event.ticketsAvailable}/{event.ticketsTotal} seats left</span>
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manage Users Tab */}
        {tab === 'users' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <div>
                <h1>User Management</h1>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                  View, edit roles, or remove accounts from the platform.
                </p>
              </div>
              <input
                type="text"
                placeholder="Search users by name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--line)', width: 260, fontSize: 13 }}
              />
            </div>

            {usersLoading ? <p className="admin-loading">Loading platform users…</p> : (
              <table className="analytics-table" style={{ width: '100%', marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Bookings</th>
                    <th>Events</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <strong>{u.name}</strong>
                        {String(u._id) === String(user._id) && <small style={{ marginLeft: 6, color: '#745ec5' }}>(You)</small>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          disabled={String(u._id) === String(user._id)}
                          onChange={(e) => handleRoleChange(u._id, e.target.value, u.name)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, fontWeight: 600 }}
                        >
                          <option value="user">Attendee</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{u.bookingCount}</td>
                      <td>{u.eventCount}</td>
                      <td>
                        {String(u._id) !== String(user._id) && (
                          <button
                            className="icon-btn delete-btn"
                            title="Remove User"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                          >
                            🗑 Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
                        No users matching "{userSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create/Edit Tab */}
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
                <label>Price per Ticket (₹)
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
              <button className="auth-submit" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Event' : 'Create & Publish Event'} <span>→</span>
              </button>
            </form>
          </div>
        )}

        {/* Admin Settings Tab */}
        {tab === 'settings' && (
          <div className="admin-section">
            <h1>Admin Controls</h1>
            <div className="admin-card" style={{ marginTop: 20 }}>
              <h2>Promote User to Admin</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: '8px 0 16px' }}>
                Enter the email address of any registered user to grant them Super Admin privileges.
              </p>
              <form onSubmit={makeAdmin} className="admin-form-inline">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
                <button className="primary-button" type="submit">Promote to Admin</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
