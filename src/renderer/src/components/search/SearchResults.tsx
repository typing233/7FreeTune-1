import { useSearchStore } from '../../stores/searchStore'
import { SearchResultItem } from './SearchResultItem'
import { Loader } from 'lucide-react'

export function SearchResults() {
  const { results, isLoading, error, query } = useSearchStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="animate-spin text-brand-400" />
        <span className="ml-3 text-zinc-400">Searching...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">No results found for "{query}"</p>
      </div>
    )
  }

  return (
    <div>
      {query && (
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Results for "{query}"
        </h3>
      )}
      <div className="space-y-1">
        {results.map((result, index) => (
          <SearchResultItem key={result.id + index} result={result} />
        ))}
      </div>
    </div>
  )
}
