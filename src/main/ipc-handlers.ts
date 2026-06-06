import { ipcMain } from 'electron'
import { searchYouTube } from './ytdlp/search'
import { extractAudioUrlWithRetry } from './ytdlp/extract'
import { getRecommendations } from './ytdlp/recommend'
import Store from 'electron-store'
import { Track } from '../shared/types'

interface StoreSchema {
  history: Track[]
  favorites: Track[]
  volume: number
  queue: Track[]
}

const store = new Store<StoreSchema>({
  defaults: {
    history: [],
    favorites: [],
    volume: 0.8,
    queue: []
  }
})

export function registerIpcHandlers(): void {
  ipcMain.handle('search', async (_event, query: string, limit?: number) => {
    return searchYouTube(query, limit || 10)
  })

  ipcMain.handle('get-audio-url', async (_event, videoId: string) => {
    return extractAudioUrlWithRetry(videoId)
  })

  ipcMain.handle('get-recommendations', async (_event, videoId: string) => {
    return getRecommendations(videoId)
  })

  ipcMain.handle('get-history', async () => {
    return store.get('history', [])
  })

  ipcMain.handle('add-to-history', async (_event, track: Track) => {
    const history = store.get('history', [])
    const filtered = history.filter((t) => t.videoId !== track.videoId)
    filtered.unshift(track)
    store.set('history', filtered.slice(0, 200))
  })

  ipcMain.handle('get-favorites', async () => {
    return store.get('favorites', [])
  })

  ipcMain.handle('add-favorite', async (_event, track: Track) => {
    const favorites = store.get('favorites', [])
    if (!favorites.find((t) => t.videoId === track.videoId)) {
      favorites.unshift(track)
      store.set('favorites', favorites)
    }
  })

  ipcMain.handle('remove-favorite', async (_event, videoId: string) => {
    const favorites = store.get('favorites', [])
    store.set('favorites', favorites.filter((t) => t.videoId !== videoId))
  })

  ipcMain.handle('is-favorite', async (_event, videoId: string) => {
    const favorites = store.get('favorites', [])
    return favorites.some((t) => t.videoId === videoId)
  })

  ipcMain.handle('get-volume', async () => {
    return store.get('volume', 0.8)
  })

  ipcMain.handle('set-volume', async (_event, volume: number) => {
    store.set('volume', volume)
  })

  ipcMain.handle('save-queue', async (_event, queue: Track[]) => {
    store.set('queue', queue)
  })

  ipcMain.handle('get-saved-queue', async () => {
    return store.get('queue', [])
  })
}
