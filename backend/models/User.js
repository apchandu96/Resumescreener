// backend/models/User.js
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true }, // hashed
  // Forgot-password fields:
  resetToken: { type: String, default: null },
  resetExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', UserSchema)
