import { spawn } from 'child_process'
import { SearchResult } from '../../shared/types'

export function autoMatch(artist: string, track: string): Promise<SearchResult | null> {
  const query = `${artist} ${track}`.trim()
  return searchYouTube(query, 5).then((results) => {
    if (results.length === 0) return null
    const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const trackNorm = normalized(track)
    const artistNorm = normalized(artist)

    const scored = results.map((r) => {
      const titleNorm = normalized(r.title)
      const artistMatch = normalized(r.artist)
      let score = 0
      if (titleNorm.includes(trackNorm)) score += 10
      if (artistMatch.includes(artistNorm) || titleNorm.includes(artistNorm)) score += 5
      if (r.title.toLowerCase().includes('official')) score += 2
      if (r.title.toLowerCase().includes('audio')) score += 3
      if (r.title.toLowerCase().includes('lyric')) score += 1
      if (r.title.toLowerCase().includes('live')) score -= 2
      if (r.title.toLowerCase().includes('cover')) score -= 5
      if (r.title.toLowerCase().includes('remix')) score -= 3
      if (r.duration > 30 && r.duration < 600) score += 2
      return { result: r, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0].result
  })
}

export function searchYouTube(query: string, limit: number = 10): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    const results: SearchResult[] = []
    const proc = spawn('yt-dlp', [
      `ytsearch${limit}:${query}`,
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      '--ignore-errors'
    ])

    let buffer = ''
    const timeout = setTimeout(() => {
      proc.kill()
      resolve(results)
    }, 15000)

    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          results.push({
            id: json.id,
            title: json.title || 'Unknown',
            artist: json.channel || json.uploader || 'Unknown',
            duration: json.duration || 0,
            thumbnail: json.thumbnails?.[json.thumbnails.length - 1]?.url || json.thumbnail || '',
            videoId: json.id
          })
        } catch {}
      }
    })

    proc.on('close', () => {
      clearTimeout(timeout)
      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer)
          results.push({
            id: json.id,
            title: json.title || 'Unknown',
            artist: json.channel || json.uploader || 'Unknown',
            duration: json.duration || 0,
            thumbnail: json.thumbnails?.[json.thumbnails.length - 1]?.url || json.thumbnail || '',
            videoId: json.id
          })
        } catch {}
      }
      resolve(results)
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`yt-dlp not found: ${err.message}`))
    })
  })
}
