import { useState } from 'react'
import { Disc3, Plus, Play, Loader } from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'
import { SearchResult } from '../../types'
import { formatTime } from '../../lib/formatTime'

interface AlbumData {
  albumTitle: string
  artist: string
  thumbnail: string
  tracks: SearchResult[]
}

export function AlbumSearch() {
  const [query, setQuery] = useState('')
  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addTracks, addTrack, addTrackNext, playIndex } = useQueueStore()

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsLoading(true)
    setError(null)
    setAlbum(null)
    try {
      const result = await window.api.searchAlbum(query)
      if (result.tracks.length === 0) {
        setError('No tracks found for this album')
      } else {
        setAlbum(result)
      }
    } catch (err: any) {
      setError(err.message || 'Album search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAll = () => {
    if (!album) return
    addTracks(album.tracks)
  }

  const handlePlayAll = () => {
    if (!album) return
    const currentLength = useQueueStore.getState().items.length
    addTracks(album.tracks)
    playIndex(currentLength)
  }

  const handlePlayTrack = (track: SearchResult) => {
    addTrackNext(track)
    const nextIndex = useQueueStore.getState().currentIndex + 1
    playIndex(nextIndex)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Disc3 size={20} className="text-brand-400" />
        <h2 className="text-lg font-bold text-zinc-200">Album Search</h2>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter album name (e.g. 'Dark Side of the Moon')"
          className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg py-2 px-4 text-sm
            placeholder-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50
            text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {album && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
            {album.thumbnail && (
              <img src={album.thumbnail} alt="" className="w-16 h-16 rounded-md object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-zinc-100 truncate">{album.albumTitle}</h3>
              <p className="text-sm text-zinc-400">{album.artist} · {album.tracks.length} tracks</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePlayAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500
                  text-white rounded-full text-xs font-medium transition-colors"
              >
                <Play size={12} fill="currentColor" /> Play All
              </button>
              <button
                onClick={handleAddAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600
                  text-zinc-200 rounded-full text-xs font-medium transition-colors"
              >
                <Plus size={12} /> Add All
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {album.tracks.map((track, i) => (
              <div
                key={track.id + i}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800/60 group transition-colors"
              >
                <span className="w-6 text-right text-xs text-zinc-500">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{track.title}</div>
                  <div className="text-xs text-zinc-500 truncate">{track.artist}</div>
                </div>
                <span className="text-xs text-zinc-500">{formatTime(track.duration)}</span>
                <button
                  onClick={() => handlePlayTrack(track)}
                  className="p-1 text-zinc-500 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Play now"
                >
                  <Play size={14} fill="currentColor" />
                </button>
                <button
                  onClick={() => addTrack(track)}
                  className="p-1 text-zinc-500 hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all"
                  title="Add to queue"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
