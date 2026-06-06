import { spawn } from 'child_process'
import { SearchResult } from '../../shared/types'

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
