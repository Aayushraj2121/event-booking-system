import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventApi } from '../lib/api'

export default function AiEventAssistant() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [events, setEvents] = useState([])
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm your Evently AI Assistant. What kind of events are you looking for today? (e.g. 'Music under ₹1500' or 'Weekend events in Mumbai')", sender: 'ai' }
  ])
  const navigate = useNavigate()

  useEffect(() => {
    eventApi.list().then(({ events }) => setEvents(events || [])).catch(() => {})
  }, [])

  const handleSend = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    const userMsg = query.trim()
    const newMessages = [...messages, { text: userMsg, sender: 'user' }]
    setQuery('')

    // AI Response logic matching category, city, or price
    const qLower = userMsg.toLowerCase()
    const matches = events.filter(ev => {
      const matchCat = ev.category?.toLowerCase() && qLower.includes(ev.category.toLowerCase())
      const matchCity = ev.city?.toLowerCase() && qLower.includes(ev.city.toLowerCase())
      const matchTitle = ev.title?.toLowerCase().split(' ').some(w => w.length > 3 && qLower.includes(w))
      const matchPrice = qLower.includes('free') ? ev.price === 0 : qLower.includes('under') ? ev.price <= 2000 : true
      return (matchCat || matchCity || matchTitle) && matchPrice
    })

    let aiReply = ""
    if (matches.length > 0) {
      aiReply = `🎉 I found ${matches.length} event(s) matching your request:`
    } else {
      aiReply = `I couldn't find exact matches for "${userMsg}", but here are top trending events on Evently:`
    }

    setMessages([...newMessages, { text: aiReply, sender: 'ai', suggestions: matches.length > 0 ? matches.slice(0, 3) : events.slice(0, 3) }])
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999 }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #745ec5, #4c379a)',
            color: '#fff', border: 'none', borderRadius: 30,
            padding: '12px 20px', fontWeight: 'bold', fontSize: 14,
            boxShadow: '0 8px 24px rgba(116,94,197,0.35)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <span>🤖 AI Assistant</span>
        </button>
      )}

      {open && (
        <div style={{ width: 340, height: 460, background: 'var(--paper)', borderRadius: 16, border: '1px solid var(--line)', boxShadow: '0 12px 36px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #1f2029, #2b1f3d)', padding: '14px 18px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <div>
                <strong style={{ fontSize: 14, display: 'block' }}>Evently AI Assistant</strong>
                <span style={{ fontSize: 10, opacity: 0.7 }}>Smart Event Matchmaker</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.4,
                  background: m.sender === 'user' ? '#745ec5' : 'var(--paper)',
                  color: m.sender === 'user' ? '#fff' : 'var(--ink)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--line)'
                }}>
                  {m.text}
                </div>
                {m.suggestions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {m.suggestions.map(ev => (
                      <div
                        key={ev._id}
                        onClick={() => { setOpen(false); navigate(`/events/${ev._id}`) }}
                        style={{ padding: '8px 10px', background: 'rgba(116,94,197,0.08)', borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer', fontSize: 12 }}
                      >
                        <strong style={{ color: 'var(--ink)', display: 'block' }}>{ev.title}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>{ev.city} · ₹{ev.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} style={{ padding: 10, borderTop: '1px solid var(--line)', display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Ask AI (e.g. Music shows...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--line)', fontSize: 12 }}
            />
            <button type="submit" style={{ background: '#745ec5', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}>Send</button>
          </form>
        </div>
      )}
    </div>
  )
}
