import { usePlayerStore } from '../../stores/playerStore'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'
import { formatTime } from '../../lib/formatTime'

export function ProgressBar() {
  const { currentTime, duration } = usePlayerStore()
  const { seek } = useAudioPlayer()

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    seek(time)
  }

  return (
    <div className="w-full max-w-2xl flex items-center gap-2">
      <span className="text-xs text-zinc-400 w-10 text-right">{formatTime(currentTime)}</span>
      <div className="flex-1 relative group">
        <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          step={0.1}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
    </div>
  )
}
