import { useState, useEffect } from 'react'

export function showNotification(message, type = 'info') {
  window.dispatchEvent(new CustomEvent('evently:toast', { detail: { message, type } }))
}

export default function NotificationToast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      setToast(e.detail)
      setTimeout(() => setToast(null), 4000)
    }
    window.addEventListener('evently:toast', handler)
    return () => window.removeEventListener('evently:toast', handler)
  }, [])

  if (!toast) return null

  return (
    <div className={`notification-toast notification-${toast.type}`}>
      <span className="toast-icon">
        {toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : '🔔'}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => setToast(null)}>✕</button>
    </div>
  )
}
