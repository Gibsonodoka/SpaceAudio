'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { useStore } from '@/lib/store'
import { getSocket } from '@/lib/socket'
import NodeCard from '@/components/NodeCard'
import CreateNodeModal from '@/components/CreateNodeModal'

interface Track {
  id: string
  title: string
  file_url: string
}

export default function NodesPage() {
  const { nodes, setNodes, updateNodeStatus } = useStore()
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTrackUrl, setSelectedTrackUrl] = useState('')

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

  useEffect(() => {
    fetchData()

    const socket = getSocket()
    socket.on('node_status_changed', ({ nodeId, status }) => {
      updateNodeStatus(nodeId, status)
    })

    return () => { socket.off('node_status_changed') }
  }, [])

  const sendToAll = (command: string) => {
    const socket = getSocket()
    socket.emit('cmd_all', { command, payload: { url: selectedTrackUrl } })
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
        <button
          onClick={() => setShowCreate(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + New Node
        </button>
      </div>

      {/* Global broadcast bar */}
      {nodes.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <p className="text-gray-400 text-sm font-medium">Broadcast to all:</p>
          <select
            value={selectedTrackUrl}
            onChange={(e) => setSelectedTrackUrl(e.target.value)}
            className="flex-1 min-w-[200px] bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Select a track...</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.file_url}>{t.title}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!selectedTrackUrl) return
                sendToAll('play')
              }}
              disabled={!selectedTrackUrl || onlineCount === 0}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ▶ Play All
            </button>
            <button
              onClick={() => sendToAll('pause')}
              disabled={onlineCount === 0}
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ⏸ Pause All
            </button>
            <button
              onClick={() => sendToAll('stop')}
              disabled={onlineCount === 0}
              className="bg-red-600/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              ⏹ Stop All
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500">Loading...</p>}

      {!loading && nodes.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">📡</p>
          <p>No nodes yet. Create your first one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} tracks={tracks} />
        ))}
      </div>

      {showCreate && (
        <CreateNodeModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  )
}