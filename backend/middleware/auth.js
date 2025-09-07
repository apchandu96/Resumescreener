import jwt from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'

export function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return res.status(401).send('No token')
  const token = header.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.id
    next()
  } catch (e) {
    return res.status(401).send('Invalid token')
  }
}
