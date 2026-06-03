'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import UploadTrackModal from '@/components/UploadTrackModal'

interface Track {
  id: string
  title: string
  file_url: string
  size: number
  created_at: string
}

export default function TracksPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  const fetchTracks = async () => {
    try {
      const res = await api.get('/api/tracks')
      setTracks(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTracks() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this track?')) return
    await api.delete(`/api/tracks/${id}`)
    setTracks((prev) => prev.filter((t) => t.id !== id))
  }

  const formatSize = (bytes: number) => {
    if (!bytes) return '—'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Tracks</h2>
          <p className="text-gray-400 text-sm mt-1">{tracks.length} track{tracks.length !== 1 ? 's' : ''} in library</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Upload Track
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading tracks...</p>}

      {!loading && tracks.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">🎵</p>
          <p>No tracks yet. Upload your first one.</p>
        </div>
      )}

      <div className="space-y-3">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-indigo-400 flex-shrink-0">
                🎵
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{track.title}</p>
                <p className="text-gray-500 text-xs">{formatSize(track.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <audio controls src={track.file_url} className="h-8 w-48" />
              <button
                onClick={() => handleDelete(track.id)}
                className="text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showUpload && (
        <UploadTrackModal
          onClose={() => setShowUpload(false)}
          onUploaded={fetchTracks}
        />
      )}
    </div>
  )
}