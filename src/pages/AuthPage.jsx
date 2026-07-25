import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { authApi } from '../lib/api'
import { showNotification } from '../components/NotificationToast'

const blankForm = { name: '', email: '', phone: '', password: '', confirmPassword: '' }
const checksFor = (password) => [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)]

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const [selectedRole, setSelectedRole] = useState('user') // 'user' | 'organizer'
  const [form, setForm] = useState(blankForm)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otpStep, setOtpStep] = useState(false)
  const [demoOtp, setDemoOtp] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const checks = checksFor(form.password)

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (isRegister && !checks.every(Boolean)) return setError('Use at least 8 characters, one uppercase letter, and one number.')
    if (isRegister && form.password !== form.confirmPassword) return setError('Your passwords do not match.')
    setIsSubmitting(true)
    try {
      if (isRegister) {
        const res = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: selectedRole })
        if (res?.requiresOtp) {
          setDemoOtp(res.demoOtp)
          setOtpStep(true)
          showNotification(`Verification OTP sent to ${form.email} & Phone!`, 'info')
          return
        }
      } else {
        await login({ email: form.email, password: form.password })
      }
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function verifyOtpSubmit(event) {
    event.preventDefault()
    if (!otpInput.trim()) return setError('Please enter the 6-digit OTP code.')
    setIsSubmitting(true)
    setError('')
    try {
      const res = await authApi.verifyOtp(otpInput.trim())
      showNotification(res.message, 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleConfig = {
    user: {
      label: 'Attendee',
      icon: '🎟',
      headline: isRegister ? 'Join as an Attendee' : 'Welcome back',
      subtitle: isRegister
        ? 'Discover events, book tickets, and keep your plans in one place.'
        : 'Log in to your account to browse and book events.',
      artAccent: 'auth-art-user',
    },
    organizer: {
      label: 'Organizer',
      icon: '🎪',
      headline: isRegister ? 'Join as an Organizer' : 'Welcome back',
      subtitle: isRegister
        ? 'Create and manage events, track bookings, and grow your audience.'
        : 'Log in to manage your events and view analytics.',
      artAccent: 'auth-art-organizer',
    },
  }

  const current = roleConfig[selectedRole]

  return (
    <main className="auth-page">
      {/* Left art panel */}
      <section className={`auth-art ${current.artAccent}`}>
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark"><i></i><i></i><i></i></span>Evently
        </Link>
        <div className="auth-orb orb-a"></div>
        <div className="auth-orb orb-b"></div>
        <div className="auth-ticket">
          <small>EVENTLY / ACCESS</small>
          <strong>MAKE IT<br /><em>MEMORABLE.</em></strong>
          <span>YOUR STORY IS WAITING</span>
        </div>
        <div className="auth-caption">
          <p className="eyebrow"><span></span> YOUR PLACE TO GO OUT</p>
          <h1>Don't just<br /><em>watch life.</em></h1>
          <p>Find the people, places, and plans that make your calendar feel like yours.</p>
        </div>
      </section>

      {/* Right form panel */}
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <Link className="back-home" to="/">← Back to home</Link>

          {/* Role selector — shown on both register and login */}
          <div className="role-selector">
            <p className="role-selector-label">I want to…</p>
            <div className="role-cards">
              <button
                type="button"
                className={`role-card ${selectedRole === 'user' ? 'active' : ''}`}
                onClick={() => setSelectedRole('user')}
              >
                <span className="role-card-icon">🎟</span>
                <strong>{isRegister ? 'Attend Events' : 'Log in as Attendee'}</strong>
                <span>{isRegister ? 'Browse and book tickets for events' : 'Access your bookings and tickets'}</span>
              </button>
              <button
                type="button"
                className={`role-card ${selectedRole === 'organizer' ? 'active' : ''}`}
                onClick={() => setSelectedRole('organizer')}
              >
                <span className="role-card-icon">🎪</span>
                <strong>{isRegister ? 'Organise Events' : 'Log in as Organizer'}</strong>
                <span>{isRegister ? 'Create events and manage bookings' : 'Manage your events and analytics'}</span>
              </button>
            </div>
            {!isRegister && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, lineHeight: 1.4 }}>
                Note: Your dashboard is determined by the role you chose when you registered.
              </p>
            )}
          </div>

          {otpStep ? (
            <div>
              <p className="eyebrow"><span></span> STEP 2: VERIFICATION</p>
              <h2><span>Verify your<br /></span><em>Phone &amp; Email</em></h2>
              <p className="auth-subtitle">
                We've sent a 6-digit OTP code to <strong>{form.email}</strong> and <strong>{form.phone || 'your phone'}</strong>.
              </p>

              <div style={{ padding: 14, background: 'rgba(116,94,197,0.08)', borderRadius: 10, border: '1px solid var(--line)', marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                  Demo Verification OTP Code: <strong style={{ color: '#745ec5', font: '16px "DM Mono", monospace', letterSpacing: 2 }}>{demoOtp}</strong>
                </p>
              </div>

              <form onSubmit={verifyOtpSubmit}>
                <label>Enter 6-Digit Verification Code
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    style={{ font: '20px "DM Mono", monospace', letterSpacing: 6, textAlign: 'center' }}
                    required
                  />
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="auth-submit" type="submit" disabled={isSubmitting} style={{ marginTop: 16 }}>
                  {isSubmitting ? 'Verifying OTP…' : '✓ Complete Verification & Enter'} <span>→</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              <p className="eyebrow"><span></span> {isRegister ? (selectedRole === 'organizer' ? 'NEW ORGANIZER' : 'NEW ATTENDEE') : 'WELCOME BACK'}</p>
              <h2>
                {isRegister
                  ? selectedRole === 'organizer'
                    ? <><span>Create your<br /></span><em>organizer account.</em></>
                    : <><span>Create your<br /></span><em>account.</em></>
                  : <><span>Good to see<br /></span><em>you again.</em></>
                }
              </h2>
              <p className="auth-subtitle">{current.subtitle}</p>

              <form onSubmit={submit} noValidate>
            {isRegister && (
              <>
                <label>Full name
                  <input name="name" value={form.name} onChange={update} autoComplete="name" placeholder="Your name" required />
                </label>
                <label>Mobile Number
                  <input type="tel" name="phone" value={form.phone} onChange={update} autoComplete="tel" placeholder="+91 98765 43210" required />
                </label>
              </>
            )}
            <label>Email address
              <input type="email" name="email" value={form.email} onChange={update} autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label>Password
              <input type="password" name="password" value={form.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="••••••••" required />
            </label>
            {isRegister && (
              <>
                <div className="password-checks">
                  {['8+ characters', 'One uppercase letter', 'One number'].map((label, index) => (
                    <span className={checks[index] ? 'valid' : ''} key={label}>{checks[index] ? '✓' : '○'} {label}</span>
                  ))}
                </div>
                <label>Confirm password
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} autoComplete="new-password" placeholder="••••••••" required />
                </label>
              </>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className={`auth-submit ${selectedRole === 'organizer' ? 'organizer-submit' : ''}`} disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : isRegister ? `Create ${selectedRole === 'organizer' ? 'Organizer' : ''} Account` : 'Log in'} <span>→</span>
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
          </p>
            </>
          )}
        </div>
      </section>
    </main>
  )
}
