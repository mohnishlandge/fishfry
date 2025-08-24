// Minimal WebAudio generator-based SFX
type Getter = () => boolean

export function setupSfx(getMuted: Getter) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0.2
  master.connect(ctx.destination)

  const playTone = (freq: number, type: OscillatorType, dur: number, vol = 1) => {
    if (getMuted()) return
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(0.6 * vol, t0 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    osc.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(t0 + dur + 0.02)
  }

  const noise = (dur: number, vol = 0.4) => {
    if (getMuted()) return
    const bufferSize = 2 * ctx.sampleRate * dur
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = vol
    src.connect(gain)
    gain.connect(master)
    src.start()
  }

  return {
    plop: () => playTone(180, 'sine', 0.15),
    splash: () => noise(0.12, 0.25),
    ding: () => playTone(880, 'triangle', 0.2),
    buzz: () => playTone(120, 'square', 0.25),
  }
}


