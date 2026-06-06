import { useEffect } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useQueueStore } from '../stores/queueStore'
import { audioManager } from '../lib/audioManager'

let initialized = false

export function useAudioPlayer() {
  const { volume, isMuted } = usePlayerStore()
  const { items, currentIndex } = useQueueStore()

  useEffect(() => {
    audioManager.setVolume(isMuted ? 0 : volume)
  }, [volume, isMuted])

  useEffect(() => {
    if (initialized) return
    initialized = true

    window.api.getVolume().then((vol) => {
      usePlayerStore.getState().setVolume(vol)
      audioManager.setVolume(vol)
    })
  }, [])

  useEffect(() => {
    const track = currentIndex >= 0 && currentIndex < items.length
      ? items[currentIndex]
      : null

    if (!track) {
      if (usePlayerStore.getState().currentTrack) {
        audioManager.stop()
        usePlayerStore.getState().setCurrentTrack(null)
      }
      return
    }

    if (track.videoId === audioManager.getCurrentVideoId()) return

    usePlayerStore.getState().setCurrentTrack(track)
    window.api.addToHistory(track)
    audioManager.loadTrack(track.videoId)
  }, [currentIndex, items])

  return {
    togglePlay: () => audioManager.togglePlay(),
    seek: (time: number) => audioManager.seek(time),
    changeVolume: (vol: number) => {
      usePlayerStore.getState().setVolume(vol)
      audioManager.setVolume(vol)
      window.api.setVolume(vol)
    }
  }
}
