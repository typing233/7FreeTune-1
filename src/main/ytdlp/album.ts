import { spawn } from 'child_process'
import { SearchResult } from '../../shared/types'

export interface AlbumSearchResult {
  albumTitle: string
  artist: string
  thumbnail: string
  tracks: SearchResult[]
}

export function searchAlbum(albumQuery: string): Promise<AlbumSearchResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      `ytsearch1:${albumQuery} full album`,
      '--dump-json',
      '--no-warnings',
      '--ignore-errors'
    ])

    let stdout = ''
    const timeout = setTimeout(() => {
      proc.kill()
      reject(new Error('Album search timed out'))
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })

    proc.on('close', () => {
      clearTimeout(timeout)
      try {
        const json = JSON.parse(stdout.trim())
        const albumVideoId = json.id
        const albumTitle = json.title || albumQuery
        const artist = json.channel || json.uploader || 'Unknown'
        const thumbnail = json.thumbnails?.[json.thumbnails.length - 1]?.url || json.thumbnail || ''

        if (json.chapters && json.chapters.length > 0) {
          const tracks: SearchResult[] = json.chapters.map((ch: any, i: number) => ({
            id: `${albumVideoId}_ch${i}`,
            title: ch.title || `Track ${i + 1}`,
            artist: artist,
            duration: (ch.end_time || 0) - (ch.start_time || 0),
            thumbnail: thumbnail,
            videoId: albumVideoId
          }))
          resolve({ albumTitle, artist, thumbnail, tracks })
        } else {
          extractAlbumTracks(albumQuery, artist, thumbnail, albumTitle).then(resolve).catch(reject)
        }
      } catch {
        extractAlbumTracks(albumQuery, '', '', albumQuery).then(resolve).catch(reject)
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function extractAlbumTracks(
  albumQuery: string,
  fallbackArtist: string,
  fallbackThumbnail: string,
  fallbackTitle: string
): Promise<AlbumSearchResult> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      `ytsearch15:${albumQuery} songs`,
      '--flat-playlist',
      '--dump-json',
      '--no-warnings',
      '--ignore-errors'
    ])

    let buffer = ''
    const tracks: SearchResult[] = []
    const timeout = setTimeout(() => {
      proc.kill()
      resolve({ albumTitle: fallbackTitle, artist: fallbackArtist, thumbnail: fallbackThumbnail, tracks })
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => {
      buffer += data.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          tracks.push({
            id: json.id,
            title: json.title || 'Unknown',
            artist: json.channel || json.uploader || fallbackArtist,
            duration: json.duration || 0,
            thumbnail: json.thumbnails?.[json.thumbnails.length - 1]?.url || json.thumbnail || fallbackThumbnail,
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
          tracks.push({
            id: json.id,
            title: json.title || 'Unknown',
            artist: json.channel || json.uploader || fallbackArtist,
            duration: json.duration || 0,
            thumbnail: json.thumbnails?.[json.thumbnails.length - 1]?.url || json.thumbnail || fallbackThumbnail,
            videoId: json.id
          })
        } catch {}
      }
      resolve({
        albumTitle: fallbackTitle,
        artist: fallbackArtist || tracks[0]?.artist || 'Unknown',
        thumbnail: fallbackThumbnail || tracks[0]?.thumbnail || '',
        tracks
      })
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}
