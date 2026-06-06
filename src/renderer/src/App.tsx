import { useEffect } from 'react'
import { TopBar } from './components/layout/TopBar'
import { BottomBar } from './components/layout/BottomBar'
import { MainContent } from './components/layout/MainContent'
import { Sidebar } from './components/layout/Sidebar'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { usePlayerStore } from './stores/playerStore'
import { useQueueStore } from './stores/queueStore'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

function AppInner() {
  const { togglePlay } = useAudioPlayer()
  const { error } = usePlayerStore()
  const { items, currentIndex } = useQueueStore()

  useEffect(() => {
    window.api.getVolume().then((vol) => {
      usePlayerStore.getState().setVolume(vol)
    })

    window.api.getSavedQueue().then((savedQueue) => {
      if (savedQueue.length > 0) {
        useQueueStore.getState().addTracks(savedQueue)
      }
    })
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error, { duration: 3000 })
    }
  }, [error])

  // Smart recommendations: when queue is about to run out
  useEffect(() => {
    const remaining = items.length - currentIndex - 1
    if (remaining <= 1 && items.length > 0 && currentIndex >= 0) {
      const currentTrack = items[currentIndex]
      if (currentTrack) {
        window.api.getRecommendations(currentTrack.videoId).then((recs) => {
          const existingIds = new Set(items.map((i) => i.videoId))
          const newRecs = recs.filter((r) => !existingIds.has(r.videoId)).slice(0, 5)
          if (newRecs.length > 0) {
            useQueueStore.getState().addTracks(
              newRecs.map((r) => ({ ...r, isRecommendation: true } as any))
            )
          }
        }).catch(() => {})
      }
    }
  }, [currentIndex, items.length])

  // Save queue on changes
  useEffect(() => {
    if (items.length > 0) {
      window.api.saveQueue(items)
    }
  }, [items])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            useQueueStore.getState().next()
          }
          break
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            useQueueStore.getState().prev()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay])

  // Tray controls
  useEffect(() => {
    const unsubPlay = window.api.onTrayTogglePlay(togglePlay)
    const unsubNext = window.api.onTrayNext(() => useQueueStore.getState().next())
    return () => { unsubPlay(); unsubNext() }
  }, [togglePlay])

  return (
    <div className="h-screen flex flex-col bg-zinc-900">
      <TopBar />
      <div className="flex-1 flex overflow-hidden">
        <MainContent />
        <Sidebar />
      </div>
      <BottomBar />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#27272a',
            color: '#e4e4e7',
            border: '1px solid #3f3f46'
          }
        }}
      />
    </div>
  )
}

export default function App() {
  return <AppInner />
}
