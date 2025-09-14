import express from 'express'
import multer from 'multer'
import Candidate from '../models/Candidate.js'
import { auth } from '../middleware/auth.js'
import ScreeningResult from '../models/ScreeningResult.js'
import { extractPdfText } from '../utils/pdfParser.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/',auth, upload.single('file'), async (req, res) => {
  try {
    const { name, yearsExperience } = req.body
    if (!req.file) return res.status(400).send('PDF required (.pdf only)')
    const text = await extractPdfText(req.file.buffer)
    const cand = await Candidate.create({userId: req.userId, name, yearsExperience: Number(yearsExperience || 0), resumeText: text })
    res.json(cand)
  } catch (e) {
    console.error(e)
    res.status(500).send(e.message || 'Upload failed')
  }
})

router.get('/', auth,async (req, res) => {
  const cands = await Candidate.find({ userId: req.userId }).sort({ createdAt: -1 })
  res.json(cands)
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    // Find the candidate scoped to the user
    const cand = await Candidate.findOne({ _id: id, userId: req.userId })
    if (!cand) return res.status(404).send('Candidate not found')

    // Remove screening results referencing this candidate (latest-only schema or legacy)
    await ScreeningResult.deleteMany({ userId: req.userId, candidateId: id })

    // Finally remove candidate
    await cand.deleteOne()

    return res.json({ ok: true })
  } catch (err) {
    const status = err.status || 500
    return res.status(status).send(err.message || 'Failed to delete candidate')
  }
})

export default router
