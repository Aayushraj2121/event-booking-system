import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router(); const strong = (password) => password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password); const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  phoneVerified: user.phoneVerified || false,
  emailVerified: user.emailVerified || false,
})
const issue = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (!strong(password))
      return res.status(400).json({ message: 'Password must contain 8 characters, an uppercase letter, and a number.' });
    if (await User.exists({ email: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account with this email already exists.' });

    const allowedRoles = ['user', 'organizer'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const otpCode = String(Math.floor(100000 + Math.random() * 900000))

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone?.trim() || '',
      password: await bcrypt.hash(password, 12),
      role: assignedRole,
      otp: {
        emailOtp: otpCode,
        phoneOtp: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    console.log(`\n📲 [REGISTRATION OTP] Sent 6-Digit OTP [ ${otpCode} ] for new user (${user.email})`)
    return res.status(201).json({ token: issue(user._id), user: safeUser(user), requiresOtp: true, demoOtp: otpCode })
  } catch (error) { next(error) }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password)))
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    return res.json({ token: issue(user._id), user: safeUser(user) })
  } catch (error) { next(error) }
})

router.get('/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }))

// OTP: Send OTP to Phone & Email
router.post('/send-otp', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const otpCode = String(Math.floor(100000 + Math.random() * 900000))
    user.otp = {
      emailOtp: otpCode,
      phoneOtp: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    }
    await user.save()

    console.log(`\n📲 [OTP DISPATCHER] Sent 6-Digit OTP [ ${otpCode} ] to Email (${user.email}) & Phone (${user.phone || 'N/A'})`)
    res.json({ message: `Verification OTP sent to ${user.email} and ${user.phone || 'Phone'}. Use OTP: ${otpCode}`, demoOtp: otpCode })
  } catch (error) { next(error) }
})

// OTP: Verify OTP
router.post('/verify-otp', requireAuth, async (req, res, next) => {
  try {
    const { otp } = req.body
    if (!otp) return res.status(400).json({ message: 'OTP is required.' })

    const user = await User.findById(req.user._id)
    if (!user || !user.otp?.emailOtp) return res.status(400).json({ message: 'No active OTP request found. Please click Send OTP.' })

    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' })
    }

    if (user.otp.emailOtp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' })
    }

    user.phoneVerified = true
    user.emailVerified = true
    user.otp = undefined
    await user.save()

    res.json({ message: 'Phone & Email verified successfully! ✅', user: safeUser(user) })
  } catch (error) { next(error) }
})

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, email, phone, newPassword } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (name?.trim()) user.name = name.trim()
    if (phone?.trim()) user.phone = phone.trim()
    if (email?.trim() && email.toLowerCase() !== user.email) {
      if (await User.exists({ email: email.toLowerCase() })) {
        return res.status(409).json({ message: 'Email address is already in use.' })
      }
      user.email = email.toLowerCase()
      user.emailVerified = false
    }
    if (newPassword) {
      if (!strong(newPassword)) {
        return res.status(400).json({ message: 'Password must contain at least 8 characters, an uppercase letter, and a number.' })
      }
      user.password = await bcrypt.hash(newPassword, 12)
    }

    await user.save()
    res.json({ message: 'Profile updated successfully.', user: safeUser(user) })
  } catch (error) { next(error) }
})

export default router
