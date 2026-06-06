export interface Track {
  id: string
  title: string
  artist: string
  duration: number
  thumbnail: string
  videoId: string
}

export interface SearchResult {
  id: string
  title: string
  artist: string
  duration: number
  thumbnail: string
  videoId: string
}

export interface AlbumResult {
  title: string
  artist: string
  thumbnail: string
  tracks: SearchResult[]
}

export interface LyricLine {
  time: number
  text: string
}

export type RepeatMode = 'none' | 'all' | 'one'
