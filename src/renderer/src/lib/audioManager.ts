import { usePlayerStore } from '../stores/playerStore'
import { useQueueStore } from '../stores/queueStore'

class AudioManager {
  private audio: HTMLAudioElement
  private currentVideoId: string | null = null
  private isHandlingEnd = false
  private retryCount = 0
  private maxRetries = 2
  private lastKnownTime = 0
  private isExtractingUrl = false

  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.setupEvents()
  }

  private setupEvents() {
    this.audio.addEventListener('timeupdate', () => {
      const time = this.audio.currentTime
      this.lastKnownTime = time
      usePlayerStore.getState().setCurrentTime(time)
    })

    this.audio.addEventListener('durationchange', () => {
      usePlayerStore.getState().setDuration(this.audio.duration || 0)
    })

    this.audio.addEventListener('ended', () => {
      if (this.isHandlingEnd) return
      this.isHandlingEnd = true
      this.retryCount = 0

      const { repeatMode } = useQueueStore.getState()
      if (repeatMode === 'one') {
        this.audio.currentTime = 0
        this.audio.play().catch(() => {})
        this.isHandlingEnd = false
        return
      }

      const hasNext = useQueueStore.getState().next()
      if (!hasNext) {
        usePlayerStore.getState().setIsPlaying(false)
      }
      this.isHandlingEnd = false
    })

    this.audio.addEventListener('error', () => {
      if (!this.audio.src || !this.currentVideoId) return
      this.handlePlaybackError()
    })

    this.audio.addEventListener('canplay', () => {
      usePlayerStore.getState().setIsLoading(false)
      if (usePlayerStore.getState().isPlaying) {
        this.audio.play().catch(() => {})
      }
    })

    this.audio.addEventListener('waiting', () => {
      usePlayerStore.getState().setIsLoading(true)
    })
  }

  private async handlePlaybackError() {
    if (this.isExtractingUrl) return

    if (this.retryCount < this.maxRetries && this.currentVideoId) {
      this.retryCount++
      this.isExtractingUrl = true
      const resumeTime = this.lastKnownTime

      try {
        usePlayerStore.getState().setIsLoading(true)
        usePlayerStore.getState().setError(`Retrying... (${this.retryCount}/${this.maxRetries})`)

        const url = await window.api.getAudioUrl(this.currentVideoId)
        this.audio.src = url

        this.audio.addEventListener('loadedmetadata', () => {
          if (resumeTime > 0 && resumeTime < this.audio.duration) {
            this.audio.currentTime = resumeTime
          }
          this.audio.play().catch(() => {})
          usePlayerStore.getState().setIsPlaying(true)
          usePlayerStore.getState().setError(null)
        }, { once: true })
      } catch {
        usePlayerStore.getState().setError('Failed to reload audio. Skipping...')
        setTimeout(() => this.skipToNext(), 1500)
      } finally {
        this.isExtractingUrl = false
      }
    } else {
      usePlayerStore.getState().setError('Playback failed. Skipping...')
      setTimeout(() => this.skipToNext(), 1500)
    }
  }

  private skipToNext() {
    if (this.isHandlingEnd) return
    this.isHandlingEnd = true
    this.retryCount = 0
    const hasNext = useQueueStore.getState().next()
    if (!hasNext) {
      usePlayerStore.getState().setIsPlaying(false)
    }
    this.isHandlingEnd = false
  }

  async loadTrack(videoId: string) {
    if (videoId === this.currentVideoId && this.audio.src) return

    this.currentVideoId = videoId
    this.retryCount = 0
    this.lastKnownTime = 0
    this.isExtractingUrl = true

    usePlayerStore.getState().setIsLoading(true)
    usePlayerStore.getState().setError(null)

    try {
      const url = await window.api.getAudioUrl(videoId)
      if (this.currentVideoId !== videoId) return

      this.audio.src = url
      await this.audio.play()
      usePlayerStore.getState().setIsPlaying(true)
      usePlayerStore.getState().setIsLoading(false)
    } catch (err: any) {
      if (this.currentVideoId !== videoId) return
      usePlayerStore.getState().setError(`Failed to load: ${err.message}`)
      usePlayerStore.getState().setIsLoading(false)
      setTimeout(() => this.skipToNext(), 2000)
    } finally {
      this.isExtractingUrl = false
    }
  }

  play() {
    this.audio.play().then(() => {
      usePlayerStore.getState().setIsPlaying(true)
    }).catch(() => {})
  }

  pause() {
    this.audio.pause()
    usePlayerStore.getState().setIsPlaying(false)
  }

  togglePlay() {
    if (!usePlayerStore.getState().currentTrack) return
    if (usePlayerStore.getState().isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  seek(time: number) {
    this.audio.currentTime = time
    usePlayerStore.getState().setCurrentTime(time)
  }

  setVolume(vol: number) {
    this.audio.volume = vol
  }

  stop() {
    this.audio.pause()
    this.audio.src = ''
    this.currentVideoId = null
    usePlayerStore.getState().setIsPlaying(false)
  }

  getCurrentVideoId() {
    return this.currentVideoId
  }
}

export const audioManager = new AudioManager()
