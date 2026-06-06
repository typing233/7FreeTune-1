import { Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle, Loader } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useQueueStore } from '../../stores/queueStore'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'

export function PlaybackControls() {
  const { isPlaying, isLoading, currentTrack } = usePlayerStore()
  const { repeatMode, shuffle, setRepeatMode, toggleShuffle, prev } = useQueueStore()
  const { togglePlay } = useAudioPlayer()

  const nextRepeatMode = () => {
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one']
    const idx = modes.indexOf(repeatMode)
    setRepeatMode(modes[(idx + 1) % 3])
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={toggleShuffle}
        className={`p-1.5 rounded-full transition-colors ${
          shuffle ? 'text-brand-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        title="Shuffle"
      >
        <Shuffle size={16} />
      </button>

      <button
        onClick={prev}
        className="p-1.5 text-zinc-300 hover:text-white transition-colors"
        disabled={!currentTrack}
        title="Previous"
      >
        <SkipBack size={20} fill="currentColor" />
      </button>

      <button
        onClick={togglePlay}
        disabled={!currentTrack && !isLoading}
        className="p-2 bg-white rounded-full text-zinc-900 hover:scale-105 transition-transform
          disabled:opacity-50 disabled:hover:scale-100"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isLoading ? (
          <Loader size={20} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={20} fill="currentColor" />
        ) : (
          <Play size={20} fill="currentColor" />
        )}
      </button>

      <button
        onClick={() => useQueueStore.getState().next()}
        className="p-1.5 text-zinc-300 hover:text-white transition-colors"
        disabled={!currentTrack}
        title="Next"
      >
        <SkipForward size={20} fill="currentColor" />
      </button>

      <button
        onClick={nextRepeatMode}
        className={`p-1.5 rounded-full transition-colors ${
          repeatMode !== 'none' ? 'text-brand-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
        title={`Repeat: ${repeatMode}`}
      >
        {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
      </button>
    </div>
  )
}
