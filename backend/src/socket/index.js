import jwt from 'jsonwebtoken'
import supabase from '../config/supabase.js'

const connectedNodes = new Map()
const connectedAdmins = new Set()

export const initSocket = (io) => {

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
    const { type } = socket.decoded

    // --- NODE CONNECTED ---
    if (type === 'node') {
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

      // Mark online immediately
      await supabase
        .from('nodes')
        .update({ status: 'online', last_seen: new Date().toISOString() })
        .eq('id', node.id)

      console.log(`Node connected: ${node.name}`)

      // Notify ALL current admin sockets directly
      for (const adminSocketId of connectedAdmins) {
        io.to(adminSocketId).emit('node_status_changed', {
          nodeId: node.id,
          name: node.name,
          status: 'online',
          last_seen: new Date().toISOString()
        })
      }

      socket.join('nodes')

      // Heartbeat
      socket.on('heartbeat', async () => {
        const now = new Date().toISOString()
        await supabase
          .from('nodes')
          .update({ last_seen: now })
          .eq('id', node.id)
        socket.emit('heartbeat_ack')
      })

      socket.on('playback_started', async ({ trackId }) => {
        await supabase.from('playback_logs').insert({
          node_id: node.id,
          track_id: trackId,
          action: 'play'
        })
        for (const adminSocketId of connectedAdmins) {
          io.to(adminSocketId).emit('node_playback_update', {
            nodeId: node.id,
            action: 'play',
            trackId
          })
        }
      })

      socket.on('playback_stopped', async ({ trackId }) => {
        await supabase.from('playback_logs').insert({
          node_id: node.id,
          track_id: trackId,
          action: 'stop'
        })
        for (const adminSocketId of connectedAdmins) {
          io.to(adminSocketId).emit('node_playback_update', {
            nodeId: node.id,
            action: 'stop',
            trackId
          })
        }
      })

      socket.on('error_report', (data) => {
        console.error(`Node error [${node.name}]:`, data)
        for (const adminSocketId of connectedAdmins) {
          io.to(adminSocketId).emit('node_error', { nodeId: node.id, ...data })
        }
      })

      socket.on('disconnect', async (reason) => {
        connectedNodes.delete(node.id)
        console.log(`Node disconnected: ${node.name} — ${reason}`)

        await supabase
          .from('nodes')
          .update({ status: 'offline' })
          .eq('id', node.id)

        for (const adminSocketId of connectedAdmins) {
          io.to(adminSocketId).emit('node_status_changed', {
            nodeId: node.id,
            name: node.name,
            status: 'offline'
          })
        }
      })
    }

    // --- ADMIN CONNECTED ---
    if (type === 'admin') {
      connectedAdmins.add(socket.id)
      socket.join('admins')
      console.log(`Admin connected: ${socket.decoded.email}`)

      // Immediately send current state of all nodes
      const { data: allNodes } = await supabase
        .from('nodes')
        .select('id, name, status, last_seen, location')

      if (allNodes) {
        socket.emit('nodes_snapshot', allNodes)
      }

      socket.on('cmd_all', ({ command, payload }) => {
        io.to('nodes').emit('command', { command, payload })
        console.log(`CMD ALL: ${command}`)
      })

      socket.on('cmd_node', ({ nodeId, command, payload }) => {
        const targetSocketId = connectedNodes.get(nodeId)
        if (targetSocketId) {
          io.to(targetSocketId).emit('command', { command, payload })
          console.log(`CMD NODE [${nodeId}]: ${command}`)
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