import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (token?: string): Socket => {
  if (socket && socket.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  const t = token || localStorage.getItem('aud_token')

  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    auth: { token: t },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}