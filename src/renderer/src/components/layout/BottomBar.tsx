import { PlaybackControls } from '../player/PlaybackControls'
import { ProgressBar } from '../player/ProgressBar'
import { VolumeControl } from '../player/VolumeControl'
import { NowPlaying } from '../player/NowPlaying'

export function BottomBar() {
  return (
    <div className="h-24 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 shrink-0">
      <div className="w-72 min-w-0">
        <NowPlaying />
      </div>
      <div className="flex-1 flex flex-col items-center gap-1 px-4">
        <PlaybackControls />
        <ProgressBar />
      </div>
      <div className="w-48">
        <VolumeControl />
      </div>
    </div>
  )
}
