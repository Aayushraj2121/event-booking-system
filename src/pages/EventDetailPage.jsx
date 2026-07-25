import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { eventApi } from '../lib/api'
import { useAuth } from '../context/auth'
import { showNotification } from '../components/NotificationToast'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState(null)
  const [reviews, setReviews] = useState([])
  const [avgRating, setAvgRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReviews = () => {
    eventApi.getReviews(id)
      .then(({ reviews, avgRating, totalReviews }) => {
        setReviews(reviews)
        setAvgRating(avgRating)
        setTotalReviews(totalReviews)
      })
      .catch(() => {})
  }

  const [discussions, setDiscussions] = useState([])
  const [question, setQuestion] = useState('')
  const [submittingQ, setSubmittingQ] = useState(false)
  const [answerInputs, setAnswerInputs] = useState({})

  const loadDiscussions = () => {
    eventApi.getDiscussions(id).then(({ discussions }) => setDiscussions(discussions || [])).catch(() => {})
  }

  useEffect(() => {
    Promise.all([
      eventApi.get(id),
      eventApi.getReviews(id),
      eventApi.getDiscussions(id)
    ])
      .then(([{ event }, { reviews, avgRating, totalReviews }, { discussions }]) => {
        setEvent(event)
        setReviews(reviews)
        setAvgRating(avgRating)
        setTotalReviews(totalReviews)
        setDiscussions(discussions || [])
      })
      .catch(() => setError('Event not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmittingReview(true)
    try {
      await eventApi.addReview(id, { rating, comment })
      showNotification('Thank you! Your review has been published.', 'success')
      setComment('')
      loadReviews()
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="page-loader">Loading event…</div>
  if (error || !event) return (
    <main className="error-page">
      <h1>Event not found</h1>
      <Link to="/" className="primary-button">← Back to events</Link>
    </main>
  )

  const dateObj = new Date(event.date)
  const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const soldOut = event.ticketsAvailable === 0

  return (
    <main className="event-detail-page">
      {/* Header */}
      <header className="dashboard-header">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <div>
          {user ? (
            <button className="profile-button" onClick={() => navigate('/dashboard')}>{user.name.split(' ')[0]}</button>
          ) : (
            <Link to="/login" className="login-button">Log in</Link>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="event-banner">
        {event.bannerUrl
          ? <img src={`http://localhost:5001${event.bannerUrl}`} alt={event.title} />
          : <div className={`event-banner-placeholder ${event.category?.toLowerCase()}`}><span>{event.category}</span></div>
        }
      </div>

      {/* Content */}
      <div className="event-detail-content">
        <div className="event-detail-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="event-detail-category">{event.category}</span>
            {totalReviews > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                ★ {avgRating} ({totalReviews} review{totalReviews > 1 ? 's' : ''})
              </span>
            )}
          </div>
          <h1 className="event-detail-title">{event.title}</h1>

          <div className="event-detail-meta">
            <div className="meta-item">
              <span className="meta-icon">📅</span>
              <div><strong>{formattedDate}</strong><span>{event.time}</span></div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">📍</span>
              <div><strong>{event.venue}</strong><span>{event.city}</span></div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">👤</span>
              <div><strong>Organised by</strong><span>{event.organizer?.name || 'Evently'}</span></div>
            </div>
          </div>

          <div className="event-detail-description">
            <h2>About this event</h2>
            <p>{event.description}</p>
          </div>

          {/* Reviews & Ratings Section */}
          <div className="event-reviews-section" style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--line)' }}>
            <h2>Attendee Reviews & Ratings ({totalReviews})</h2>

            {/* Review Submission Form */}
            {user ? (
              <form onSubmit={submitReview} style={{ background: 'var(--paper)', padding: 20, borderRadius: 12, border: '1px solid var(--line)', margin: '16px 0 24px' }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Leave a review for this event</p>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: star <= rating ? '#f59e0b' : 'var(--line)' }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: 13, color: 'var(--muted)', alignSelf: 'center', marginLeft: 8 }}>{rating} / 5 Stars</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Share your feedback about the venue, organization, or experience…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--line)', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
                <button className="primary-button" type="submit" disabled={submittingReview} style={{ marginTop: 10 }}>
                  {submittingReview ? 'Submitting…' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0 20px' }}>
                Have a ticket for this event? <Link to="/login" style={{ color: '#745ec5', textDecoration: 'underline' }}>Log in</Link> to leave a review.
              </p>
            )}

            {/* List of Reviews */}
            <div className="reviews-list">
              {reviews.map(r => (
                <div key={r._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{r.user?.name}</strong>
                    <span style={{ color: '#f59e0b', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--ink)', margin: '6px 0 0' }}>{r.comment}</p>
                  <small style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</small>
                </div>
              ))}
              {reviews.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No reviews yet. Be the first to leave a review!</p>}
            </div>
          </div>

          {/* Q&A Discussion Forum */}
          <div className="dash-card" style={{ marginTop: 24 }}>
            <h2>💬 Event Q&amp;A Discussion Board</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              Have questions about parking, schedule, or rules? Ask below!
            </p>

            {user ? (
              <form onSubmit={async (e) => {
                e.preventDefault()
                if (!question.trim()) return
                setSubmittingQ(true)
                try {
                  await eventApi.postQuestion(id, question.trim())
                  showNotification('Question posted!', 'success')
                  setQuestion('')
                  loadDiscussions()
                } catch (err) { showNotification(err.message, 'error') }
                finally { setSubmittingQ(false) }
              }} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Ask a question about this event..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                  required
                />
                <button className="primary-button" type="submit" disabled={submittingQ}>
                  {submittingQ ? 'Posting…' : 'Ask Question'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
                <Link to="/login" style={{ color: '#745ec5', textDecoration: 'underline' }}>Log in</Link> to ask a question.
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {discussions.map(d => (
                <div key={d._id} style={{ padding: 14, borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                    <strong>❓ {d.user?.name}</strong>
                    <span>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', margin: '0 0 8px' }}>{d.question}</p>

                  {d.isAnswered ? (
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(116,94,197,0.08)', borderLeft: '3px solid #745ec5', marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 'bold', color: '#745ec5', display: 'block', marginBottom: 2 }}>OFFICIAL ORGANIZER RESPONSE ✅</span>
                      <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0 }}>{d.answer}</p>
                    </div>
                  ) : ['organizer', 'admin'].includes(user?.role) ? (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Reply as organizer..."
                        value={answerInputs[d._id] || ''}
                        onChange={(e) => setAnswerInputs({ ...answerInputs, [d._id]: e.target.value })}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12 }}
                      />
                      <button
                        className="primary-button"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={async () => {
                          const ans = answerInputs[d._id]
                          if (!ans?.trim()) return
                          try {
                            await eventApi.answerQuestion(id, d._id, ans.trim())
                            showNotification('Response posted!', 'success')
                            loadDiscussions()
                          } catch (err) { showNotification(err.message, 'error') }
                        }}
                      >
                        Reply
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Awaiting organizer response...</span>
                  )}
                </div>
              ))}
              {discussions.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>No questions asked yet.</p>}
            </div>
          </div>
        </div>

        {/* Booking sidebar */}
        <aside className="event-booking-sidebar">
          <div className="booking-card">
            <div className="booking-card-price">
              {event.price === 0 ? <span className="price-free">Free</span> : <><span className="price-currency">₹</span><span className="price-amount">{event.price.toLocaleString()}</span><span className="price-per"> / ticket</span></>}
            </div>
            <div className="booking-card-availability">
              <span className={soldOut ? 'sold-out' : 'available'}>
                {soldOut ? 'Sold Out' : `${event.ticketsAvailable} tickets left`}
              </span>
            </div>
            {soldOut ? (
              <button className="auth-submit" disabled>Sold Out</button>
            ) : user ? (
              <button className="auth-submit" onClick={() => navigate(`/book/${event._id}`)}>
                Book Tickets <span>→</span>
              </button>
            ) : (
              <button className="auth-submit" onClick={() => navigate('/login')}>
                Log in to Book <span>→</span>
              </button>
            )}
          </div>
        </aside>
      </div>
    </main>
  )
}
