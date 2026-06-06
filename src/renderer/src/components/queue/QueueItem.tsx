import { GripVertical, X, Play } from 'lucide-react'
import { QueueItem as QueueItemType } from '../../types'
import { useQueueStore } from '../../stores/queueStore'
import { formatTime } from '../../lib/formatTime'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  item: QueueItemType
  index: number
  isActive: boolean
}

export function QueueItem({ item, index, isActive }: Props) {
  const { removeTrack, playIndex } = useQueueStore()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.queueId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md group transition-colors ${
        isActive
          ? 'bg-brand-500/10 border border-brand-500/20'
          : 'hover:bg-zinc-800/60'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="p-0.5 text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      <button
        onClick={() => playIndex(index)}
        className="relative w-9 h-9 rounded overflow-hidden shrink-0 bg-zinc-800"
      >
        {item.thumbnail && (
          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
        )}
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-brand-400 animate-pulse rounded-full" />
              <span className="w-0.5 h-3 bg-brand-400 animate-pulse rounded-full delay-75" />
              <span className="w-0.5 h-3 bg-brand-400 animate-pulse rounded-full delay-150" />
            </div>
          </div>
        )}
        {!isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play size={12} fill="white" className="text-white" />
          </div>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${isActive ? 'text-brand-400' : 'text-zinc-200'}`}>
          {item.title}
        </div>
        <div className="text-[10px] text-zinc-500 truncate">{item.artist}</div>
      </div>

      <span className="text-[10px] text-zinc-600 shrink-0">{formatTime(item.duration)}</span>

      <button
        onClick={() => removeTrack(item.queueId)}
        className="p-0.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove"
      >
        <X size={14} />
      </button>
    </div>
  )
}
