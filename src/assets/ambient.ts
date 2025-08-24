// lightweight ambient wave loop using WebAudio noise + filter
let started = false
let ctx: AudioContext | null = null
let gain: GainNode | null = null

export function startAmbient(getMuted: () => boolean) {
  if (started) return
  const onInteract = () => {
    if (started) return
    started = true
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    gain = ctx.createGain()
    gain.gain.value = 0.05
    gain.connect(ctx.destination)

    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    src.connect(filter)
    filter.connect(gain)
    src.start()

    const tick = () => {
      if (!ctx || !gain) return
      const muted = getMuted()
      const target = muted ? 0.0 : 0.05
      gain.gain.setTargetAtTime(target, ctx.currentTime, 0.2)
      requestAnimationFrame(tick)
    }
    tick()

    document.removeEventListener('pointerdown', onInteract)
    document.removeEventListener('keydown', onInteract)
  }
  document.addEventListener('pointerdown', onInteract)
  document.addEventListener('keydown', onInteract)
}


