import { Router } from 'express'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import User from '../models/User.js'
import { requireAdmin, requireOrganizer } from '../middleware/auth.js'

const router = Router()

// Admin: overall stats
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const [totalEvents, totalUsers, bookings, upcomingEvents, upcomingCount] = await Promise.all([
      Event.countDocuments(),
      User.countDocuments(),
      Booking.find({ status: 'confirmed' }).populate('event', 'title price'),
      Event.find({ isPublished: true }).sort({ date: 1 }).limit(5),
      Event.countDocuments({ isPublished: true }),
    ])

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
    const totalBookings = bookings.length

    // Top events by booking count
    const eventBookingMap = {}
    for (const b of bookings) {
      const key = String(b.event?._id)
      if (!key) continue
      eventBookingMap[key] = (eventBookingMap[key] || { title: b.event.title, count: 0, revenue: 0 })
      eventBookingMap[key].count += b.seats
      eventBookingMap[key].revenue += b.totalPrice
    }
    const topEvents = Object.values(eventBookingMap).sort((a, b) => b.count - a.count).slice(0, 5)

    // Bookings per day (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentBookings = await Booking.find({ createdAt: { $gte: sevenDaysAgo } })
      .populate('event', 'title')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20)

    res.json({ totalEvents, totalUsers, totalBookings, totalRevenue, topEvents, upcomingEvents, upcomingCount, recentBookings })
  } catch (error) { next(error) }
})

export default router

// Organizer: their own event stats
router.get('/organizer', requireOrganizer, async (req, res, next) => {
  try {
    const myEvents = await Event.find({ organizer: req.user._id })
    const myEventIds = myEvents.map(e => e._id)

    const bookings = await Booking.find({ event: { $in: myEventIds }, status: 'confirmed' })
      .populate('event', 'title price')
      .populate('user', 'name')

    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0)
    const totalBookings = bookings.length

    // Per-event summary
    const eventMap = {}
    for (const e of myEvents) {
      eventMap[String(e._id)] = { title: e.title, count: 0, revenue: 0, available: e.ticketsAvailable, total: e.ticketsTotal, isPublished: e.isPublished }
    }
    for (const b of bookings) {
      const key = String(b.event?._id)
      if (eventMap[key]) { eventMap[key].count += b.seats; eventMap[key].revenue += b.totalPrice }
    }
    const eventStats = Object.values(eventMap)

    const recentBookings = bookings.slice(-10).reverse()

    res.json({
      totalEvents: myEvents.length,
      totalBookings,
      totalRevenue,
      eventStats,
      recentBookings,
    })
  } catch (error) { next(error) }
})

