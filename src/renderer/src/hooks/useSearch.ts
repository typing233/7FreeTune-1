import { useCallback, useRef } from 'react'
import { useSearchStore } from '../stores/searchStore'

export function useSearch() {
  const { setQuery, setResults, setIsLoading, setError } = useSearchStore()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const search = useCallback((query: string) => {
    setQuery(query)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    timerRef.current = setTimeout(async () => {
      try {
        const results = await window.api.search(query, 15)
        setResults(results)
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Search failed')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 400)
  }, [])

  return { search }
}
