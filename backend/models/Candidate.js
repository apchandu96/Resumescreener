import mongoose from 'mongoose'
const CandidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: String,
  email: String,
  phone: String,
  yearsExperience: Number,
  resumeText: String,
  createdAt: { type: Date, default: Date.now }
})
export default mongoose.model('Candidate', CandidateSchema)