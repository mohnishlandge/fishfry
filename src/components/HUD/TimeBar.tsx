import { useGameStore } from '../../state/useGameStore'

export function TimeBar() {
  const timer = useGameStore((s) => s.timer)
  const pct = Math.max(0, Math.min(1, timer / 60))
  
  return (
    <div className="panel-dark px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm subtitle">Time Remaining</span>
        <span className="text-sm font-bold text-white">{Math.max(0, Math.ceil(timer))}s</span>
      </div>
      <div className="progress-bar h-3">
        <div 
          className="progress-fill" 
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  )
}


