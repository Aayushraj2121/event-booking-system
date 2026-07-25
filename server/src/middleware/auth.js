import jwt from 'jsonwebtoken'
import User from '../models/User.js'
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  try { const { userId } = jwt.verify(token, process.env.JWT_SECRET); req.user = await User.findById(userId).select('-password'); if (!req.user) return res.status(401).json({ message: 'Account no longer exists.' }); next() } catch { return res.status(401).json({ message: 'Your session has expired. Please log in again.' }) }
}

export async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' })
    next()
  })
}

export async function requireOrganizer(req, res, next) {
  await requireAuth(req, res, () => {
    if (!['organizer', 'admin'].includes(req.user?.role))
      return res.status(403).json({ message: 'Organizer access required.' })
    next()
  })
}

