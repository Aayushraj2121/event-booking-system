import mongoose from 'mongoose'
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^\S+@\S+\.\S+$/ },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'organizer', 'admin'], default: 'user' },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
  phone: { type: String, trim: true, default: '' },
  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  otp: {
    emailOtp: { type: String },
    phoneOtp: { type: String },
    expiresAt: { type: Date }
  }
}, { timestamps: true })
export default mongoose.model('User', userSchema)
