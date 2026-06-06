import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '../stores/playerStore'
import { useQueueStore } from '../stores/queueStore'
import { Track } from '../types'

const audio = new Audio()
audio.preload = 'auto'

export function useAudioPlayer() {
  const {
    currentTrack, isPlaying, volume, isMuted, isLoading,
    setCurrentTrack, setIsPlaying, setCurrentTime, setDuration,
    setVolume, setIsLoading, setError
  } = usePlayerStore()

  const { items, currentIndex, next } = useQueueStore()
  const isLoadingRef = useRef(false)
  const currentVideoIdRef = useRef<string | null>(null)

  useEffect(() => {
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      const hasNext = next()
      if (!hasNext) {
        setIsPlaying(false)
      }
    }
    const onError = () => {
      if (audio.src) {
        setError('Playback failed. Skipping...')
        setTimeout(() => {
          const hasNext = next()
          if (!hasNext) setIsPlaying(false)
        }, 1500)
      }
    }
    const onCanPlay = () => {
      setIsLoading(false)
      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {})
      }
    }
    const onWaiting = () => setIsLoading(true)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('waiting', onWaiting)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('waiting', onWaiting)
    }
  }, [])

  useEffect(() => {
    const track = currentIndex >= 0 && currentIndex < items.length
      ? items[currentIndex]
      : null

    if (!track) {
      if (currentTrack) {
        audio.pause()
        audio.src = ''
        setCurrentTrack(null)
        setIsPlaying(false)
      }
      return
    }

    if (track.videoId === currentVideoIdRef.current) return

    currentVideoIdRef.current = track.videoId
    setCurrentTrack(track)
    setIsLoading(true)
    setError(null)
    isLoadingRef.current = true

    window.api.addToHistory(track)

    window.api.getAudioUrl(track.videoId).then((url) => {
      if (currentVideoIdRef.current !== track.videoId) return
      audio.src = url
      audio.play().then(() => {
        setIsPlaying(true)
        setIsLoading(false)
        isLoadingRef.current = false
      }).catch(() => {
        setIsLoading(false)
        isLoadingRef.current = false
      })
    }).catch((err) => {
      if (currentVideoIdRef.current !== track.videoId) return
      setError(`Failed to load: ${err.message}`)
      setIsLoading(false)
      isLoadingRef.current = false
      setTimeout(() => next(), 2000)
    })
  }, [currentIndex, items])

  const togglePlay = useCallback(() => {
    if (!currentTrack) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [currentTrack, isPlaying])

  const seek = useCallback((time: number) => {
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const changeVolume = useCallback((vol: number) => {
    setVolume(vol)
    window.api.setVolume(vol)
  }, [])

  return { togglePlay, seek, changeVolume, audio }
}
