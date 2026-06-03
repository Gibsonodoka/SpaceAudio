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
  const isOnline = node.status === 'online'
  const isPlaying = node.playback?.action === 'play'
  const isPaused = node.playback?.action === 'pause'

  const sendCommand = (command: string, payload?: object) => {
    socket.emit('cmd_node', { nodeId: node.id, command, payload: payload || {} })
  }

  return (
    <div className={`bg-gray-900 rounded-2xl border p-5 space-y-4 transition-all ${
      isPlaying
        ? 'border-indigo-500/60 shadow-lg shadow-indigo-500/10'
        : isOnline
        ? 'border-indigo-500/20'
        : 'border-gray-800'
    }`}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold">{node.name}</h3>
          <p className="text-gray-500 text-sm">{node.location || 'No location'}</p>
        </div>
        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
          isOnline
            ? 'bg-green-500/10 text-green-400'
            : 'bg-gray-800 text-gray-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
          }`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Now playing strip */}
      <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2 transition-all ${
        isPlaying
          ? 'bg-indigo-600/15 border border-indigo-500/20'
          : isPaused
          ? 'bg-yellow-500/10 border border-yellow-500/20'
          : 'bg-gray-800/50 border border-gray-700/30'
      }`}>
        <span className="text-base">
          {isPlaying ? '🎵' : isPaused ? '⏸' : '•'}
        </span>
        <p className={`text-xs truncate flex-1 ${
          isPlaying ? 'text-indigo-300' : isPaused ? 'text-yellow-300' : 'text-gray-600'
        }`}>
          {isPlaying
            ? (node.playback?.trackTitle || 'Playing...')
            : isPaused
            ? (node.playback?.trackTitle || 'Paused')
            : 'Idle'}
        </p>
        {isPlaying && (
          <span className="flex gap-0.5">
            {[1,2,3].map(i => (
              <span key={i} className="w-0.5 bg-indigo-400 rounded-full animate-pulse"
                style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.15}s` }} />
            ))}
          </span>
        )}
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
          <option key={t.id} value={JSON.stringify({ url: t.file_url, title: t.title })}>
            {t.title}
          </option>
        ))}
      </select>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const sel = document.getElementById(`track-${node.id}`) as HTMLSelectElement
            if (!sel?.value) return
            const { url, title } = JSON.parse(sel.value)
            sendCommand('play', { url, trackTitle: title })
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

      {/* Volume */}
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