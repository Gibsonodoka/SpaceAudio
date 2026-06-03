'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import NodeCard from '@/components/NodeCard'

interface Track {
  id: string
  title: string
  file_url: string
}

export default function NodesPage() {
  const { nodes, setNodes, updateNodeStatus } = useStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, tracksRes] = await Promise.all([
          api.get('/api/nodes'),
          api.get('/api/tracks'),
        ])
        setNodes(nodesRes.data)
        setTracks(tracksRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    const socket = getSocket()
    socket.on('node_status_changed', ({ nodeId, status }) => {
      updateNodeStatus(nodeId, status)
    })

    return () => { socket.off('node_status_changed') }
  }, [])

  const sendToAll = (command: string) => {
    const socket = getSocket()
    socket.emit('cmd_all', { command, payload: {} })
  }

  const onlineCount = nodes.filter((n) => n.status === 'online').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Nodes</h2>
          <p className="text-gray-400 text-sm mt-1">
            {onlineCount} of {nodes.length} online
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => sendToAll('play')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            ▶ Play All
          </button>
          <button onClick={() => sendToAll('pause')}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            ⏸ Pause All
          </button>
          <button onClick={() => sendToAll('stop')}
            className="bg-red-600/80 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-lg transition-colors">
            ⏹ Stop All
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && nodes.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">📡</p>
          <p>No nodes registered yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} tracks={tracks} />
        ))}
      </div>
    </div>
  )
}