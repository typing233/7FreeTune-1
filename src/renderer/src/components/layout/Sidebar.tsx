import { QueuePanel } from '../queue/QueuePanel'

export function Sidebar() {
  return (
    <div className="w-80 bg-zinc-900/50 border-l border-zinc-800 flex flex-col shrink-0">
      <QueuePanel />
    </div>
  )
}
