import { useGameStore } from '../../state/useGameStore'
import { useShallow } from 'zustand/react/shallow'
import { MobileControls } from '../MobileControls'
import { TimeBar } from './TimeBar'
import { useEffect } from 'react'
import { Volume2, VolumeX, Trophy, Timer, Target } from 'lucide-react'

export function HUD() {
  const { score, highScore, timer, level, muted, toggleMute } = useGameStore(useShallow((s) => ({
    score: s.score,
    highScore: s.highScore,
    timer: s.timer,
    level: s.level,
    muted: s.muted,
    toggleMute: s.toggleMute,
  })))

  // Keyboard helpers in HUD scope for pause and mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') toggleMute()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleMute])

  return (
    <div className="pointer-events-none absolute inset-0 p-4 sm:p-6">
      {/* Top HUD */}
      <div className="flex items-start justify-between mb-4">
        {/* Score Panel */}
        <div className="panel px-6 py-4 pointer-events-auto">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span className="text-2xl font-bold title">{score.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm subtitle">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Best: {highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Level & Timer Panel */}
        <div className="panel px-6 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold title mb-1">LVL {level}</div>
            <div className="flex items-center gap-2 justify-center subtitle">
              <Timer className="w-4 h-4 text-blue-400" />
              <span>{Math.max(0, Math.ceil(timer))}s</span>
            </div>
          </div>
        </div>

        {/* Mute Button */}
        <button 
          aria-label={muted ? "Unmute" : "Mute"} 
          className="btn-secondary pointer-events-auto w-14 h-14 flex items-center justify-center"
          onClick={toggleMute}
        >
          {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Time Progress Bar */}
      <div>
        <TimeBar />
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <MobileControls />
      </div>
    </div>
  )
}


