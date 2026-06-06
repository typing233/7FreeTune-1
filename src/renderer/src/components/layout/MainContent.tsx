import { SearchResults } from '../search/SearchResults'
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
      {viewMode === 'search' && (
        <>
          {(query || results.length > 0) ? (
            <SearchResults />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              {currentTrack ? (
                <LyricsPanel />
              ) : (
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-zinc-300 mb-2">Welcome to FreeTune</h2>
                  <p className="text-zinc-500">Search for any song to start listening</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
