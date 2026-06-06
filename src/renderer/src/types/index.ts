import { Track, RepeatMode } from '../../../shared/types'

export type { Track, SearchResult, AlbumResult, LyricLine, RepeatMode } from '../../../shared/types'

export interface QueueItem extends Track {
  queueId: string
  isRecommendation?: boolean
}
