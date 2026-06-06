import { net } from 'electron'
import { SearchResult } from '../../shared/types'

export interface AlbumTrack {
  position: number
  title: string
  artist: string
  durationMs: number
}

export interface AlbumInfo {
  albumTitle: string
  artist: string
  tracks: AlbumTrack[]
  releaseId: string
}

export interface AlbumSearchResult {
  albumTitle: string
  artist: string
  thumbnail: string
  tracks: SearchResult[]
}

const MB_BASE = 'https://musicbrainz.org/ws/2'
const USER_AGENT = 'FreeTune/1.0.0 (https://github.com/user/freetune)'

function mbFetch(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = `${MB_BASE}${path}${path.includes('?') ? '&' : '?'}fmt=json`
    const request = net.request({ url, method: 'GET' })
    request.setHeader('User-Agent', USER_AGENT)
    request.setHeader('Accept', 'application/json')

    let body = ''
    const timeout = setTimeout(() => {
      request.abort()
      reject(new Error('MusicBrainz request timeout'))
    }, 12000)

    request.on('response', (response) => {
      if (response.statusCode === 503) {
        clearTimeout(timeout)
        reject(new Error('MusicBrainz rate limited'))
        return
      }
      if (response.statusCode !== 200) {
        clearTimeout(timeout)
        reject(new Error(`MusicBrainz HTTP ${response.statusCode}`))
        return
      }
      response.on('data', (chunk) => { body += chunk.toString() })
      response.on('end', () => {
        clearTimeout(timeout)
        try {
          resolve(JSON.parse(body))
        } catch {
          reject(new Error('Invalid JSON from MusicBrainz'))
        }
      })
    })

    request.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    request.end()
  })
}

export async function searchAlbumMeta(query: string): Promise<AlbumInfo | null> {
  const parts = query.trim().split(/\s*[-–—]\s*/)
  let searchQuery: string

  if (parts.length >= 2) {
    const artist = parts[0].trim()
    const album = parts.slice(1).join(' ').trim()
    searchQuery = `release:${encodeURIComponent(album)}+AND+artist:${encodeURIComponent(artist)}`
  } else {
    searchQuery = `release:${encodeURIComponent(query)}`
  }

  const data = await mbFetch(`/release?query=${searchQuery}&limit=10`)

  if (!data.releases || data.releases.length === 0) return null

  const official = data.releases.filter((r: any) => r.status === 'Official')
  const candidates = official.length > 0 ? official : data.releases

  const best = candidates.reduce((a: any, b: any) => {
    const aGroup = a['release-group']?.['primary-type'] === 'Album' ? 10 : 0
    const bGroup = b['release-group']?.['primary-type'] === 'Album' ? 10 : 0
    const aTrackCount = a['track-count'] || 0
    const bTrackCount = b['track-count'] || 0
    const aScore = aGroup + aTrackCount
    const bScore = bGroup + bTrackCount
    return bScore > aScore ? b : a
  }, candidates[0])

  const releaseId = best.id
  const albumTitle = best.title
  const artist = best['artist-credit']?.[0]?.name || 'Unknown'

  const releaseData = await mbFetch(`/release/${releaseId}?inc=recordings+artist-credits`)

  const tracks: AlbumTrack[] = []
  for (const media of releaseData.media || []) {
    for (const track of media.tracks || []) {
      const trackArtist = track['artist-credit']?.[0]?.name || artist
      tracks.push({
        position: track.position,
        title: track.title,
        artist: trackArtist,
        durationMs: track.length || 0
      })
    }
  }

  if (tracks.length === 0) return null

  return { albumTitle, artist, tracks, releaseId }
}

export async function searchAlbum(albumQuery: string): Promise<AlbumSearchResult> {
  const meta = await searchAlbumMeta(albumQuery)
  if (!meta) {
    throw new Error('Album not found on MusicBrainz')
  }

  const tracks: SearchResult[] = meta.tracks.map((t, i) => ({
    id: `mb_${meta.releaseId}_${i}`,
    title: t.title,
    artist: t.artist,
    duration: Math.round(t.durationMs / 1000),
    thumbnail: '',
    videoId: ''
  }))

  return {
    albumTitle: meta.albumTitle,
    artist: meta.artist,
    thumbnail: '',
    tracks
  }
}
