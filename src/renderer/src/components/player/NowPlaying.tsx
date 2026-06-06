import { Heart } from 'lucide-react'
import { usePlayerStore } from '../../stores/playerStore'
import { useEffect, useState } from 'react'

export function NowPlaying() {
  const { currentTrack } = usePlayerStore()
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (currentTrack) {
      window.api.isFavorite(currentTrack.videoId).then(setIsFav)
    }
  }, [currentTrack?.videoId])

  const toggleFavorite = async () => {
    if (!currentTrack) return
    if (isFav) {
      await window.api.removeFavorite(currentTrack.videoId)
      setIsFav(false)
    } else {
      await window.api.addFavorite(currentTrack)
      setIsFav(true)
    }
  }

  if (!currentTrack) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-zinc-800 rounded-md flex items-center justify-center">
          <span className="text-zinc-600 text-xs">♪</span>
        </div>
        <div className="text-sm text-zinc-500">Not playing</div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      <img
        src={currentTrack.thumbnail}
        alt=""
        className="w-14 h-14 rounded-md object-cover shadow-lg"
        onError={(e) => {
          (e.target as HTMLImageElement).src = ''
          ;(e.target as HTMLImageElement).className = 'w-14 h-14 rounded-md bg-zinc-800'
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-zinc-100 truncate">{currentTrack.title}</div>
        <div className="text-xs text-zinc-400 truncate">{currentTrack.artist}</div>
      </div>
      <button
        onClick={toggleFavorite}
        className={`p-1.5 transition-colors ${
          isFav ? 'text-brand-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
