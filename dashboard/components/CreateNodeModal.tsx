'use client'

import { useState } from 'react'
import api from '@/lib/api'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateNodeModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdNode, setCreatedNode] = useState<{ name: string; token: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return setError('Node name is required')
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/auth/nodes/create', { name, location })
      setCreatedNode({ name: res.data.node.name, token: res.data.node.token })
      onCreated()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create node')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (!createdNode) return
    navigator.clipboard.writeText(createdNode.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md p-6 space-y-4">

        {!createdNode ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">Create Node</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Node Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Mall Food Court"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Location <span className="text-gray-600">(optional)</span></label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Ground Floor"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading ? 'Creating...' : 'Create Node'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">Node Created ✓</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-400 text-sm font-medium mb-1">{createdNode.name} is ready</p>
              <p className="text-gray-400 text-xs">Copy this token and paste it into the Flutter node app to connect this device.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Node Token</label>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                <p className="text-gray-300 text-xs break-all font-mono leading-relaxed">
                  {createdNode.token}
                </p>
              </div>
            </div>

            <button
              onClick={copyToken}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm transition-colors"
            >
              {copied ? '✓ Copied!' : 'Copy Token'}
            </button>

            <p className="text-gray-600 text-xs text-center">
              Keep this token safe — it cannot be shown again.
            </p>
          </>
        )}
      </div>
    </div>
  )
}