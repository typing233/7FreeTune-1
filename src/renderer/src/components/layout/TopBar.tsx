import { Search, Music, Heart, Clock } from 'lucide-react'
import { useSearchStore } from '../../stores/searchStore'
import { useSearch } from '../../hooks/useSearch'

export function TopBar() {
  const { query, viewMode, setViewMode } = useSearchStore()
  const { search } = useSearch()

  return (
    <div className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-4 shrink-0">
      <div className="flex items-center gap-2 text-brand-500">
        <Music size={24} />
        <span className="font-bold text-lg">FreeTune</span>
      </div>

      <div className="flex-1 max-w-xl mx-auto relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            search(e.target.value)
            setViewMode('search')
          }}
          onFocus={() => setViewMode('search')}
          placeholder="Search songs, artists, or albums..."
          className="w-full bg-zinc-800 text-zinc-100 rounded-full py-2 pl-10 pr-4 text-sm
            placeholder-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/50
            transition-all"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode('history')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'history' ? 'bg-zinc-700 text-brand-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="History"
        >
          <Clock size={20} />
        </button>
        <button
          onClick={() => setViewMode('favorites')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'favorites' ? 'bg-zinc-700 text-brand-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          title="Favorites"
        >
          <Heart size={20} />
        </button>
      </div>
    </div>
  )
}
