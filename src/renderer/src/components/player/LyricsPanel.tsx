import { usePlayerStore } from '../../stores/playerStore'
import { useState, useEffect, useRef } from 'react'
import { LyricLine } from '../../types'

export function LyricsPanel() {
  const { currentTrack, currentTime } = usePlayerStore()
  const [lyrics, setLyrics] = useState<LyricLine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!currentTrack) {
      setLyrics([])
      return
    }

    setIsLoading(true)
    const searchQuery = `${currentTrack.artist} ${currentTrack.title}`
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/official|video|audio|lyrics|mv|hd/gi, '')
      .trim()

    const artistName = currentTrack.artist
      .replace(/- Topic$/i, '')
      .replace(/VEVO$/i, '')
      .trim()

    const trackName = currentTrack.title
      .replace(/\(.*?\)/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/official|video|audio|lyrics|mv|hd|ft\..*/gi, '')
      .trim()

    fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const synced = data.find((d) => d.syncedLyrics)
          if (synced?.syncedLyrics) {
            const parsed = parseLRC(synced.syncedLyrics)
            setLyrics(parsed)
          } else if (data[0]?.plainLyrics) {
            const lines = data[0].plainLyrics.split('\n').map((text: string, i: number) => ({
              time: i * 5,
              text
            }))
            setLyrics(lines)
          }
        } else {
          fetch(`https://lrclib.net/api/search?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}`)
            .then((r) => r.json())
            .then((data2: any[]) => {
              if (data2 && data2.length > 0 && data2[0]?.syncedLyrics) {
                setLyrics(parseLRC(data2[0].syncedLyrics))
              } else if (data2?.[0]?.plainLyrics) {
                const lines = data2[0].plainLyrics.split('\n').map((text: string, i: number) => ({
                  time: i * 5,
                  text
                }))
                setLyrics(lines)
              } else {
                setLyrics([])
              }
            })
            .catch(() => setLyrics([]))
        }
      })
      .catch(() => setLyrics([]))
      .finally(() => setIsLoading(false))
  }, [currentTrack?.videoId])

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentTime])

  const activeLine = lyrics.reduce((acc, line, i) => {
    if (line.time <= currentTime) return i
    return acc
  }, -1)

  if (!currentTrack) return null
  if (isLoading) return <div className="text-zinc-500 text-sm">Loading lyrics...</div>
  if (lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <img
          src={currentTrack.thumbnail}
          alt=""
          className="w-64 h-64 rounded-xl object-cover shadow-2xl"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="text-center">
          <h3 className="text-xl font-bold text-zinc-200">{currentTrack.title}</h3>
          <p className="text-zinc-400">{currentTrack.artist}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="max-w-lg mx-auto overflow-y-auto max-h-[60vh] px-4 scrollbar-hide">
      {lyrics.map((line, i) => (
        <div
          key={i}
          ref={i === activeLine ? activeRef : undefined}
          className={`py-2 text-center text-lg transition-all duration-300 ${
            i === activeLine
              ? 'text-white font-bold scale-105'
              : 'text-zinc-500'
          }`}
        >
          {line.text || '♪'}
        </div>
      ))}
    </div>
  )
}

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = []
  for (const line of lrc.split('\n')) {
    const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
    if (match) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const ms = parseInt(match[3])
      const time = minutes * 60 + seconds + ms / 100
      lines.push({ time, text: match[4].trim() })
    }
  }
  return lines
}
