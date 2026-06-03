import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'

const connectedNodes = new Map() // nodeId -> socketId
const connectedAdmins = new Set()

export const initSocket = (io) => {

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('No token'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.decoded = decoded
      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', async (socket) => {
    const { type, id, nodeId } = socket.decoded

    // --- NODE CONNECTED ---
    if (type === 'node') {
      // Find node in DB by token
      const { data: node } = await supabase
        .from('nodes')
        .select('*')
        .eq('token', socket.handshake.auth.token)
        .single()

      if (!node) {
        socket.disconnect()
        return
      }

      socket.nodeId = node.id
      socket.nodeName = node.name
      connectedNodes.set(node.id, socket.id)

      // Mark node online
      await supabase
        .from('nodes')
        .update({ status: 'online', last_seen: new Date().toISOString() })
        .eq('id', node.id)

      console.log(`Node connected: ${node.name} (${node.id})`)

      // Notify all admins
      io.to('admins').emit('node_status_changed', {
        nodeId: node.id,
        name: node.name,
        status: 'online'
      })

      socket.join('nodes')

      // Heartbeat from node
      socket.on('heartbeat', async () => {
        await supabase
          .from('nodes')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', node.id)

        socket.emit('heartbeat_ack')
      })

      // Node reports playback started
      socket.on('playback_started', async ({ trackId }) => {
        await supabase.from('playback_logs').insert({
          node_id: node.id,
          track_id: trackId,
          action: 'play'
        })
        io.to('admins').emit('node_playback_update', {
          nodeId: node.id,
          action: 'play',
          trackId
        })
      })

      // Node reports playback stopped
      socket.on('playback_stopped', async ({ trackId }) => {
        await supabase.from('playback_logs').insert({
          node_id: node.id,
          track_id: trackId,
          action: 'stop'
        })
        io.to('admins').emit('node_playback_update', {
          nodeId: node.id,
          action: 'stop',
          trackId
        })
      })

      // Node reports error
      socket.on('error_report', (data) => {
        console.error(`Node error [${node.name}]:`, data)
        io.to('admins').emit('node_error', { nodeId: node.id, ...data })
      })

      // Node disconnected
      socket.on('disconnect', async () => {
        connectedNodes.delete(node.id)
        await supabase
          .from('nodes')
          .update({ status: 'offline' })
          .eq('id', node.id)

        console.log(`Node disconnected: ${node.name}`)
        io.to('admins').emit('node_status_changed', {
          nodeId: node.id,
          name: node.name,
          status: 'offline'
        })
      })
    }

    // --- ADMIN CONNECTED ---
    if (type === 'admin') {
      socket.join('admins')
      connectedAdmins.add(socket.id)
      console.log(`Admin connected: ${socket.decoded.email}`)

      // Admin sends command to ALL nodes
      socket.on('cmd_all', ({ command, payload }) => {
        io.to('nodes').emit('command', { command, payload })
        console.log(`CMD ALL: ${command}`, payload)
      })

      // Admin sends command to ONE node
      socket.on('cmd_node', ({ nodeId, command, payload }) => {
        const targetSocketId = connectedNodes.get(nodeId)
        if (targetSocketId) {
          io.to(targetSocketId).emit('command', { command, payload })
          console.log(`CMD NODE [${nodeId}]: ${command}`, payload)
        }
      })

      socket.on('disconnect', () => {
        connectedAdmins.delete(socket.id)
        console.log(`Admin disconnected: ${socket.decoded.email}`)
      })
    }
  })
}

export { connectedNodes }