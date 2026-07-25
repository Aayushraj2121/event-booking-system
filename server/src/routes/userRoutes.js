import { Router } from 'express'
import User from '../models/User.js'
import Event from '../models/Event.js'
import Booking from '../models/Booking.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

// User: Toggle favorite event (bookmark/unbookmark)
router.post('/favorites/:eventId', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const eventId = req.params.eventId
    const index = user.favorites.indexOf(eventId)
    let isFavorite = false

    if (index > -1) {
      user.favorites.splice(index, 1)
      isFavorite = false
    } else {
      user.favorites.push(eventId)
      isFavorite = true
    }

    await user.save()
    res.json({ isFavorite, favorites: user.favorites })
  } catch (error) { next(error) }
})

// User: Get list of favorite events
router.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites')
    res.json({ favorites: user.favorites || [] })
  } catch (error) { next(error) }
})

// Admin: Get all users with stats
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })
    const userList = await Promise.all(users.map(async (u) => {
      const bookingCount = await Booking.countDocuments({ user: u._id })
      const eventCount = await Event.countDocuments({ organizer: u._id })
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        bookingCount,
        eventCount,
      }
    }))
    res.json({ users: userList })
  } catch (error) { next(error) }
})

// Admin: Delete a user
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'You cannot remove your own admin account.' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // Clean up user's bookings and events
    await Booking.deleteMany({ user: req.params.id })
    await Event.deleteMany({ organizer: req.params.id })
    await user.deleteOne()

    res.json({ message: `User ${user.name} removed successfully.` })
  } catch (error) { next(error) }
})

// Admin: Update user role
router.patch('/:id/role', requireAdmin, async (req, res, next) => {
  try {
    const { role } = req.body
    if (!['user', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    user.role = role
    await user.save()
    res.json({ message: `${user.name}'s role updated to ${role}.`, user })
  } catch (error) { next(error) }
})

export default router
