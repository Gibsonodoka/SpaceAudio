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
  const { token, setAuth, setNodes, updateNodeStatus } = useStore()

  useEffect(() => {
    const storedToken = localStorage.getItem('aud_token')
    const storedUser = localStorage.getItem('aud_user')

    if (!storedToken || !storedUser) {
      router.push('/login')
      return
    }

    if (!token) {
      setAuth(JSON.parse(storedUser), storedToken)
    }

    // Pass token explicitly so socket connects with fresh token
    const socket = getSocket(storedToken)

    socket.on('connect', () => {
      console.log('Admin socket connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connect error:', err.message)
    })

    // Full snapshot when admin connects
    socket.on('nodes_snapshot', (nodes) => {
      console.log('Received nodes snapshot:', nodes)
      setNodes(nodes)
    })

    // Individual status updates
    socket.on('node_status_changed', ({ nodeId, status, name, last_seen }) => {
      console.log('Node status changed:', nodeId, status)
      updateNodeStatus(nodeId, status)
    })

    return () => {
      socket.off('connect')
      socket.off('connect_error')
      socket.off('nodes_snapshot')
      socket.off('node_status_changed')
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}