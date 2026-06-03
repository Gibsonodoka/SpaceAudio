import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import app from './src/app.js'
import { initSocket } from './src/socket/index.js'

dotenv.config()

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true
})

initSocket(io)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})