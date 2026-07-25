import { Router } from 'express'
import Booking from '../models/Booking.js'
import Event from '../models/Event.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { sendBookingConfirmationEmail } from '../utils/mailer.js'

const router = Router()

// User: create a booking
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { eventId, seats, tierName, selectedSeats } = req.body
    const numSeats = Number(seats)
    if (!eventId || !numSeats || numSeats < 1 || numSeats > 10)
      return res.status(400).json({ message: 'Please provide a valid event and seat count (1–10).' })

    const event = await Event.findById(eventId)
    if (!event || !event.isPublished) return res.status(404).json({ message: 'Event not found.' })
    if (event.ticketsAvailable < numSeats)
      return res.status(400).json({ message: `Only ${event.ticketsAvailable} ticket(s) remaining.` })

    let pricePerSeat = event.price
    let selectedTierName = 'General'

    if (tierName && event.ticketTiers?.length > 0) {
      const tier = event.ticketTiers.find(t => t.name === tierName)
      if (tier) {
        if (tier.available < numSeats) return res.status(400).json({ message: `Only ${tier.available} ${tierName} ticket(s) remaining.` })
        tier.available -= numSeats
        pricePerSeat = tier.price
        selectedTierName = tier.name
      }
    }

    event.ticketsAvailable -= numSeats
    await event.save()

    const totalPrice = numSeats * pricePerSeat
    const booking = await Booking.create({
      user: req.user._id, event: eventId,
      seats: numSeats, totalPrice,
      tierName: selectedTierName,
      selectedSeats: Array.isArray(selectedSeats) ? selectedSeats : [],
    })
    await booking.populate('event', 'title date time venue city price bannerUrl')

    // Dispatch Booking Confirmation Email
    const emailResult = await sendBookingConfirmationEmail({
      userEmail: req.user.email,
      userName: req.user.name,
      bookingRef: booking.bookingRef,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      venue: event.venue,
      city: event.city,
      seats: numSeats,
      totalPrice,
    })

    res.status(201).json({ booking, emailSent: true, emailDetails: emailResult })
  } catch (error) { next(error) }
})

// User: my bookings
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date time venue city price bannerUrl category')
      .sort({ createdAt: -1 })
    res.json({ bookings })
  } catch (error) { next(error) }
})

// User/Admin: single booking
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title description date time venue city price bannerUrl category organizer')
      .populate('user', 'name email')
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    // Only owner or admin can view
    if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Access denied.' })
    res.json({ booking })
  } catch (error) { next(error) }
})

// User: Resend confirmation email
router.post('/:id/send-email', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date time venue city price')
      .populate('user', 'name email')
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    const result = await sendBookingConfirmationEmail({
      userEmail: booking.user.email,
      userName: booking.user.name,
      bookingRef: booking.bookingRef,
      eventTitle: booking.event.title,
      eventDate: booking.event.date,
      eventTime: booking.event.time,
      venue: booking.event.venue,
      city: booking.event.city,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
    })

    res.json({ message: `Confirmation email dispatched to ${booking.user.email}`, emailDetails: result })
  } catch (error) { next(error) }
})

// User: cancel booking
router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })
    if (String(booking.user) !== String(req.user._id)) return res.status(403).json({ message: 'Access denied.' })
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled.' })
    booking.status = 'cancelled'
    await booking.save()
    // Restore tickets
    await Event.findByIdAndUpdate(booking.event, { $inc: { ticketsAvailable: booking.seats } })
    res.json({ booking })
  } catch (error) { next(error) }
})

// Admin: all bookings
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('event', 'title date city')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
    res.json({ bookings })
  } catch (error) { next(error) }
})

// Admin/Organizer: Verify ticket by reference
router.get('/verify/:ref', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingRef: req.params.ref.toUpperCase() })
      .populate('event', 'title date venue city organizer price')
      .populate('user', 'name email')
    if (!booking) return res.status(404).json({ message: 'Ticket ref not found.' })
    res.json({ booking })
  } catch (error) { next(error) }
})

// Admin/Organizer: Venue check-in ticket
router.patch('/check-in/:ref', requireAuth, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ bookingRef: req.params.ref.toUpperCase() })
      .populate('event', 'title date venue city')
      .populate('user', 'name email')
    if (!booking) return res.status(404).json({ message: 'Invalid ticket reference.' })
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'This ticket has been cancelled.' })
    if (booking.checkedIn) return res.status(400).json({ message: `Already checked in at ${new Date(booking.checkedInAt).toLocaleTimeString()}.` })

    booking.checkedIn = true
    booking.checkedInAt = new Date()
    await booking.save()

    res.json({ message: `Success! Checked in ${booking.user.name} for ${booking.seats} seat(s).`, booking })
  } catch (error) { next(error) }
})

export default router
