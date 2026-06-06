import { Plus, Play } from 'lucide-react'
import { SearchResult } from '../../types'
import { useQueueStore } from '../../stores/queueStore'
import { formatTime } from '../../lib/formatTime'

interface Props {
  result: SearchResult
}

export function SearchResultItem({ result }: Props) {
  const { addTrack, addTrackNext, playIndex, items } = useQueueStore()

  const handleAdd = () => {
    addTrack(result)
  }

  const handlePlayNow = () => {
    addTrackNext(result)
    const nextIndex = useQueueStore.getState().currentIndex + 1
    playIndex(nextIndex)
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/60 group transition-colors">
      <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-zinc-800">
        {result.thumbnail && (
          <img
            src={result.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        <button
          onClick={handlePlayNow}
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0
            group-hover:opacity-100 transition-opacity"
        >
          <Play size={16} fill="white" className="text-white" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-zinc-200 truncate">{result.title}</div>
        <div className="text-xs text-zinc-400 truncate">{result.artist}</div>
      </div>

      <span className="text-xs text-zinc-500 shrink-0">{formatTime(result.duration)}</span>

      <button
        onClick={handleAdd}
        className="p-1.5 rounded-full text-zinc-400 hover:text-brand-400 hover:bg-zinc-700
          opacity-0 group-hover:opacity-100 transition-all"
        title="Add to queue"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
