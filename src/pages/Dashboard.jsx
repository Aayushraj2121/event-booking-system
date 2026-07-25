import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { bookingApi, dashboardApi, userApi } from '../lib/api'

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
      </div>
    </div>
  )
}

function MiniBarChart({ data, max }) {
  return (
    <div className="mini-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-group">
          <div className="bar-fill" style={{ height: `${max ? (item.count / max) * 100 : 0}%` }}></div>
          <span className="bar-label">{item.title?.split(' ')[0]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const isOrganizer = user?.role === 'organizer'
  const [bookings, setBookings] = useState([])
  const [favoritesList, setFavoritesList] = useState([])
  const [stats, setStats] = useState(null)
  const [orgStats, setOrgStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const fetchers = [bookingApi.my(), userApi.getFavorites()]
    if (isAdmin) fetchers.push(dashboardApi.stats())
    if (isOrganizer) fetchers.push(dashboardApi.organizerStats())

    Promise.all(fetchers)
      .then(([{ bookings }, { favorites }, secondResult]) => {
        setBookings(bookings)
        setFavoritesList(favorites || [])
        if (isAdmin && secondResult) setStats(secondResult)
        if (isOrganizer && secondResult) setOrgStats(secondResult)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAdmin, isOrganizer])

  const exit = () => { logout(); navigate('/') }

  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) >= new Date())
  const past = bookings.filter(b => b.status === 'confirmed' && new Date(b.event?.date) < new Date())
  const cancelled = bookings.filter(b => b.status === 'cancelled')

  const maxCount = stats?.topEvents ? Math.max(...stats.topEvents.map(e => e.count), 1) : 1

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const cancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    try {
      await bookingApi.cancel(id)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
    } catch (err) { alert(err.message) }
  }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <nav className="dashboard-nav">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            <span>🏠</span> Overview
          </button>
          {!isOrganizer && (
            <>
              <button className={tab === 'bookings' ? 'active' : ''} onClick={() => setTab('bookings')}>
                <span>🎟</span> My Bookings
              </button>
              <button className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}>
                <span>💖</span> Saved Events
              </button>
            </>
          )}
          {isOrganizer && (
            <button className={tab === 'myevents' ? 'active' : ''} onClick={() => setTab('myevents')}>
              <span>📋</span> My Events
            </button>
          )}
          {(isAdmin || isOrganizer) && (
            <button className={tab === 'analytics' ? 'active' : ''} onClick={() => setTab('analytics')}>
              <span>📊</span> Analytics
            </button>
          )}
          {isAdmin && <>
            <button className={tab === 'reports' ? 'active' : ''} onClick={() => navigate('/admin/reports')}>
              <span>📄</span> Reports
            </button>
            <button onClick={() => navigate('/admin')}>
              <span>⚙</span> Admin Panel
            </button>
          </>}
          {isOrganizer && (
            <button onClick={() => navigate('/organizer')}>
              <span>🎪</span> Manage Events
            </button>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          {isAdmin && <span className="admin-badge">Admin</span>}
          {isOrganizer && <span className="organizer-badge">Organizer</span>}
          <span className="admin-name">{user.name}</span>
          <button className="logout-link" onClick={exit}>Log out</button>
        </div>
      </aside>

      <div className="dashboard-main">
        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            {/* Overview tab */}
            {tab === 'overview' && (
              <div className="dash-section">
                <p className="eyebrow"><span></span> {isAdmin ? 'ADMIN OVERVIEW' : isOrganizer ? 'ORGANIZER SPACE' : 'YOUR EVENTLY SPACE'}</p>
                <h1>Welcome, <em>{user.name.split(' ')[0]}.</em></h1>

                {/* Organizer stat cards */}
                {isOrganizer && orgStats && (
                  <div className="stat-grid">
                    <StatCard label="Total Bookings" value={orgStats.totalBookings} icon="🎟" color="lime" />
                    <StatCard label="Total Earned" value={`₹${(orgStats.totalRevenue || 0).toLocaleString()}`} icon="💰" color="blue" />
                    <StatCard label="Seats Left" value={orgStats.eventStats.reduce((s, e) => s + e.available, 0)} icon="🪑" color="teal" />
                    <StatCard label="My Events" value={orgStats.totalEvents} icon="🎪" color="purple" />
                  </div>
                )}

                {/* Regular user stat cards */}
                {!isOrganizer && (
                  <div className="stat-grid">
                    <StatCard label="Upcoming Events" value={isAdmin ? (stats?.upcomingCount || 0) : upcoming.length} icon="🗓" color="purple" />
                    <StatCard label="Total Bookings" value={bookings.filter(b=>b.status==='confirmed').length} icon="🎟" color="lime" />
                    <StatCard label="Total Spent" value={`₹${bookings.filter(b=>b.status==='confirmed').reduce((s,b)=>s+b.totalPrice,0).toLocaleString()}`} icon="💰" color="blue" />
                    {isAdmin && <StatCard label="Platform Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon="📈" color="orange" />}
                  </div>
                )}

                {isAdmin && (
                  <div className="stat-grid" style={{ marginTop: '1rem' }}>
                    <StatCard label="Total Events" value={stats?.totalEvents || 0} icon="🎪" color="green" />
                    <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👥" color="pink" />
                    <StatCard label="Total Bookings" value={stats?.totalBookings || 0} icon="📋" color="teal" />
                  </div>
                )}



                {/* Organizer: CTA to manage events */}
                {isOrganizer && orgStats && orgStats.totalEvents === 0 && (
                  <div className="dash-card dash-empty">
                    <p>You haven't created any events yet.</p>
                    <button className="primary-button" onClick={() => navigate('/organizer')}>Create your first event <span>→</span></button>
                  </div>
                )}

                {/* Organizer: recent event activity */}
                {isOrganizer && orgStats && orgStats.recentBookings?.length > 0 && (
                  <div className="dash-card">
                    <h2>Recent Bookings on My Events</h2>
                    <div className="activity-list">
                      {orgStats.recentBookings.slice(0, 6).map(b => (
                        <div className="activity-item" key={b._id}>
                          <div className="activity-avatar">{b.user?.name?.[0] || '?'}</div>
                          <div className="activity-info">
                            <strong>{b.user?.name}</strong>
                            <span>booked {b.seats} seat{b.seats > 1 ? 's' : ''} for <em>{b.event?.title}</em></span>
                          </div>
                          <span className="activity-time">₹{b.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User: upcoming bookings */}
                {!isOrganizer && upcoming.length > 0 && (
                  <div className="dash-card">
                    <h2>Upcoming Events</h2>
                    <div className="booking-list">
                      {upcoming.slice(0, 3).map(b => (
                        <div className="booking-item" key={b._id}>
                          <div className="booking-item-date">
                            <strong>{new Date(b.event?.date).getDate()}</strong>
                            <span>{new Date(b.event?.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                          </div>
                          <div className="booking-item-info">
                            <strong>{b.event?.title}</strong>
                            <span>{b.event?.city} · {b.event?.time} · {b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                          </div>
                          <Link to={`/booking/${b._id}/confirmation`} className="booking-item-link">View →</Link>
                        </div>
                      ))}
                    </div>
                    {upcoming.length > 3 && <button className="text-btn-sm" onClick={() => setTab('bookings')}>View all {upcoming.length} →</button>}
                  </div>
                )}

                {!isOrganizer && upcoming.length === 0 && (
                  <div className="dash-card dash-empty">
                    <p>No upcoming bookings yet.</p>
                    <Link to="/" className="primary-button">Browse Events <span>→</span></Link>
                  </div>
                )}

                {/* Admin: recent bookings feed */}
                {isAdmin && stats?.recentBookings?.length > 0 && (

                  <div className="dash-card">
                    <h2>Recent Platform Activity</h2>
                    <div className="activity-list">
                      {stats.recentBookings.slice(0, 8).map(b => (
                        <div className="activity-item" key={b._id}>
                          <div className="activity-avatar">{b.user?.name?.[0] || '?'}</div>
                          <div className="activity-info">
                            <strong>{b.user?.name}</strong>
                            <span>booked {b.seats} seat{b.seats > 1 ? 's' : ''} for <em>{b.event?.title}</em></span>
                          </div>
                          <span className="activity-time">{formatDate(b.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bookings tab */}
            {tab === 'bookings' && (
              <div className="dash-section">
                <h1>My Bookings</h1>
                {bookings.length === 0 ? (
                  <div className="dash-card dash-empty">
                    <p>You haven't booked any events yet.</p>
                    <Link to="/" className="primary-button">Explore Events <span>→</span></Link>
                  </div>
                ) : (
                  <>
                    {upcoming.length > 0 && <>
                      <h2 className="section-label">Upcoming</h2>
                      <div className="booking-list full">
                        {upcoming.map(b => (
                          <div className="booking-item booking-item-full" key={b._id}>
                            {b.event?.bannerUrl && <img className="booking-item-banner" src={`http://localhost:5001${b.event.bannerUrl}`} alt="" />}
                            <div className="booking-item-date">
                              <strong>{new Date(b.event?.date).getDate()}</strong>
                              <span>{new Date(b.event?.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                            </div>
                            <div className="booking-item-info">
                              <strong>{b.event?.title}</strong>
                              <span>{b.event?.venue}, {b.event?.city}</span>
                              <span>{b.seats} seat{b.seats > 1 ? 's' : ''} · ₹{b.totalPrice.toLocaleString()}</span>
                              <span className="booking-ref">Ref: {b.bookingRef}</span>
                            </div>
                            <div className="booking-item-actions">
                              <Link to={`/booking/${b._id}/confirmation`} className="icon-btn">🎟</Link>
                              <button className="icon-btn delete-btn" onClick={() => cancelBooking(b._id)}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>}
                    {past.length > 0 && <>
                      <h2 className="section-label">Past Events</h2>
                      <div className="booking-list full past">
                        {past.map(b => (
                          <div className="booking-item booking-item-full dimmed" key={b._id}>
                            <div className="booking-item-date">
                              <strong>{new Date(b.event?.date).getDate()}</strong>
                              <span>{new Date(b.event?.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                            </div>
                            <div className="booking-item-info">
                              <strong>{b.event?.title}</strong>
                              <span>{b.event?.city} · {b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                            </div>
                            <Link to={`/booking/${b._id}/confirmation`} className="icon-btn">🎟</Link>
                          </div>
                        ))}
                      </div>
                    </>}
                    {cancelled.length > 0 && <>
                      <h2 className="section-label">Cancelled</h2>
                      <div className="booking-list full">
                        {cancelled.map(b => (
                          <div className="booking-item booking-item-full cancelled-item" key={b._id}>
                            <div className="booking-item-date"><strong>—</strong></div>
                            <div className="booking-item-info">
                              <strong>{b.event?.title}</strong>
                              <span className="cancelled-badge">Cancelled</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>}
                  </>
                )}
              </div>
            )}

            {/* Analytics tab (admin + organizer) */}
            {tab === 'analytics' && (isAdmin || isOrganizer) && (
              <div className="dash-section">
                <h1>Analytics</h1>

                {isAdmin && (
                  <>
                    <div className="stat-grid">
                      <StatCard label="Total Events" value={stats?.totalEvents || 0} icon="🎪" color="purple" />
                      <StatCard label="Total Users" value={stats?.totalUsers || 0} icon="👥" color="lime" />
                      <StatCard label="Confirmed Bookings" value={stats?.totalBookings || 0} icon="🎟" color="blue" />
                      <StatCard label="Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon="📈" color="orange" />
                    </div>
                    {stats?.topEvents?.length > 0 && (
                      <div className="dash-card">
                        <h2>Top Events by Tickets Sold</h2>
                        <MiniBarChart data={stats.topEvents} max={Math.max(...stats.topEvents.map(e => e.count), 1)} />
                        <table className="analytics-table">
                          <thead><tr><th>Event</th><th>Tickets Sold</th><th>Revenue</th></tr></thead>
                          <tbody>{stats.topEvents.map((e, i) => (
                            <tr key={i}><td>{e.title}</td><td>{e.count}</td><td>₹{e.revenue.toLocaleString()}</td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {isOrganizer && orgStats && (
                  <>
                    <div className="stat-grid">
                      <StatCard label="My Events" value={orgStats.totalEvents} icon="🎪" color="purple" />
                      <StatCard label="Tickets Sold" value={orgStats.totalBookings} icon="🎟" color="lime" />
                      <StatCard label="Total Revenue" value={`₹${(orgStats.totalRevenue || 0).toLocaleString()}`} icon="📈" color="orange" />
                    </div>
                    {orgStats.eventStats?.length > 0 && (
                      <div className="dash-card">
                        <h2>My Events — Performance</h2>
                        <table className="analytics-table">
                          <thead><tr><th>Event</th><th>Tickets Sold</th><th>Available</th><th>Fill %</th><th>Revenue</th><th>Status</th></tr></thead>
                          <tbody>{orgStats.eventStats.map((e, i) => {
                            const fill = e.total ? Math.round((e.count / e.total) * 100) : 0
                            return (
                              <tr key={i}>
                                <td><strong>{e.title}</strong></td>
                                <td>{e.count}</td>
                                <td>{e.available}</td>
                                <td>
                                  <div className="fill-bar">
                                    <div className="fill-inner organizer-fill" style={{ width: `${fill}%` }}></div>
                                    <span>{fill}%</span>
                                  </div>
                                </td>
                                <td>₹{e.revenue.toLocaleString()}</td>
                                <td><span className={`status-badge ${e.isPublished ? 'confirmed' : 'cancelled'}`}>{e.isPublished ? 'Live' : 'Draft'}</span></td>
                              </tr>
                            )
                          })}</tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* My Events tab (organizer) */}
            {tab === 'myevents' && isOrganizer && (
              <div className="dash-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h1>My Events</h1>
                  <button className="primary-button" onClick={() => navigate('/organizer')}>+ Create Event</button>
                </div>
                {orgStats?.eventStats?.length === 0 && (
                  <div className="dash-card dash-empty">
                    <p>No events yet.</p>
                    <button className="primary-button" onClick={() => navigate('/organizer')}>Create your first event <span>→</span></button>
                  </div>
                )}
                {orgStats?.eventStats?.length > 0 && (
                  <div className="admin-event-list">
                    {orgStats.eventStats.map((e, i) => (
                      <div className="admin-event-row" key={i}>
                        <div className="admin-event-row-info">
                          <div>
                            <strong>{e.title}</strong>
                            <span>{e.count}/{e.total} tickets sold</span>
                          </div>
                        </div>
                        <div className="admin-event-row-actions">
                          <span className={`publish-btn ${e.isPublished ? 'published' : ''}`}>{e.isPublished ? '● Live' : '○ Draft'}</span>
                          <button className="icon-btn edit-btn" onClick={() => navigate('/organizer')}>✏</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Saved Events (Wishlist) tab */}
            {tab === 'favorites' && !isOrganizer && (
              <div className="dash-section">
                <h1>Saved Events 💖</h1>
                {favoritesList.length === 0 ? (
                  <div className="dash-card dash-empty">
                    <p>Your wishlist is empty. Explore events and click the 💖 heart icon to save them!</p>
                    <Link to="/" className="primary-button">Browse Events <span>→</span></Link>
                  </div>
                ) : (
                  <div className="booking-list full">
                    {favoritesList.map(ev => (
                      <div className="booking-item booking-item-full" key={ev._id}>
                        {ev.bannerUrl && <img className="booking-item-banner" src={`http://localhost:5001${ev.bannerUrl}`} alt="" />}
                        <div className="booking-item-date">
                          <strong>{new Date(ev.date).getDate()}</strong>
                          <span>{new Date(ev.date).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                        </div>
                        <div className="booking-item-info">
                          <strong>{ev.title}</strong>
                          <span>{ev.city} · {ev.venue} · ₹{ev.price?.toLocaleString()}</span>
                        </div>
                        <div className="booking-item-actions">
                          <Link to={`/events/${ev._id}`} className="primary-button" style={{ padding: '8px 16px', fontSize: 13 }}>View & Book →</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

