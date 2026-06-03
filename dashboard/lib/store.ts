import { create } from 'zustand'

export interface PlaybackState {
  trackId: string | null
  trackTitle: string | null
  trackUrl: string | null
  action: 'play' | 'pause' | 'stop'
}

export interface Node {
  id: string
  name: string
  status: 'online' | 'offline'
  location: string | null
  last_seen: string | null
  token: string
  created_at: string
  playback?: PlaybackState | null
}

export interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Store {
  user: User | null
  token: string | null
  nodes: Node[]
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setNodes: (nodes: Node[]) => void
  updateNodeStatus: (nodeId: string, status: 'online' | 'offline') => void
  updateNodePlayback: (nodeId: string, playback: PlaybackState | null) => void
}

export const useStore = create<Store>((set) => ({
  user: null,
  token: null,
  nodes: [],

  setAuth: (user, token) => {
    localStorage.setItem('aud_token', token)
    localStorage.setItem('aud_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('aud_token')
    localStorage.removeItem('aud_user')
    set({ user: null, token: null })
  },

  setNodes: (nodes) => set({ nodes }),

  updateNodeStatus: (nodeId, status) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, status, last_seen: new Date().toISOString() }
          : n
      ),
    })),

  updateNodePlayback: (nodeId, playback) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, playback } : n
      ),
    })),
}))