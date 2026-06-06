import { ListMusic, Trash2, Shuffle } from 'lucide-react'
import { useQueueStore } from '../../stores/queueStore'
import { QueueItem } from './QueueItem'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'

export function QueuePanel() {
  const { items, currentIndex, clear, shuffleQueue, reorderTracks } = useQueueStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = items.findIndex((i) => i.queueId === active.id)
    const toIndex = items.findIndex((i) => i.queueId === over.id)

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderTracks(fromIndex, toIndex)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ListMusic size={18} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Queue</h3>
          <span className="text-xs text-zinc-500">({items.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={shuffleQueue}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            title="Shuffle queue"
            disabled={items.length < 2}
          >
            <Shuffle size={14} />
          </button>
          <button
            onClick={clear}
            className="p-1.5 text-zinc-400 hover:text-red-400 rounded transition-colors"
            title="Clear queue"
            disabled={items.length === 0}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-600 text-sm">Queue is empty</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.queueId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="py-1">
                {items.map((item, index) => (
                  <QueueItem
                    key={item.queueId}
                    item={item}
                    index={index}
                    isActive={index === currentIndex}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
