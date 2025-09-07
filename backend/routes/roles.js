// backend/routes/roles.js
import express from 'express'
import { auth } from '../middleware/auth.js'
import JobRole from '../models/JobRole.js'
import { extractSkillsLLM } from '../utils/llm.js'

const router = express.Router()

// Extract-only (preview) — no save
router.post('/extract', auth, async (req, res) => {
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
})

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

export default router
