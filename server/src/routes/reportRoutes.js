import { Router } from 'express'
import Booking from '../models/Booking.js'
import Event from '../models/Event.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// User/Admin: booking confirmation report
router.get('/booking/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title description date time venue city price bannerUrl category')
      .populate('user', 'name email')
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied.' })
    res.json({ booking })
  } catch (error) { next(error) }
})

// Admin: event attendee report
router.get('/event/:id', requireAdmin, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name email')
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    const bookings = await Booking.find({ event: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: 1 })
    const revenue = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.totalPrice, 0)
    const ticketsSold = bookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + b.seats, 0)
    res.json({ event, bookings, revenue, ticketsSold })
  } catch (error) { next(error) }
})

// Admin: registration summary (all events)
router.get('/summary', requireAdmin, async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 })
    const summaries = await Promise.all(events.map(async (event) => {
      const bookings = await Booking.find({ event: event._id, status: 'confirmed' })
      const revenue = bookings.reduce((s, b) => s + b.totalPrice, 0)
      const ticketsSold = bookings.reduce((s, b) => s + b.seats, 0)
      return { event: { _id: event._id, title: event.title, date: event.date, city: event.city, category: event.category }, ticketsSold, totalTickets: event.ticketsTotal, revenue, bookingCount: bookings.length }
    }))
    res.json({ summaries })
  } catch (error) { next(error) }
})

export default router
