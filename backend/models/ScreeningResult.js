import mongoose from 'mongoose'

const ScreeningResultSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  roleId:      { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },

  // Keep only the last score for this (user, candidate, role)
  lastScore:   { type: Number, default: 0 },

  // Allow storing the last combined payload if you want to quickly rehydrate UI (optional)
  lastPayload: { type: Object, default: {} },

  updatedAt:   { type: Date, default: Date.now }
})

// Ensure uniqueness so upserts are easy
ScreeningResultSchema.index({ userId: 1, candidateId: 1, roleId: 1 }, { unique: true })

export default mongoose.model('ScreeningResult', ScreeningResultSchema)
