import { create } from 'zustand'
import { Track } from '../types'

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isLoading: boolean
  error: string | null

  setCurrentTrack: (track: Track | null) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLoading: false,
  error: null,

  setCurrentTrack: (track) => set({ currentTrack: track, error: null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: false }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}))
