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
  const { token, user, setAuth, updateNodeStatus } = useStore()

  useEffect(() => {
    // Rehydrate from localStorage
    const storedToken = localStorage.getItem('aud_token')
    const storedUser = localStorage.getItem('aud_user')

    if (!storedToken || !storedUser) {
      router.push('/login')
      return
    }

    if (!token) {
      setAuth(JSON.parse(storedUser), storedToken)
    }

    // Connect socket
    const socket = getSocket()

    socket.on('connect', () => {
      console.log('Admin socket connected')
    })

    socket.on('node_status_changed', ({ nodeId, status }) => {
      updateNodeStatus(nodeId, status)
    })

    return () => {
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