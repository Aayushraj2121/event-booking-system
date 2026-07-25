import { useState, useRef, useEffect } from 'react'

export default function CameraQrScanner({ onScanResult, onClose }) {
  const videoRef = useRef(null)
  const [error, setError] = useState('')
  const [active, setActive] = useState(true)

  useEffect(() => {
    let stream = null
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (err) {
        setError('Camera access unavailable. Please use manual entry or check camera permissions.')
      }
    }
    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleSimulateScan = (refCode) => {
    onScanResult(refCode)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--paper)', width: '100%', maxWidth: 440, borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid var(--line)', position: 'relative' }}>
        <button type="button" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>

        <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>📸 Venue Live QR Scanner</h3>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>Point your camera at the attendee's ticket QR code.</p>

        {error ? (
          <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: 240, background: '#000', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
            <div style={{ position: 'absolute', inset: 40, border: '2px dashed #745ec5', borderRadius: 12, pointerEvents: 'none' }}></div>
          </div>
        )}

        <div style={{ background: 'var(--paper)', padding: 12, borderRadius: 10, border: '1px dashed var(--line)' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 8px' }}>Or test with quick sample ticket references:</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" className="outline-button" onClick={() => handleSimulateScan('2LFFCPR2')} style={{ fontSize: 11, padding: '4px 8px' }}>Ref: 2LFFCPR2</button>
            <button type="button" className="outline-button" onClick={() => handleSimulateScan('NQX4-ETY')} style={{ fontSize: 11, padding: '4px 8px' }}>Ref: NQX4-ETY</button>
          </div>
        </div>
      </div>
    </div>
  )
}
