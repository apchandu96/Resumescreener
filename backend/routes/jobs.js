// backend/routes/jobs.js
import express from 'express'
import geoip from 'geoip-lite'
import fetch from 'node-fetch'

const router = express.Router()

// Helper: build Reed search URL with params (only include provided keys)
function buildReedURL(params = {}) {
  const u = new URL('https://www.reed.co.uk/api/1.0/search')
  // Map our query keys to Reed param names
  const map = {
    keywords: 'keywords',
    locationName: 'locationName',
    distanceFromLocation: 'distanceFromLocation',
    permanent: 'permanent',
    contract: 'contract',
    temp: 'temp',
    partTime: 'partTime',
    fullTime: 'fullTime',
    minimumSalary: 'minimumSalary',
    maximumSalary: 'maximumSalary',
    postedByRecruitmentAgency: 'postedByRecruitmentAgency',
    postedByDirectEmployer: 'postedByDirectEmployer',
    resultsToTake: 'resultsToTake',
    resultsToSkip: 'resultsToSkip',
    employerId: 'employerId',
    employerProfileId: 'employerProfileId',
  }
  Object.entries(map).forEach(([k, rk]) => {
    const v = params[k]
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(rk, v)
  })
  return u.toString()
}

// GET /api/jobs/whereami  -> derive rough location from IP
router.get('/whereami', (req, res) => {
  try {
    // Node/Express may set req.ip like "::ffff:127.0.0.1" in local dev
    const rawIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').trim()
    const ip = rawIp === '::1' ? '127.0.0.1' : rawIp.replace('::ffff:', '')
    const geo = geoip.lookup(ip) || null
    // Minimal object; keep it simple
    res.json({
      ip,
      geo: geo ? {
        city: geo.city,
        region: geo.region,
        country: geo.country,
        ll: geo.ll, // [lat, lon]
      } : null
    })
  } catch (e) {
    res.json({ ip: null, geo: null })
  }
})

// GET /api/jobs/search  (proxy to Reed)
// query params: keywords, locationName, minimumSalary, maximumSalary, fullTime, partTime, permanent, contract, temp, distanceFromLocation, resultsToTake, resultsToSkip
router.get('/search', async (req, res) => {
  try {
    const {
      keywords = '',
      locationName,
      minimumSalary,
      maximumSalary,
      fullTime,
      partTime,
      permanent,
      contract,
      temp,
      distanceFromLocation = 10,
      resultsToTake = 20,
      resultsToSkip = 0
    } = req.query

    // Default location from IP, if none provided
    let loc = locationName
    if (!loc) {
      const rawIp = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').trim()
      const ip = rawIp === '::1' ? '127.0.0.1' : rawIp.replace('::ffff:', '')
      const geo = geoip.lookup(ip)
      // Use city if present; fallback London
      loc = geo?.city || 'London'
    }

    const url = buildReedURL({
      keywords,
      locationName: loc,
      minimumSalary,
      maximumSalary,
      fullTime,
      partTime,
      permanent,
      contract,
      temp,
      distanceFromLocation,
      resultsToTake: Math.min(Number(resultsToTake) || 20, 100),
      resultsToSkip: Number(resultsToSkip) || 0
    })

    // Reed auth: API key as Basic Auth username, blank password
    const key = process.env.REED_API_KEY
    if (!key) return res.status(500).send('REED_API_KEY missing')
    const authHeader = 'Basic ' + Buffer.from(`${key}:`).toString('base64')

    const r = await fetch(url, { headers: { Authorization: authHeader, 'User-Agent': 'ResumeScreener/1.0' } })
    if (!r.ok) {
      const text = await r.text().catch(()=>null)
      return res.status(r.status).json({ error: 'Reed upstream error', details: text })
    }
    const data = await r.json()
    console.log(res.json(data));
    res.json(data)
  } catch (e) {
    console.error('Job search failed:', e)
    res.status(500).json({ error: 'Job search failed' })
  }
})

export default router
