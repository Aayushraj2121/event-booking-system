import mongoose from 'mongoose'

const discussionSchema = new mongoose.Schema({
  event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question:   { type: String, required: true, trim: true, maxlength: 500 },
  answer:     { type: String, trim: true, default: '' },
  isAnswered: { type: Boolean, default: false },
}, { timestamps: true })

export default mongoose.model('Discussion', discussionSchema)
