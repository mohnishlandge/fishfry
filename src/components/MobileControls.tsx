import { useGameStore } from '../state/useGameStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Fish } from '@phosphor-icons/react'

export function MobileControls() {
  const input = useGameStore((s) => s.input)

  return (
    <div className="pointer-events-auto flex gap-4 items-center">
      <button
        className="btn-secondary w-16 h-16 flex items-center justify-center"
        onTouchStart={() => (input.left = true)}
        onTouchEnd={() => (input.left = false)}
        onMouseDown={() => (input.left = true)}
        onMouseUp={() => (input.left = false)}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      
      <button
        className="btn-primary w-20 h-20 flex flex-col items-center justify-center gap-1"
        onTouchStart={() => (input.cast = true)}
        onTouchEnd={() => (input.cast = false)}
        onMouseDown={() => (input.cast = true)}
        onMouseUp={() => (input.cast = false)}
      >
        <Fish className="w-6 h-6" />
        <span className="text-xs font-bold">CAST</span>
      </button>
      
      <button
        className="btn-secondary w-16 h-16 flex items-center justify-center"
        onTouchStart={() => (input.right = true)}
        onTouchEnd={() => (input.right = false)}
        onMouseDown={() => (input.right = true)}
        onMouseUp={() => (input.right = false)}
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </div>
  )
}


