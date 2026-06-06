import { spawn } from 'child_process'
import { SearchResult } from '../../shared/types'

export function getRecommendations(videoId: string, limit: number = 10): Promise<SearchResult[]> {
  return new Promise((resolve, reject) => {
    const results: SearchResult[] = []
    const proc = spawn('yt-dlp', [
      `https://www.youtube.com/watch?v=${videoId}&list=RD${videoId}`,
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      '--ignore-errors',
      '--playlist-end', String(limit + 1)
    ])

    let buffer = ''
    const timeout = setTimeout(() => {
      proc.kill()
      resolve(results)
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          if (json.id === videoId) continue
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
      resolve(results)
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}
