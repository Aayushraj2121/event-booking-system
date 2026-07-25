import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { eventApi, userApi } from '../lib/api'
import { showNotification } from '../components/NotificationToast'

const CATEGORIES = ['All', 'Music', 'Technology', 'Workshop', 'Sports', 'Arts', 'Food', 'Business', 'Other']
const Arrow = ({ diagonal = false }) => <span className={`arrow ${diagonal ? 'diagonal' : ''}`} aria-hidden="true">→</span>

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { document.documentElement.dataset.theme = isDark ? 'dark' : 'light' }, [isDark])

  useEffect(() => {
    if (user) {
      userApi.getFavorites().then(({ favorites }) => setFavorites(favorites.map(f => f._id || f))).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (category !== 'All') params.category = category
    if (search) params.search = search
    eventApi.list(params)
      .then(({ events }) => setEvents(events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [category, search])

  const toggleFavorite = async (e, eventId) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try {
      const res = await userApi.toggleFavorite(eventId)
      setFavorites(res.favorites)
      showNotification(res.isFavorite ? 'Saved to your Wishlist! 💖' : 'Removed from Wishlist', 'info')
    } catch (err) { showNotification(err.message, 'error') }
  }

  const scrollTo = (id) => { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false) }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return { day: d.getDate().toString().padStart(2, '0'), month: d.toLocaleString('en', { month: 'short' }).toUpperCase() }
  }

  return (
    <main>
      <header className="site-header">
        <button className="brand" onClick={() => scrollTo('#top')} aria-label="Go to home">
          <span className="brand-mark"><i></i><i></i><i></i></span><span>Evently</span>
        </button>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <button onClick={() => scrollTo('#discover')}>Discover</button>
          <button onClick={() => scrollTo('#experience')}>Experience</button>
          <button onClick={() => scrollTo('#about')}>About us</button>
        </nav>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setIsDark(!isDark)} aria-label="Toggle colour theme">
            <span>{isDark ? '☀' : '☾'}</span>
          </button>
          {user ? <>
            <button className="profile-button" onClick={() => navigate('/dashboard')}>{user.name.split(' ')[0]}</button>
            <button className="logout-link" onClick={logout}>Log out</button>
          </> : <button className="login-button" onClick={() => navigate('/login')}>Log in</button>}
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <span></span><span></span>
          </button>
        </div>
      </header>

      <section className="hero-section" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span></span> YOUR NEXT STORY STARTS HERE</p>
          <h1>Find the moments<br /><em>that move you.</em></h1>
          <p className="hero-description">From golden-hour concerts to ideas that spark change—discover experiences worth showing up for.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => scrollTo('#discover')}>Explore events <Arrow /></button>
            <button className="text-button" onClick={() => scrollTo('#experience')}>How it works <span className="play-icon">▶</span></button>
          </div>
          <div className="social-proof">
            <div className="avatars">
              <span className="avatar a1">M</span><span className="avatar a2">K</span>
              <span className="avatar a3">R</span><span className="avatar a4">S</span>
            </div>
            <p><strong>12k+</strong> people are finding<br />their next favourite thing</p>
          </div>
        </div>
        <div className="hero-visual" aria-label="Abstract 3D event ticket artwork">
          <div className="visual-glow"></div><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
          <div className="sphere sphere-lime"></div><div className="sphere sphere-purple"></div>
          <div className="spark spark-one">✦</div><div className="spark spark-two">✦</div>
          <div className="floating-ticket ticket-top"><span>LIVE / 2026</span><b>THE<br />NIGHT<br />IS YOURS</b><small>18.08 · 8PM</small></div>
          <div className="floating-ticket ticket-bottom"><span>EVENTLY PRESENTS</span><b>CREATE<br />YOUR<br />MOMENT</b><small>FEEL IT ALL</small></div>
          <div className="ticket-stub">ADMIT ONE <span>● ● ●</span></div>
        </div>
        <button className="scroll-cue" onClick={() => scrollTo('#discover')} aria-label="Scroll to featured events">
          <span>SCROLL TO EXPLORE</span><i></i>
        </button>
      </section>

      <section className="events-section" id="discover">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span></span> HANDPICKED FOR YOU</p>
            <h2>Something good is<br /><em>always happening.</em></h2>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="category-pills">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`pill ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              className="search-input" type="search" placeholder="Search events…"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="events-loading">
            {[1, 2, 3].map(i => <div key={i} className="event-card skeleton"></div>)}
          </div>
        ) : events.length === 0 ? (
          <div className="events-empty">
            <p>No events found. {user?.role === 'admin' && <Link to="/admin">Create one →</Link>}</p>
          </div>
        ) : (
          <div className="event-grid">
            {events.map((event) => {
              const { day, month } = formatDate(event.date)
              return (
                <article className="event-card" key={event._id}>
                  <div className={`event-art ${event.category?.toLowerCase()}`} style={event.bannerUrl ? { backgroundImage: `url(http://localhost:5001${event.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    <span className="event-date"><b>{day}</b>{month}</span>
                    <span className="event-type">{event.category}</span>
                    <button
                      type="button"
                      className="heart-button"
                      onClick={(e) => toggleFavorite(e, event._id)}
                      title={favorites.includes(event._id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                      style={{ position: 'absolute', top: 14, right: 14, zIndex: 5, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}
                    >
                      {favorites.includes(event._id) ? '💖' : '🤍'}
                    </button>
                    <div className="art-shape"></div>
                    <button className="round-arrow" onClick={() => navigate(`/events/${event._id}`)} aria-label={`View ${event.title}`}>
                      <Arrow diagonal />
                    </button>
                  </div>
                  <div className="event-info">
                    <div>
                      <h3>{event.title}</h3>
                      <p>{event.city} <i></i> {event.time}</p>
                    </div>
                    <div className="event-price">₹{event.price === 0 ? 'Free' : event.price.toLocaleString()}</div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="experience-section" id="experience">
        <div className="experience-number">01<span>/ 03</span></div>
        <div>
          <p className="eyebrow"><span></span> BUILT FOR THE MOMENT</p>
          <h2>Less searching.<br /><em>More showing up.</em></h2>
        </div>
        <p>Save your favourites, book in a few taps, and keep every plan in one beautiful place.</p>
      </section>

      <footer id="about">
        <span className="brand"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</span>
        <p>Discover more of what makes life feel alive.</p>
        <span>Modules 1–5 Complete</span>
      </footer>
    </main>
  )
}
