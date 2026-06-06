import { Volume2, Volume1, VolumeX } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useAudioPlayer } from '../../hooks/useAudioPlayer'

export function VolumeControl() {
  const { volume, isMuted, toggleMute } = usePlayerStore()
  const { changeVolume } = useAudioPlayer()

  const displayVolume = isMuted ? 0 : volume
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <VolumeIcon size={18} />
      </button>
      <div className="flex-1 relative group">
        <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-300 rounded-full"
            style={{ width: `${displayVolume * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={displayVolume}
          onChange={(e) => changeVolume(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}
