import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

const bookingSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  seats:       { type: Number, required: true, min: 1, max: 10 },
  totalPrice:  { type: Number, required: true },
  tierName:    { type: String, default: 'General' },
  status:      { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  bookingRef:  { type: String, unique: true, default: () => nanoid(8).toUpperCase() },
  checkedIn:   { type: Boolean, default: false },
  checkedInAt: { type: Date },
}, { timestamps: true })

export default mongoose.model('Booking', bookingSchema)
