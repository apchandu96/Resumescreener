// backend/routes/screening.js
import express from 'express'
import { auth } from '../middleware/auth.js'
import Candidate from '../models/Candidate.js'
import JobRole from '../models/JobRole.js'
import ScreeningResult from '../models/ScreeningResult.js'
import { rateLimitSimple } from '../middleware/rateLimitSimple.js'
import { screenCandidateCombined } from '../utils/llm.js'

const router = express.Router()

/**
 * POST /screening
 * Body: { candidateId, roleId }
 * Runs screening and returns the combined payload:
 * {
 *   score, summary, flags,
 *   matched_must, missing_must,
 *   matched_good, missing_good,
 *   cv_suggestions, role_specific_gaps,
 *   ats: { score, issues, suggestions, signals:{} }
 * }
 */
router.post(
  '/',
  auth,
  rateLimitSimple({ windowMs: 60_000, max: 10 }), // LLM-heavy
  async (req, res) => {
    try {
      const { candidateId, roleId } = req.body
      if (!candidateId || !roleId) return res.status(400).send('candidateId and roleId required')

      // Ensure candidate & role belong to this user
      const cand = await Candidate.findOne({ _id: candidateId, userId: req.userId })
      const role = await JobRole.findOne({ _id: roleId, userId: req.userId })
      if (!cand || !role) return res.status(404).send('Candidate or Role not found')

      // Build combined payload (fit + ATS + detailed breakdown)
      const payload = await screenCandidateCombined(cand, role)

      // Upsert: keep only the latest for (userId, candidateId, roleId)
      await ScreeningResult.updateOne(
        { userId: req.userId, candidateId, roleId },
        {
          $set: {
            lastScore: payload.score ?? 0,
            lastPayload: payload,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )

      return res.json(payload)
    } catch (e) {
      const status = e.status || 500
      return res.status(status).json({
        error: e.message || 'screening failed',
        details: e.details || null
      })
    }
  }
)

/**
 * GET /screening/:candidateId?roleId=...
 * - If roleId provided: returns the latest record (lastPayload) for that role.
 * - Else: returns an array of latest summaries for all roles for that candidate.
 */
router.get('/:candidateId', auth, async (req, res) => {
  try {
    const { candidateId } = req.params
    const { roleId } = req.query

    if (roleId) {
      const doc = await ScreeningResult.findOne({
        userId: req.userId,
        candidateId,
        roleId
      })
      if (!doc) return res.json(null)
      return res.json({
        lastScore: doc.lastScore ?? 0,
        lastPayload: doc.lastPayload || {},
        updatedAt: doc.updatedAt
      })
    }

    // Without roleId: list the latest snapshot per role (lightweight)
    const rows = await ScreeningResult.find({
      userId: req.userId,
      candidateId
    }).sort({ updatedAt: -1 })

    const data = rows.map(r => ({
      roleId: r.roleId,
      lastScore: r.lastScore ?? 0,
      updatedAt: r.updatedAt,
      summary: r?.lastPayload?.summary || '',
      atsScore: r?.lastPayload?.ats?.score ?? null
    }))

    return res.json(data)
  } catch (e) {
    const status = e.status || 500
    return res.status(status).json({
      error: e.message || 'fetch failed',
      details: e.details || null
    })
  }
})

export default router
