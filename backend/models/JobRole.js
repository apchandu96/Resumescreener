import mongoose from 'mongoose'

const JobRoleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: String,
  mustHaveSkills: [String],
  goodToHaveSkills: [String],
  createdAt: { type: Date, default: Date.now }
})
export default mongoose.model('JobRole', JobRoleSchema)

