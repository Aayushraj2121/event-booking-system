import { Router } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import Event from '../models/Event.js'
import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Discussion from '../models/Discussion.js'
import { requireAuth, requireOrganizer, requireAdmin } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '../../../uploads')

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true)
  else cb(new Error('Only image files are allowed.'))
}})

const router = Router()

// ── Public routes ──────────────────────────────────────────────────────────────

// Public: list published events (with optional filters)
router.get('/', async (req, res, next) => {
  try {
    const { category, city, search } = req.query
    const filter = { isPublished: true }
    if (category) filter.category = category
    if (city) filter.city = new RegExp(city, 'i')
    if (search) filter.title = new RegExp(search, 'i')
    const events = await Event.find(filter).populate('organizer', 'name').sort({ date: 1 })
    res.json({ events })
  } catch (error) { next(error) }
})

// Public: single event
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name')
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    res.json({ event })
  } catch (error) { next(error) }
})

// ── Organizer routes (organizer + admin) ───────────────────────────────────────

// Get events belonging to the logged-in organizer
router.get('/organizer/mine', requireOrganizer, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { organizer: req.user._id }
    const events = await Event.find(filter).sort({ createdAt: -1 })
    res.json({ events })
  } catch (error) { next(error) }
})

// Organizer: create event
router.post('/', requireOrganizer, async (req, res, next) => {
  try {
    const { title, description, category, date, time, venue, city, ticketsTotal, price } = req.body
    if (!title || !description || !date || !time || !venue || !city || !ticketsTotal || price == null)
      return res.status(400).json({ message: 'All fields are required.' })
    const event = await Event.create({
      title, description, category, date, time, venue, city,
      ticketsTotal: Number(ticketsTotal), ticketsAvailable: Number(ticketsTotal),
      price: Number(price), organizer: req.user._id,
      isPublished: true,
    })
    res.status(201).json({ event })
  } catch (error) { next(error) }
})

// Organizer: update their own event (admin can update any)
router.put('/:id', requireOrganizer, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only edit your own events.' })
    Object.assign(event, req.body)
    await event.save()
    res.json({ event })
  } catch (error) { next(error) }
})

// Organizer: delete their own event (admin can delete any)
router.delete('/:id', requireOrganizer, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only delete your own events.' })
    await event.deleteOne()
    res.json({ message: 'Event deleted.' })
  } catch (error) { next(error) }
})

// Organizer: toggle publish their own event
router.patch('/:id/publish', requireOrganizer, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only publish your own events.' })
    event.isPublished = !event.isPublished
    await event.save()
    res.json({ event })
  } catch (error) { next(error) }
})

// Organizer: upload banner for their own event
router.post('/:id/banner', requireOrganizer, upload.single('banner'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image file received.' })
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Event not found.' })
    if (req.user.role !== 'admin' && String(event.organizer) !== String(req.user._id))
      return res.status(403).json({ message: 'You can only upload banners for your own events.' })
    const bannerUrl = `/uploads/${req.file.filename}`
    event.bannerUrl = bannerUrl
    await event.save()
    res.json({ event, bannerUrl })
  } catch (error) { next(error) }
})

// Reviews: Get all reviews & average rating for an event
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ event: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
    const avgRating = reviews.length
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1))
      : 0
    res.json({ reviews, avgRating, totalReviews: reviews.length })
  } catch (error) { next(error) }
})

// Reviews: Add a review for an event (must have booked)
router.post('/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5 || !comment?.trim()) {
      return res.status(400).json({ message: 'Rating (1-5) and comment are required.' })
    }
    // Verify booking
    const hasBooking = await Booking.exists({ event: req.params.id, user: req.user._id, status: 'confirmed' })
    if (!hasBooking && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only attendees who have booked this event can leave a review.' })
    }

    const review = await Review.create({
      event: req.params.id,
      user: req.user._id,
      rating: Number(rating),
      comment: comment.trim(),
    })
    res.status(201).json({ review })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this event.' })
    }
    next(error)
  }
})

// Discussions: Get Q&A list for an event
router.get('/:id/discussions', async (req, res, next) => {
  try {
    const discussions = await Discussion.find({ event: req.params.id })
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
    res.json({ discussions })
  } catch (error) { next(error) }
})

// Discussions: Post a question
router.post('/:id/discussions', requireAuth, async (req, res, next) => {
  try {
    const { question } = req.body
    if (!question?.trim()) return res.status(400).json({ message: 'Question text is required.' })
    const discussion = await Discussion.create({
      event: req.params.id,
      user: req.user._id,
      question: question.trim()
    })
    await discussion.populate('user', 'name role')
    res.status(201).json({ discussion })
  } catch (error) { next(error) }
})

// Discussions: Answer a question (Organizer/Admin)
router.patch('/:id/discussions/:discId/answer', requireOrganizer, async (req, res, next) => {
  try {
    const { answer } = req.body
    if (!answer?.trim()) return res.status(400).json({ message: 'Answer text is required.' })
    const discussion = await Discussion.findById(req.params.discId)
    if (!discussion) return res.status(404).json({ message: 'Question not found.' })
    discussion.answer = answer.trim()
    discussion.isAnswered = true
    await discussion.save()
    await discussion.populate('user', 'name role')
    res.json({ discussion })
  } catch (error) { next(error) }
})

export default router
