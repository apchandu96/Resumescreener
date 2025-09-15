// backend/routes/roles.js
import express from 'express'
import { auth } from '../middleware/auth.js'
import JobRole from '../models/JobRole.js'
import ScreeningResult from '../models/ScreeningResult.js'
import { extractSkillsLLM } from '../utils/llm.js'
import { rateLimitSimple } from '../middleware/rateLimitSimple.js'

const router = express.Router()

// Extract-only (preview) — no save
router.post(
  '/extract',
  auth,
  rateLimitSimple({ windowMs: 60_000, max: 10 }), // LLM call
  async (req, res) => {
    try {
      const { title, description } = req.body
      if (!title || !description) return res.status(400).send('Title and description required')

      const { must_have_skills, good_to_have_skills } = await extractSkillsLLM(title, description)
      res.json({
        mustHaveSkills: must_have_skills || [],
        goodToHaveSkills: good_to_have_skills || []
      })
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message, details: e.details || null })
    }
  }
)

// Save role
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, mustHaveSkills = [], goodToHaveSkills = [] } = req.body
    if (!title || !description) return res.status(400).send('Title and description required')

    const role = await JobRole.create({
      userId: req.userId,   // 🔑 link to logged-in user
      title,
      description,
      mustHaveSkills,
      goodToHaveSkills
    })

    res.json(role)
  } catch (e) {
    res.status(500).send(e.message || 'create role failed')
  }
})

// List roles belonging to this user
router.get('/', auth, async (req, res) => {
  const roles = await JobRole.find({ userId: req.userId }).sort({ createdAt: -1 })
  res.json(roles)
})

// Delete role + cleanup
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    // verify ownership
    const role = await JobRole.findOne({ _id: id, userId: req.userId })
    if (!role) return res.status(404).send('Role not found')

    // remove related screening snapshots
    await ScreeningResult.deleteMany({ userId: req.userId, roleId: id })

    // delete role
    await role.deleteOne()

    return res.json({ ok: true })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).send(err.message || 'Failed to delete role')
  }
})

export default router
