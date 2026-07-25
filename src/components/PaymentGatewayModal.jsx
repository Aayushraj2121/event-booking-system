import { useState } from 'react'

export default function PaymentGatewayModal({ amount, onPaymentSuccess, onClose }) {
  const [method, setMethod] = useState('card') // 'card' | 'upi' | 'netbanking'
  const [processing, setProcessing] = useState(false)
  const [cardNumber, setCardNumber] = useState('4532 8912 3456 7890')
  const [expiry, setExpiry] = useState('12/28')
  const [cvv, setCvv] = useState('889')

  const handlePay = (e) => {
    e.preventDefault()
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onPaymentSuccess()
    }, 1200)
  }

  const basePrice = Math.round(amount / 1.18)
  const gst = amount - basePrice

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--paper)', width: '100%', maxWidth: 460, borderRadius: 16, border: '1px solid var(--line)', padding: 24, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', position: 'relative' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 22 }}>💳</span>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>Evently Secure Checkout</h3>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Simulated 256-Bit SSL Payment Gateway</span>
          </div>
        </div>

        <div style={{ background: 'rgba(116,94,197,0.08)', padding: 14, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>Ticket Subtotal</span>
            <span>₹{basePrice.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            <span>GST Tax (18%)</span>
            <span>₹{gst.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 'bold', borderTop: '1px dashed var(--line)', paddingTop: 6, color: 'var(--ink)' }}>
            <span>Total Payable</span>
            <span style={{ color: '#745ec5' }}>₹{amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Methods selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setMethod('card')}
            style={{ flex: 1, padding: 10, borderRadius: 8, border: method === 'card' ? '2px solid #745ec5' : '1px solid var(--line)', background: method === 'card' ? 'rgba(116,94,197,0.1)' : 'var(--paper)', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
          >
            💳 Card
          </button>
          <button
            type="button"
            onClick={() => setMethod('upi')}
            style={{ flex: 1, padding: 10, borderRadius: 8, border: method === 'upi' ? '2px solid #745ec5' : '1px solid var(--line)', background: method === 'upi' ? 'rgba(116,94,197,0.1)' : 'var(--paper)', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
          >
            📲 UPI / QR
          </button>
          <button
            type="button"
            onClick={() => setMethod('netbanking')}
            style={{ flex: 1, padding: 10, borderRadius: 8, border: method === 'netbanking' ? '2px solid #745ec5' : '1px solid var(--line)', background: method === 'netbanking' ? 'rgba(116,94,197,0.1)' : 'var(--paper)', cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
          >
            🏦 NetBanking
          </button>
        </div>

        <form onSubmit={handlePay}>
          {method === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Card Number
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', font: '14px "DM Mono", monospace', marginTop: 4 }} required />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Expiry Date
                  <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', font: '14px "DM Mono", monospace', marginTop: 4 }} required />
                </label>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>CVV
                  <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} maxLength={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', font: '14px "DM Mono", monospace', marginTop: 4 }} required />
                </label>
              </div>
            </div>
          )}

          {method === 'upi' && (
            <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 16 }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=upi://pay?pa=evently@upi&pn=Evently&am=${amount}`} alt="UPI QR" style={{ borderRadius: 10, border: '1px solid var(--line)', padding: 6, background: '#fff' }} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Scan using GPay, PhonePe, or Paytm UPI</p>
            </div>
          )}

          {method === 'netbanking' && (
            <div style={{ padding: '12px 0', marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>Select Bank</label>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', marginTop: 4 }}>
                <option>HDFC Bank</option>
                <option>ICICI Bank</option>
                <option>State Bank of India</option>
                <option>Axis Bank</option>
              </select>
            </div>
          )}

          <button className="primary-button" type="submit" disabled={processing} style={{ width: '100%', justifyContent: 'center', padding: '12px 0' }}>
            {processing ? 'Processing Payment…' : `🔒 Pay ₹${amount.toLocaleString()} & Confirm`}
          </button>
        </form>
      </div>
    </div>
  )
}
