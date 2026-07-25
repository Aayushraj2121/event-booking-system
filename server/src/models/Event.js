import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  title:             { type: String, required: true, trim: true, maxlength: 120 },
  description:       { type: String, required: true, trim: true, maxlength: 2000 },
  category:          { type: String, required: true, enum: ['Music', 'Technology', 'Workshop', 'Sports', 'Arts', 'Food', 'Business', 'Other'], default: 'Other' },
  date:              { type: Date, required: true },
  time:              { type: String, required: true },
  venue:             { type: String, required: true, trim: true },
  city:              { type: String, required: true, trim: true },
  bannerUrl:         { type: String, default: '' },
  ticketsTotal:      { type: Number, required: true, min: 1 },
  ticketsAvailable:  { type: Number, required: true, min: 0 },
  price:             { type: Number, required: true, min: 0 },
  organizer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isPublished:       { type: Boolean, default: false },
  ticketTiers:       [{
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 }
  }],
}, { timestamps: true })

export default mongoose.model('Event', eventSchema)
