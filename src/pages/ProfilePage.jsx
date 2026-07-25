import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { authApi } from '../lib/api'
import { showNotification } from '../components/NotificationToast'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [newPassword, setNewPassword] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [demoOtp, setDemoOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await authApi.updateProfile({ name, email, phone, newPassword: newPassword || undefined })
      showNotification(res.message, 'success')
      setNewPassword('')
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSendOtp = async () => {
    setSendingOtp(true)
    try {
      const res = await authApi.sendOtp()
      setDemoOtp(res.demoOtp)
      setOtpSent(true)
      showNotification(res.message, 'info')
    } catch (err) { showNotification(err.message, 'error') }
    finally { setSendingOtp(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otpInput.trim()) return
    setVerifyingOtp(true)
    try {
      const res = await authApi.verifyOtp(otpInput.trim())
      showNotification(res.message, 'success')
      setOtpSent(false)
      setOtpInput('')
    } catch (err) { showNotification(err.message, 'error') }
    finally { setVerifyingOtp(false) }
  }

  const exit = () => { logout(); navigate('/') }

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="brand" to="/"><span className="brand-mark"><i></i><i></i><i></i></span>Evently</Link>
        <nav className="dashboard-nav">
          <button onClick={() => navigate('/dashboard')}><span>🏠</span> Overview</button>
          <button className="active"><span>👤</span> Account Settings</button>
        </nav>
        <div className="admin-sidebar-footer">
          <span className="admin-name">{user?.name}</span>
          <button className="logout-link" onClick={exit}>Log out</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="dash-section">
          <p className="eyebrow"><span></span> ACCOUNT SETTINGS</p>
          <h1>Profile &amp; <em>Security</em></h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
            {/* Account Card */}
            <div className="dash-card">
              <h2>Account Information</h2>
              <div style={{ margin: '16px 0', padding: 16, borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--line)' }}>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>ACCOUNT ROLE</p>
                <strong style={{ fontSize: 18, textTransform: 'capitalize', color: '#745ec5' }}>{user?.role} Account</strong>
              </div>
              <form onSubmit={handleUpdate} className="admin-form">
                <label>Full Name
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                </label>
                <label>Email Address
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </label>
                <label>Mobile Phone Number
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </label>
                <label>New Password <small style={{ fontWeight: 400, color: 'var(--muted)' }}>(Leave blank to keep current)</small>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                </label>
                <button className="primary-button" type="submit" disabled={saving} style={{ marginTop: 12 }}>
                  {saving ? 'Saving…' : 'Save Profile Changes'} <span>→</span>
                </button>
              </form>
            </div>

            {/* OTP & Phone Verification Card */}
            <div className="dash-card">
              <h2>Phone &amp; Email OTP Verification</h2>
              <div style={{ margin: '16px 0', padding: 14, borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>Email ({user?.email})</span>
                  <span className={`status-badge ${user?.emailVerified ? 'confirmed' : ''}`} style={{ fontSize: 11 }}>
                    {user?.emailVerified ? 'Verified ✅' : 'Unverified ⚠️'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13 }}>Phone ({user?.phone || 'Not Set'})</span>
                  <span className={`status-badge ${user?.phoneVerified ? 'confirmed' : ''}`} style={{ fontSize: 11 }}>
                    {user?.phoneVerified ? 'Verified ✅' : 'Unverified ⚠️'}
                  </span>
                </div>
              </div>

              {(!user?.emailVerified || !user?.phoneVerified) ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
                    Click below to generate a 6-digit OTP code sent simultaneously to your Email &amp; Phone.
                  </p>
                  <button className="outline-button" onClick={handleSendOtp} disabled={sendingOtp} style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
                    {sendingOtp ? 'Sending 6-Digit OTP…' : '📲 Send OTP to Phone & Email'}
                  </button>

                  {otpSent && (
                    <form onSubmit={handleVerifyOtp} style={{ background: 'var(--paper)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 8px' }}>
                        Demo OTP Code: <strong style={{ color: '#745ec5', font: '14px "DM Mono", monospace' }}>{demoOtp}</strong>
                      </p>
                      <input
                        type="text"
                        placeholder="Enter 6-Digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        maxLength={6}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line)', font: '16px "DM Mono", monospace', textAlign: 'center', letterSpacing: 4, marginBottom: 10 }}
                        required
                      />
                      <button className="primary-button" type="submit" disabled={verifyingOtp} style={{ width: '100%', justifyContent: 'center' }}>
                        {verifyingOtp ? 'Verifying…' : '✓ Verify OTP Code'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 12px' }}>
                  <span style={{ fontSize: 36 }}>✅</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 16 }}>Fully Verified</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>Both your Email &amp; Phone number are verified.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
