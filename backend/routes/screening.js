// backend/routes/screening.js
import express from 'express'
import { auth } from '../middleware/auth.js'
import Candidate from '../models/Candidate.js'
import JobRole from '../models/JobRole.js'
import ScreeningResult from '../models/ScreeningResult.js'
import { scoreCandidateLLM } from '../utils/llm.js'

const router = express.Router()

// Run screening
router.post('/', auth, async (req, res) => {
  try {
    const { candidateId, roleId } = req.body
    if (!candidateId || !roleId) return res.status(400).send('candidateId and roleId required')

    // make sure candidate and role belong to this user
    const cand = await Candidate.findOne({ _id: candidateId, userId: req.userId })
    const role = await JobRole.findOne({ _id: roleId, userId: req.userId })
    if (!cand || !role) return res.status(404).send('Candidate or Role not found')

    const result = await scoreCandidateLLM(cand, role)

    const saved = await ScreeningResult.create({
      userId: req.userId,   // 🔑 tie to user
      candidateId,
      roleId,
      ...result
    })

    // keep only last 3 per candidate+role for this user
    const count = await ScreeningResult.countDocuments({ userId: req.userId, candidateId, roleId })
    if (count > 3) {
      const extra = await ScreeningResult.find({ userId: req.userId, candidateId, roleId })
        .sort({ createdAt: 1 })
        .limit(count - 3)
      await ScreeningResult.deleteMany({ _id: { $in: extra.map(x => x._id) } })
    }

    res.json(saved)
  } catch (e) {
    const status = e.status || 500
    res.status(status).json({ error: e.message || 'screening failed', details: e.details || null })
  }
})

// Get last 3 screenings for a candidate
router.get('/:candidateId', auth, async (req, res) => {
  const rows = await ScreeningResult.find({
    userId: req.userId,
    candidateId: req.params.candidateId
  })
    .sort({ createdAt: -1 })
    .limit(3)

  res.json(rows)
})

export default router
