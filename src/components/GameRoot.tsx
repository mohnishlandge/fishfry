import { useEffect, useRef } from 'react'
import { HUD } from './HUD/HUD'
import { Overlays } from './Overlays/Overlays'
import { useGameStore } from '../state/useGameStore'
import { initGame } from '../game/initGame'
import { startAmbient } from '../assets/ambient'

export function GameRoot() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gamePhase = useGameStore((s) => s.gamePhase)

  useEffect(() => {
    if (!canvasRef.current) return
    const destroy = initGame(canvasRef.current)
    return () => destroy()
  }, [])

  // Pause toggle with P
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') {
        const s = useGameStore.getState()
        if (s.gamePhase === 'playing') s.pause()
        else if (s.gamePhase === 'paused') s.resume()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lazy-init ambient on first user gesture
  useEffect(() => {
    startAmbient(() => useGameStore.getState().muted)
  }, [])

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />
      <HUD />
      <Overlays phase={gamePhase} />
    </div>
  )
}


