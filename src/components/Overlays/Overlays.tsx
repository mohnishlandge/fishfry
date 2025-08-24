import { useGameStore } from '../../state/useGameStore'
import { Play, Pause, ArrowRight, RotateCcw, Gamepad2, Keyboard, Smartphone } from 'lucide-react'

type Props = { phase: string }

export function Overlays({ phase }: Props) {
  const startGame = useGameStore((s) => s.startGame)
  const resume = useGameStore((s) => s.resume)
  const nextLevel = useGameStore((s) => s.nextLevel)
  const restart = useGameStore((s) => s.restart)

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      {phase === 'menu' && (
        <div className="panel p-8 text-center space-y-6 max-w-lg">
          <div className="mb-8">
            <h1 className="text-6xl font-black title mb-4">HOOK</h1>
            <h2 className="text-4xl font-black title">THE FISH</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="space-y-4 text-left">
            <div className="panel-dark p-4 rounded-xl">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
                Controls
              </h3>
              <div className="space-y-2 text-sm subtitle">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-4 h-4" />
                  <span>Desktop: A/D or ← → to move, Space to cast</span>
                </div>
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile: Use on-screen buttons</span>
                </div>
                <div className="text-xs opacity-75 mt-2">
                  P to pause • M to mute
                </div>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full text-xl py-4 flex items-center justify-center gap-3" onClick={startGame}>
            <Play className="w-6 h-6" />
            START FISHING
          </button>
        </div>
      )}
      
      {phase === 'paused' && (
        <div className="panel p-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Pause className="w-8 h-8 text-blue-400" />
            <h2 className="text-3xl font-bold title">PAUSED</h2>
          </div>
          <button className="btn-primary text-xl py-4 flex items-center justify-center gap-3" onClick={resume}>
            <Play className="w-6 h-6" />
            RESUME
          </button>
        </div>
      )}
      
      {phase === 'levelComplete' && (
        <div className="panel p-8 text-center space-y-6">
          <div className="mb-6">
            <h2 className="text-4xl font-bold title mb-2">LEVEL COMPLETE!</h2>
            <div className="text-lg subtitle">Great fishing! Ready for the next challenge?</div>
          </div>
          <button className="btn-primary text-xl py-4 flex items-center justify-center gap-3" onClick={nextLevel}>
            <ArrowRight className="w-6 h-6" />
            NEXT LEVEL
          </button>
        </div>
      )}
      
      {phase === 'gameOver' && (
        <div className="panel p-8 text-center space-y-6">
          <div className="mb-6">
            <h2 className="text-4xl font-bold title mb-2">GAME OVER</h2>
            <div className="text-lg subtitle">Time to cast your line again!</div>
          </div>
          <button className="btn-primary text-xl py-4 flex items-center justify-center gap-3" onClick={restart}>
            <RotateCcw className="w-6 h-6" />
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  )
}


