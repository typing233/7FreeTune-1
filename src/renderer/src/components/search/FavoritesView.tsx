import { useEffect } from 'react'
import { useSearchStore } from '../../stores/searchStore'
import { SearchResultItem } from './SearchResultItem'
import { Heart } from 'lucide-react'

export function FavoritesView() {
  const { favoriteItems, setFavoriteItems } = useSearchStore()

  useEffect(() => {
    window.api.getFavorites().then(setFavoriteItems)
  }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Heart size={20} className="text-brand-400" />
        <h2 className="text-lg font-bold text-zinc-200">Favorites</h2>
      </div>
      {favoriteItems.length === 0 ? (
        <p className="text-zinc-500 text-sm">No favorites yet. Click the heart icon on songs you love!</p>
      ) : (
        <div className="space-y-1">
          {favoriteItems.map((item, i) => (
            <SearchResultItem key={item.videoId + i} result={item} />
          ))}
        </div>
      )}
    </div>
  )
}
