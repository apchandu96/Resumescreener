// backend/routes/precheck.js
import express from 'express'
import Candidate from '../models/Candidate.js'
import Role from '../models/JobRole.js'   // ensure you have a Role model
import { precheckResumeAgainstRole } from '../utils/precheck.js'
import { auth } from '../middleware/auth.js' // your JWT middleware that sets req.userId

const router = express.Router()

// POST /api/precheck  { candidateId, roleId }
router.post('/', auth, async (req, res) => {
  try {
    const { candidateId, roleId } = req.body || {}
    if (!candidateId || !roleId) return res.status(400).send('candidateId and roleId are required')

    const [cand, role] = await Promise.all([
      Candidate.findOne({ _id: candidateId, userId: req.userId }),
      Role.findOne({ _id: roleId, userId: req.userId }),
    ])
    if (!cand) return res.status(404).send('Candidate not found')
    if (!role) return res.status(404).send('Role not found')

    const result = precheckResumeAgainstRole(
      { resumeText: cand.resumeText || '', yearsExperience: cand.yearsExperience || 0 },
      role
    )
    res.json({ candidateId, roleId, ...result })
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message || 'Precheck failed')
  }
})

export default router
