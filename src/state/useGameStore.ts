import { create } from 'zustand'

export type GamePhase = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver'

type Input = { left: boolean; right: boolean; cast: boolean }

type GameState = {
  score: number
  highScore: number
  level: number
  timer: number
  paused: boolean
  gamePhase: GamePhase
  muted: boolean
  input: Input
  // actions
  startGame: () => void
  pause: () => void
  resume: () => void
  nextLevel: () => void
  gameOver: () => void
  restart: () => void
  addScore: (n: number) => void
  setTimer: (t: number) => void
  toggleMute: () => void
}

const initialInput: Input = { left: false, right: false, cast: false }

const getHigh = () => {
  try {
    const v = localStorage.getItem('htf_highscore')
    return v ? parseInt(v) : 0
  } catch {
    return 0
  }
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  highScore: getHigh(),
  level: 1,
  timer: 60,
  paused: false,
  gamePhase: 'menu',
  muted: false,
  input: initialInput,

  startGame: () => set({ gamePhase: 'playing', timer: 60, score: 0, paused: false, input: { left: false, right: false, cast: false } }),
  pause: () => set({ paused: true, gamePhase: 'paused' }),
  resume: () => set({ paused: false, gamePhase: 'playing' }),
  nextLevel: () => set((s) => ({ level: s.level + 1, gamePhase: 'playing', timer: 60 })),
  gameOver: () => set({ gamePhase: 'gameOver' }),
  restart: () => set({ score: 0, level: 1, timer: 60, gamePhase: 'menu', paused: false }),
  addScore: (n) => set((s) => {
    const newScore = Math.max(0, s.score + n)
    const newHigh = Math.max(s.highScore, newScore)
    try { localStorage.setItem('htf_highscore', String(newHigh)) } catch {}
    return { score: newScore, highScore: newHigh }
  }),
  setTimer: (t) => set({ timer: t }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))


