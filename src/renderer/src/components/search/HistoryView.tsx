import { useEffect } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { SearchResultItem } from './SearchResultItem'
import { Clock } from 'lucide-react'

export function HistoryView() {
  const { historyItems, setHistoryItems } = useSearchStore()

  useEffect(() => {
    window.api.getHistory().then(setHistoryItems)
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-zinc-400" />
        <h2 className="text-lg font-bold text-zinc-200">Recently Played</h2>
      </div>
      {historyItems.length === 0 ? (
        <p className="text-zinc-500 text-sm">No history yet. Start playing some music!</p>
      ) : (
        <div className="space-y-1">
          {historyItems.map((item, i) => (
            <SearchResultItem key={item.videoId + i} result={item} />
          ))}
        </div>
      )}
    </div>
  )
}
