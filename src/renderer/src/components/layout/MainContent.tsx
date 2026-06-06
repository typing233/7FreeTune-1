import { SearchResults } from '../search/SearchResults'
import { AlbumSearch } from '../search/AlbumSearch'
import { QuickAdd } from '../search/QuickAdd'
import { useSearchStore } from '../../stores/searchStore'
import { usePlayerStore } from '../../stores/playerStore'
import { LyricsPanel } from '../player/LyricsPanel'
import { HistoryView } from '../search/HistoryView'
import { FavoritesView } from '../search/FavoritesView'

export function MainContent() {
  const { viewMode, query, results } = useSearchStore()
  const { currentTrack } = usePlayerStore()

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {viewMode === 'history' && <HistoryView />}
      {viewMode === 'favorites' && <FavoritesView />}
      {viewMode === 'album' && <AlbumSearch />}
      {viewMode === 'search' && (
        <>
          {(query || results.length > 0) ? (
            <SearchResults />
          ) : (
            <div className="space-y-8">
              {currentTrack ? (
                <LyricsPanel />
              ) : (
                <>
                  <div className="text-center pt-4 pb-2">
                    <h2 className="text-2xl font-bold text-zinc-300 mb-1">FreeTune</h2>
                    <p className="text-zinc-500 text-sm">Search above, or use quick tools below</p>
                  </div>
                  <QuickAdd />
                  <div className="border-t border-zinc-800 pt-6">
                    <AlbumSearch />
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
