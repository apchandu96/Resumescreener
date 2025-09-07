// backend/routes/auth.js
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).send('Email and password required')
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).send('Email already registered')
    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, password: hash })
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (e) {
    console.error(e)
    res.status(500).send('Registration failed')
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(401).send('Invalid credentials')
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).send('Invalid credentials')
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token })
  } catch (e) {
    console.error(e)
    res.status(500).send('Login failed')
  }
})

/**
 * FORGOT PASSWORD (DEV-FRIENDLY)
 * POST /api/auth/forgot
 * body: { email }
 * - Generates a one-time token and 1h expiry, stores on user
 * - Returns { ok:true, resetToken:"..." } so you can paste it into the Reset screen
 *   In production, you would email the token instead.
 */
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).send('Email is required')

    const user = await User.findOne({ email })
    if (!user) {
      // For privacy, still say ok (prevents account enumeration)
      return res.json({ ok: true })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    user.resetToken = resetToken
    user.resetExpires = resetExpires
    await user.save()

    // In production, send an email with this token.
    res.json({ ok: true, resetToken })
  } catch (e) {
    console.error(e)
    res.status(500).send('Failed to start password reset')
  }
})

/**
 * RESET PASSWORD
 * POST /api/auth/reset
 * body: { token, password, confirmPassword }
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body
    if (!token || !password || !confirmPassword) {
      return res.status(400).send('Token, password, and confirmPassword are required')
    }
    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match')
    }

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() } // not expired
    })
    if (!user) return res.status(400).send('Invalid or expired reset token')

    user.password = await bcrypt.hash(password, 10)
    user.resetToken = null
    user.resetExpires = null
    await user.save()

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).send('Failed to reset password')
  }
})


export default router
