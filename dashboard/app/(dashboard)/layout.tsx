'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Sidebar from '@/components/Sidebar'
import { getSocket } from '@/lib/socket'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { token, setAuth, setNodes, updateNodeStatus, updateNodePlayback } = useStore()

  useEffect(() => {
    const storedToken = localStorage.getItem('aud_token')
    const storedUser = localStorage.getItem('aud_user')

    if (!storedToken || !storedUser) {
      router.push('/login')
      return
    }

    if (!token) setAuth(JSON.parse(storedUser), storedToken)

    const socket = getSocket(storedToken)

    socket.on('connect', () => console.log('Admin socket connected'))
    socket.on('connect_error', (err) => console.error('Socket error:', err.message))

    socket.on('nodes_snapshot', (nodes) => setNodes(nodes))

    socket.on('node_status_changed', ({ nodeId, status }) => {
      updateNodeStatus(nodeId, status)
    })

    socket.on('node_playback_update', ({ nodeId, action, trackId, trackTitle, trackUrl }) => {
      updateNodePlayback(nodeId, action === 'stop' ? null : { action, trackId, trackTitle, trackUrl })
    })

    return () => {
      socket.off('connect')
      socket.off('connect_error')
      socket.off('nodes_snapshot')
      socket.off('node_status_changed')
      socket.off('node_playback_update')
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}