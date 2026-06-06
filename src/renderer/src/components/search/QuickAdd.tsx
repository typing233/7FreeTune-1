import { useState } from 'react'
import { Zap, Loader, Plus, Play } from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'
import { SearchResult } from '../../types'

export function QuickAdd() {
  const [artist, setArtist] = useState('')
  const [track, setTrack] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'found' | 'notfound' | 'added'>('idle')
  const { addTrack, addTrackNext, playIndex } = useQueueStore()

  const handleMatch = async () => {
    if (!artist.trim() && !track.trim()) return
    setIsLoading(true)
    setStatus('idle')
    setResult(null)
    try {
      const matched = await window.api.autoMatch(artist.trim(), track.trim())
      if (matched) {
        setResult(matched)
        setStatus('found')
        addTrackNext(matched)
        const nextIndex = useQueueStore.getState().currentIndex + 1
        playIndex(nextIndex)
        setStatus('added')
        setTimeout(() => {
          setArtist('')
          setTrack('')
          setResult(null)
          setStatus('idle')
        }, 2000)
      } else {
        setStatus('notfound')
      }
    } catch {
      setStatus('notfound')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOnly = async () => {
    if (!artist.trim() && !track.trim()) return
    setIsLoading(true)
    setStatus('idle')
    setResult(null)
    try {
      const matched = await window.api.autoMatch(artist.trim(), track.trim())
      if (matched) {
        setResult(matched)
        addTrack(matched)
        setStatus('added')
        setTimeout(() => {
          setArtist('')
          setTrack('')
          setResult(null)
          setStatus('idle')
        }, 2000)
      } else {
        setStatus('notfound')
      }
    } catch {
      setStatus('notfound')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={20} className="text-yellow-400" />
        <h2 className="text-lg font-bold text-zinc-200">Quick Play</h2>
        <span className="text-xs text-zinc-500">Auto-match & play</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleMatch()}
          placeholder="Artist name"
          className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg py-2 px-3 text-sm
            placeholder-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/50"
        />
        <input
          type="text"
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleMatch()}
          placeholder="Track name"
          className="flex-1 bg-zinc-800 text-zinc-100 rounded-lg py-2 px-3 text-sm
            placeholder-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/50"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleMatch}
          disabled={isLoading || (!artist.trim() && !track.trim())}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500
            disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isLoading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <Play size={14} fill="currentColor" />
          )}
          Play Now
        </button>
        <button
          onClick={handleAddOnly}
          disabled={isLoading || (!artist.trim() && !track.trim())}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 hover:bg-zinc-600
            disabled:opacity-50 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Add to Queue
        </button>
      </div>

      {status === 'added' && result && (
        <div className="flex items-center gap-2 p-2 bg-brand-900/30 border border-brand-700/30 rounded-lg">
          {result.thumbnail && (
            <img src={result.thumbnail} alt="" className="w-10 h-10 rounded object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-brand-300 truncate">✓ {result.title}</div>
            <div className="text-xs text-zinc-400 truncate">{result.artist}</div>
          </div>
        </div>
      )}

      {status === 'notfound' && (
        <p className="text-sm text-zinc-500">No match found. Try adjusting the artist or track name.</p>
      )}
    </div>
  )
}
