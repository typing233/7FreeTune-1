import { create } from 'zustand'
import { QueueItem, Track, RepeatMode } from '../types'

let queueIdCounter = 0
function generateQueueId(): string {
  return `q_${Date.now()}_${++queueIdCounter}`
}

interface QueueState {
  items: QueueItem[]
  currentIndex: number
  repeatMode: RepeatMode
  shuffle: boolean

  addTrack: (track: Track) => void
  addTracks: (tracks: Track[]) => void
  addTrackNext: (track: Track) => void
  removeTrack: (queueId: string) => void
  reorderTracks: (fromIndex: number, toIndex: number) => void
  playIndex: (index: number) => void
  next: () => boolean
  prev: () => void
  clear: () => void
  shuffleQueue: () => void
  setRepeatMode: (mode: RepeatMode) => void
  toggleShuffle: () => void
  setItems: (items: QueueItem[]) => void
}

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  currentIndex: -1,
  repeatMode: 'none',
  shuffle: false,

  addTrack: (track) => set((state) => {
    const item: QueueItem = { ...track, queueId: generateQueueId() }
    const newItems = [...state.items, item]
    const newIndex = state.currentIndex === -1 ? 0 : state.currentIndex
    return { items: newItems, currentIndex: newIndex }
  }),

  addTracks: (tracks) => set((state) => {
    const newItems = tracks.map((t) => ({ ...t, queueId: generateQueueId() }))
    const combined = [...state.items, ...newItems]
    const newIndex = state.currentIndex === -1 ? 0 : state.currentIndex
    return { items: combined, currentIndex: newIndex }
  }),

  addTrackNext: (track) => set((state) => {
    const item: QueueItem = { ...track, queueId: generateQueueId() }
    const insertAt = state.currentIndex + 1
    const newItems = [...state.items]
    newItems.splice(insertAt, 0, item)
    return { items: newItems }
  }),

  removeTrack: (queueId) => set((state) => {
    const index = state.items.findIndex((i) => i.queueId === queueId)
    if (index === -1) return state
    const newItems = state.items.filter((i) => i.queueId !== queueId)
    let newIndex = state.currentIndex
    if (index < state.currentIndex) {
      newIndex--
    } else if (index === state.currentIndex) {
      newIndex = Math.min(newIndex, newItems.length - 1)
    }
    return { items: newItems, currentIndex: newIndex }
  }),

  reorderTracks: (fromIndex, toIndex) => set((state) => {
    const newItems = [...state.items]
    const [moved] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, moved)

    let newIndex = state.currentIndex
    if (state.currentIndex === fromIndex) {
      newIndex = toIndex
    } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
      newIndex--
    } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
      newIndex++
    }
    return { items: newItems, currentIndex: newIndex }
  }),

  playIndex: (index) => set({ currentIndex: index }),

  next: () => {
    const state = get()
    const { items, currentIndex, repeatMode, shuffle } = state

    if (items.length === 0) return false

    if (repeatMode === 'one') {
      return true
    }

    let nextIndex: number
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * items.length)
    } else {
      nextIndex = currentIndex + 1
    }

    if (nextIndex >= items.length) {
      if (repeatMode === 'all') {
        set({ currentIndex: 0 })
        return true
      }
      return false
    }

    set({ currentIndex: nextIndex })
    return true
  },

  prev: () => set((state) => {
    if (state.items.length === 0) return state
    const newIndex = state.currentIndex > 0 ? state.currentIndex - 1 : state.items.length - 1
    return { currentIndex: newIndex }
  }),

  clear: () => set({ items: [], currentIndex: -1 }),

  shuffleQueue: () => set((state) => {
    if (state.items.length <= 1) return state
    const currentTrack = state.items[state.currentIndex]
    const otherItems = state.items.filter((_, i) => i !== state.currentIndex)
    for (let i = otherItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]]
    }
    const newItems = currentTrack ? [currentTrack, ...otherItems] : otherItems
    return { items: newItems, currentIndex: currentTrack ? 0 : -1 }
  }),

  setRepeatMode: (mode) => set({ repeatMode: mode }),
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  setItems: (items) => set({ items })
}))
