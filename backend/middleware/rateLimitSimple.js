// middleware/rateLimitSimple.js
const buckets = new Map(); // ip -> { count, ts }
export function rateLimitSimple({ windowMs = 60_000, max = 20 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const now = Date.now()
    const b = buckets.get(ip) || { count: 0, ts: now }
    if (now - b.ts > windowMs) { b.count = 0; b.ts = now }
    b.count++
    buckets.set(ip, b)
    if (b.count > max) return res.status(429).send('Too many requests')
    next()
  }
}
