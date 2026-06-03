'use client'

import { useState } from 'react'
import api from '@/lib/api'

interface Props {
  onClose: () => void
  onUploaded: () => void
}

export default function UploadTrackModal({ onClose, onUploaded }: Props) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')

  const handleUpload = async () => {
    if (!title.trim()) return setError('Title is required')
    if (!file) return setError('Please select an audio file')

    setLoading(true)
    setError('')
    setProgress('Uploading...')

    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)

    try {
      await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProgress('Done!')
      onUploaded()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">Upload Track</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-indigo-500"
            placeholder="Track title"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Audio File</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 text-sm"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {progress && <p className="text-indigo-400 text-sm">{progress}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}