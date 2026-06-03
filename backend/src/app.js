import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import nodeRoutes from './routes/nodes.js'
import trackRoutes from './routes/tracks.js'
import uploadRoutes from './routes/upload.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

app.use('/api/auth', authRoutes)
app.use('/api/nodes', nodeRoutes)
app.use('/api/tracks', trackRoutes)
app.use('/api/upload', uploadRoutes)

export default app