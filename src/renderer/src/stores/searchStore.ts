import { create } from 'zustand'
import { SearchResult } from '../types'

type ViewMode = 'search' | 'history' | 'favorites' | 'album'

interface SearchState {
  query: string
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  viewMode: ViewMode
  historyItems: SearchResult[]
  favoriteItems: SearchResult[]

  setQuery: (query: string) => void
  setResults: (results: SearchResult[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setHistoryItems: (items: SearchResult[]) => void
  setFavoriteItems: (items: SearchResult[]) => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  error: null,
  viewMode: 'search',
  historyItems: [],
  favoriteItems: [],

  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setHistoryItems: (items) => set({ historyItems: items }),
  setFavoriteItems: (items) => set({ favoriteItems: items })
}))
