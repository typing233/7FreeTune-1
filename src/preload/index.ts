import { contextBridge, ipcRenderer } from 'electron'
import { Track, SearchResult, AlbumResult } from '../shared/types'

interface AlbumSearchResult {
  albumTitle: string
  artist: string
  thumbnail: string
  tracks: SearchResult[]
}

const api = {
  search: (query: string, limit?: number): Promise<SearchResult[]> =>
    ipcRenderer.invoke('search', query, limit),

  searchAlbum: (albumQuery: string): Promise<AlbumSearchResult> =>
    ipcRenderer.invoke('search-album', albumQuery),

  resolveTrack: (artist: string, title: string): Promise<SearchResult | null> =>
    ipcRenderer.invoke('resolve-track', artist, title),

  resolveAlbumTracks: (tracks: Array<{ artist: string; title: string }>): Promise<Array<SearchResult | null>> =>
    ipcRenderer.invoke('resolve-album-tracks', tracks),

  autoMatch: (artist: string, track: string): Promise<SearchResult | null> =>
    ipcRenderer.invoke('auto-match', artist, track),

  getAudioUrl: (videoId: string): Promise<string> =>
    ipcRenderer.invoke('get-audio-url', videoId),

  getRecommendations: (videoId: string): Promise<SearchResult[]> =>
    ipcRenderer.invoke('get-recommendations', videoId),

  getHistory: (): Promise<Track[]> =>
    ipcRenderer.invoke('get-history'),

  addToHistory: (track: Track): Promise<void> =>
    ipcRenderer.invoke('add-to-history', track),

  getFavorites: (): Promise<Track[]> =>
    ipcRenderer.invoke('get-favorites'),

  addFavorite: (track: Track): Promise<void> =>
    ipcRenderer.invoke('add-favorite', track),

  removeFavorite: (videoId: string): Promise<void> =>
    ipcRenderer.invoke('remove-favorite', videoId),

  isFavorite: (videoId: string): Promise<boolean> =>
    ipcRenderer.invoke('is-favorite', videoId),

  getVolume: (): Promise<number> =>
    ipcRenderer.invoke('get-volume'),

  setVolume: (volume: number): Promise<void> =>
    ipcRenderer.invoke('set-volume', volume),

  saveQueue: (queue: Track[]): Promise<void> =>
    ipcRenderer.invoke('save-queue', queue),

  getSavedQueue: (): Promise<Track[]> =>
    ipcRenderer.invoke('get-saved-queue'),

  onTrayTogglePlay: (callback: () => void) => {
    ipcRenderer.on('tray-toggle-play', callback)
    return () => ipcRenderer.removeListener('tray-toggle-play', callback)
  },

  onTrayNext: (callback: () => void) => {
    ipcRenderer.on('tray-next', callback)
    return () => ipcRenderer.removeListener('tray-next', callback)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ApiType = typeof api
