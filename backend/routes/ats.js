// backend/routes/ats.js
import express from 'express'
import { auth } from '../middleware/auth.js'
import Candidate from '../models/Candidate.js'
import { runATSAudit } from '../utils/ats.js'
import { atsScoreLLM } from '../utils/llm.js'
import { rateLimitSimple } from '../middleware/rateLimitSimple.js'

const router = express.Router()

// Basic (fast, local): POST /api/ats/report
// body: { candidateId?: string, text?: string }
// Light rate limit (local only)
router.post(
  '/report',
  auth,
  rateLimitSimple({ windowMs: 60_000, max: 20 }),
  async (req, res) => {
    try {
      let { candidateId, text } = req.body || {}

      if (!text && candidateId) {
        const cand = await Candidate.findOne({ _id: candidateId, userId: req.userId })
        if (!cand) return res.status(404).send('Candidate not found')
        text = cand.resumeText || ''
      }

      if (!text) return res.status(400).send('Provide candidateId or text')

      res.json(runATSAudit(text))
    } catch (e) {
      console.error(e)
      res.status(500).send('ATS report failed')
    }
  }
)

// Deep dive (AI): POST /api/ats/score
// body: { candidateId?: string, text?: string }
// Tighter rate limit (LLM-backed)
router.post(
  '/score',
  auth,
  rateLimitSimple({ windowMs: 60_000, max: 10 }),
  async (req, res) => {
    try {
      let { candidateId, text } = req.body || {}

      if (!text && candidateId) {
        const cand = await Candidate.findOne({ _id: candidateId, userId: req.userId })
        if (!cand) return res.status(404).send('Candidate not found')
        text = cand.resumeText || ''
      }

      if (!text) return res.status(400).send('Provide candidateId or text')

      const report = await atsScoreLLM(text)
      res.json(report)
    } catch (e) {
      const status = e.status || 500
      res.status(status).json({ error: e.message || 'ATS scoring failed', details: e.details || null })
    }
  }
)

export default router
