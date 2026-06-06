import { useState } from 'react'
import { Disc3, Plus, Play, Loader, Check, X, ListPlus } from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'
import { SearchResult } from '../../types'
import { formatTime } from '../../lib/formatTime'

interface AlbumMeta {
  albumTitle: string
  artist: string
  tracks: Array<{
    id: string
    title: string
    artist: string
    duration: number
    thumbnail: string
    videoId: string
  }>
}

type ResolveStatus = 'pending' | 'resolving' | 'resolved' | 'failed'

interface TrackState {
  status: ResolveStatus
  resolved: SearchResult | null
}

export function AlbumSearch() {
  const [query, setQuery] = useState('')
  const [album, setAlbum] = useState<AlbumMeta | null>(null)
  const [trackStates, setTrackStates] = useState<TrackState[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [resolveProgress, setResolveProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const { addTrack, addTracks, addTrackNext, playIndex } = useQueueStore()

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    setAlbum(null)
    setTrackStates([])

    try {
      const result = await window.api.searchAlbum(query)
      if (result.tracks.length === 0) {
        setError('No tracks found for this album. Try "Artist - Album Name" format.')
      } else {
        setAlbum(result)
        setTrackStates(result.tracks.map(() => ({ status: 'pending', resolved: null })))
      }
    } catch (err: any) {
      setError(err.message || 'Album search failed. Try "Artist - Album Name" format.')
    } finally {
      setIsSearching(false)
    }
  }

  const resolveAllAndAdd = async (playFirst: boolean) => {
    if (!album || isResolving) return
    setIsResolving(true)
    const total = album.tracks.length
    setResolveProgress({ done: 0, total })

    const trackInputs = album.tracks.map((t) => ({ artist: t.artist, title: t.title }))

    setTrackStates((prev) => prev.map(() => ({ status: 'resolving' as ResolveStatus, resolved: null })))

    try {
      const resolved = await window.api.resolveAlbumTracks(trackInputs)
      const newStates: TrackState[] = resolved.map((r) => ({
        status: r ? 'resolved' as ResolveStatus : 'failed' as ResolveStatus,
        resolved: r
      }))
      setTrackStates(newStates)

      const validTracks = resolved.filter((r): r is SearchResult => r !== null)
      setResolveProgress({ done: validTracks.length, total })

      if (validTracks.length > 0) {
        if (playFirst) {
          const currentLength = useQueueStore.getState().items.length
          addTracks(validTracks)
          playIndex(currentLength)
        } else {
          addTracks(validTracks)
        }
      }
    } catch (err: any) {
      setError('Failed to resolve tracks: ' + (err.message || 'Unknown error'))
    } finally {
      setIsResolving(false)
    }
  }

  const resolveSingle = async (index: number, play: boolean) => {
    if (!album) return
    const track = album.tracks[index]

    setTrackStates((prev) => {
      const copy = [...prev]
      copy[index] = { status: 'resolving', resolved: null }
      return copy
    })

    try {
      const result = await window.api.resolveTrack(track.artist, track.title)
      setTrackStates((prev) => {
        const copy = [...prev]
        copy[index] = { status: result ? 'resolved' : 'failed', resolved: result }
        return copy
      })

      if (result) {
        if (play) {
          addTrackNext(result)
          const nextIndex = useQueueStore.getState().currentIndex + 1
          playIndex(nextIndex)
        } else {
          addTrack(result)
        }
      }
    } catch {
      setTrackStates((prev) => {
        const copy = [...prev]
        copy[index] = { status: 'failed', resolved: null }
        return copy
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Disc3 size={20} className="text-brand-400" />
        <h2 className="text-lg font-bold text-zinc-200">Album Search</h2>
      </div>

      <p className="text-xs text-zinc-500">
        Uses MusicBrainz for track listings. Try "Pink Floyd - Dark Side of the Moon" or just "Abbey Road".
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder='Album name or "Artist - Album"...'
          className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg py-2 px-4 text-sm
            placeholder-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50
            text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isSearching ? <Loader size={16} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {album && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg">
            <div className="w-14 h-14 bg-zinc-700 rounded-md flex items-center justify-center">
              <Disc3 size={24} className="text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-zinc-100 truncate">{album.albumTitle}</h3>
              <p className="text-sm text-zinc-400">{album.artist} · {album.tracks.length} tracks</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => resolveAllAndAdd(true)}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500
                  disabled:opacity-50 text-white rounded-full text-xs font-medium transition-colors"
              >
                {isResolving ? (
                  <Loader size={12} className="animate-spin" />
                ) : (
                  <Play size={12} fill="currentColor" />
                )}
                Play All
              </button>
              <button
                onClick={() => resolveAllAndAdd(false)}
                disabled={isResolving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600
                  disabled:opacity-50 text-zinc-200 rounded-full text-xs font-medium transition-colors"
              >
                <ListPlus size={12} />
                Add All
              </button>
            </div>
          </div>

          {isResolving && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800/30 rounded-lg">
              <Loader size={14} className="animate-spin text-brand-400" />
              <span className="text-xs text-zinc-400">
                Resolving tracks... {resolveProgress.done}/{resolveProgress.total}
              </span>
              <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${resolveProgress.total > 0 ? (resolveProgress.done / resolveProgress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            {album.tracks.map((track, i) => (
              <div
                key={track.id + i}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800/60 group transition-colors"
              >
                <span className="w-6 text-right text-xs text-zinc-500">{i + 1}</span>

                <StatusBadge status={trackStates[i]?.status || 'pending'} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{track.title}</div>
                  <div className="text-xs text-zinc-500 truncate">{track.artist}</div>
                </div>

                <span className="text-xs text-zinc-500">{formatTime(track.duration)}</span>

                <button
                  onClick={() => resolveSingle(i, true)}
                  disabled={trackStates[i]?.status === 'resolving'}
                  className="p-1 text-zinc-500 hover:text-brand-400 opacity-0 group-hover:opacity-100
                    disabled:opacity-50 transition-all"
                  title="Play now"
                >
                  <Play size={14} fill="currentColor" />
                </button>
                <button
                  onClick={() => resolveSingle(i, false)}
                  disabled={trackStates[i]?.status === 'resolving'}
                  className="p-1 text-zinc-500 hover:text-brand-400 opacity-0 group-hover:opacity-100
                    disabled:opacity-50 transition-all"
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

function StatusBadge({ status }: { status: ResolveStatus }) {
  switch (status) {
    case 'resolving':
      return <Loader size={12} className="animate-spin text-brand-400 shrink-0" />
    case 'resolved':
      return <Check size={12} className="text-green-400 shrink-0" />
    case 'failed':
      return <X size={12} className="text-red-400 shrink-0" />
    default:
      return <div className="w-3 h-3 shrink-0" />
  }
}
