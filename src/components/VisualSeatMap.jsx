import { useState } from 'react'

const ROWS = ['A', 'B', 'C', 'D', 'E']
const SEATS_PER_ROW = 8

export default function VisualSeatMap({ onSeatsSelected, maxSeats = 10, occupiedSeats = [] }) {
  const [selected, setSelected] = useState([])

  const toggleSeat = (seatId) => {
    if (occupiedSeats.includes(seatId)) return
    let next
    if (selected.includes(seatId)) {
      next = selected.filter(s => s !== seatId)
    } else {
      if (selected.length >= maxSeats) return
      next = [...selected, seatId]
    }
    setSelected(next)
    onSeatsSelected(next)
  }

  return (
    <div className="seat-map-container" style={{ background: 'var(--paper)', padding: 20, borderRadius: 14, border: '1px solid var(--line)', marginBottom: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(180deg, #745ec5, transparent)', height: 8, borderRadius: 4, width: '70%', margin: '0 auto 6px', opacity: 0.8 }}></div>
        <span style={{ fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>STAGE / SCREEN</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
        {ROWS.map(row => (
          <div key={row} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ width: 20, fontSize: 12, fontWeight: 'bold', color: 'var(--muted)', textAlign: 'right' }}>{row}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: SEATS_PER_ROW }).map((_, idx) => {
                const seatNum = idx + 1
                const seatId = `${row}-${seatNum}`
                const isOccupied = occupiedSeats.includes(seatId)
                const isSelected = selected.includes(seatId)
                const isVip = row === 'A' || row === 'B'

                return (
                  <button
                    key={seatId}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => toggleSeat(seatId)}
                    title={isOccupied ? `Seat ${seatId} Occupied` : `${isVip ? 'VIP' : 'Standard'} Seat ${seatId}`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: isSelected ? '2px solid #745ec5' : '1px solid var(--line)',
                      background: isOccupied
                        ? '#cbd5e1'
                        : isSelected
                        ? '#745ec5'
                        : isVip
                        ? 'rgba(116,94,197,0.15)'
                        : 'var(--paper)',
                      color: isSelected ? '#ffffff' : isOccupied ? '#94a3b8' : 'var(--ink)',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: 11,
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {seatNum}
                  </button>
                )
              })}
            </div>
            <span style={{ width: 20, fontSize: 12, fontWeight: 'bold', color: 'var(--muted)' }}>{row}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(116,94,197,0.25)', border: '1px solid #745ec5' }}></span> 👑 VIP Rows (A &amp; B): +50% Price (1.5x)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--paper)', border: '1px solid var(--line)' }}></span> 🎟 Standard Rows (C–E)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#745ec5' }}></span> Selected ({selected.length})
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#cbd5e1' }}></span> Occupied
        </span>
      </div>
    </div>
  )
}
