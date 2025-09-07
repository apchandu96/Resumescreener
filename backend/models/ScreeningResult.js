import mongoose from 'mongoose'
const ScreeningResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole' },
  score: Number,
  summary: String,
  reasons: [String],
  flags: [String],
  createdAt: { type: Date, default: Date.now }
})
export default mongoose.model('ScreeningResult', ScreeningResultSchema)