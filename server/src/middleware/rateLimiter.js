// Rate Limiting & Security Middleware
const requestsMap = new Map()

export function rateLimiter({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests. Please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
    const now = Date.now()

    if (!requestsMap.has(ip)) {
      requestsMap.set(ip, [])
    }

    const timestamps = requestsMap.get(ip).filter(t => now - t < windowMs)
    timestamps.push(now)
    requestsMap.set(ip, timestamps)

    if (timestamps.length > max) {
      return res.status(429).json({ message })
    }

    next()
  }
}
