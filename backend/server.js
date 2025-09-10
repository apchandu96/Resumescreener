import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import candidatesRouter from './routes/candidates.js'
import rolesRouter from './routes/roles.js'
import screeningRouter from './routes/screening.js'
import atsRouter from './routes/ats.js'
import authRouter from './routes/auth.js'
import precheckRoutes from './routes/precheck.js'

dotenv.config()
const app = express()
app.use(cors({ origin: ['http://localhost:5173'] }))
app.use(express.json())

app.get('/', (_, res) => res.send('OK'))

app.use('/api/candidates', candidatesRouter)
app.use('/api/roles', rolesRouter)
app.use('/api/screen', screeningRouter)
app.use('/api/ats', atsRouter)
app.use('/api/auth', authRouter)
app.use('/api/precheck', precheckRoutes)

const PORT = process.env.PORT || 3000;

//Check for health remove later
app.get('/health', (req, res) => res.status(200).send('ok'));
app.listen(PORT, '0.0.0.0', () => console.log('API listening on', PORT));


mongoose.connect(process.env.MONGO_URL).then(()=>{
  app.listen(PORT, ()=> console.log('API running on :'+PORT))
}).catch(err => {
  console.error('Mongo connection error:', err.message)
  process.exit(1)
})
