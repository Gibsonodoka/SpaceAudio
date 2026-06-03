'use client'

import { Node } from '@/lib/store'
import { getSocket } from '@/lib/socket'

interface Track {
  id: string
  title: string
  file_url: string
}

interface Props {
  node: Node
  tracks: Track[]
}

export default function NodeCard({ node, tracks }: Props) {
  const socket = getSocket()

  const sendCommand = (command: string, payload?: object) => {
    socket.emit('cmd_node', { nodeId: node.id, command, payload: payload || {} })
  }

  const isOnline = node.status === 'online'

  return (
    <div className={`bg-gray-900 rounded-2xl border p-5 space-y-4 transition-all ${
      isOnline ? 'border-indigo-500/40' : 'border-gray-800'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold">{node.name}</h3>
          <p className="text-gray-500 text-sm">{node.location || 'No location'}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
          isOnline ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Track selector */}
      <select
        id={`track-${node.id}`}
        disabled={!isOnline}
        className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
        defaultValue=""
      >
        <option value="" disabled>Select a track...</option>
        {tracks.map((t) => (
          <option key={t.id} value={t.file_url}>{t.title}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const sel = document.getElementById(`track-${node.id}`) as HTMLSelectElement
            const url = sel?.value
            if (!url) return
            sendCommand('play', { url })
          }}
          disabled={!isOnline}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
        >
          ▶ Play
        </button>
        <button
          onClick={() => sendCommand('pause')}
          disabled={!isOnline}
          className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
        >
          ⏸ Pause
        </button>
        <button
          onClick={() => sendCommand('stop')}
          disabled={!isOnline}
          className="flex-1 bg-red-600/80 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm py-2 rounded-lg transition-colors"
        >
          ⏹ Stop
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Vol</span>
        <input
          type="range" min={0} max={100} defaultValue={80}
          disabled={!isOnline}
          onChange={(e) => sendCommand('set_volume', { volume: Number(e.target.value) })}
          className="flex-1 accent-indigo-500 disabled:opacity-30"
        />
      </div>
    </div>
  )
}