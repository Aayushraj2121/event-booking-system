import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import eventRoutes from './routes/eventRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import reportRoutes from './routes/reportRoutes.js'
import userRoutes from './routes/userRoutes.js'

import { rateLimiter } from './middleware/rateLimiter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})

// Apply rate limiter to authentication & OTP endpoints
app.use('/api/auth/send-otp', rateLimiter({ max: 10, message: 'Too many OTP requests. Please wait 15 minutes.' }))
app.use('/api/auth/verify-otp', rateLimiter({ max: 10, message: 'Too many verification attempts.' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/users', userRoutes)

// Dev-only: promote user to admin
app.post('/api/auth/make-admin', async (req, res) => {
  const { email } = req.body
  const { default: User } = await import('./models/User.js')
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true })
  if (!user) return res.status(404).json({ message: 'User not found.' })
  res.json({ message: `${user.email} is now an admin.` })
})

app.use((error, req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: error.message || 'Something went wrong on our side.' })
})

const port = process.env.PORT || 5001
connectDatabase()
  .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
  .catch((error) => { console.error(error.message); process.exit(1) })
