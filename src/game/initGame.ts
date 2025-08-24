import { useGameStore } from '../state/useGameStore'
import { setupSfx } from './sfx'
import boatImg from '../assets/boat.png'

// Import fish images
import fish1 from '../assets/Gemini_Generated_Image_5sce605sce605sce.png'
import fish2 from '../assets/Gemini_Generated_Image_7xhvyj7xhvyj7xhv.png'
import fish3 from '../assets/Gemini_Generated_Image_gk59z8gk59z8gk59.png'
import fish4 from '../assets/Gemini_Generated_Image_gwpyxpgwpyxpgwpy.png'
import fish5 from '../assets/Gemini_Generated_Image_noy8qdnoy8qdnoy8.png'
import fish6 from '../assets/Gemini_Generated_Image_rvh0drvh0drvh0dr.png'

export type FishKind = 'tiny' | 'small' | 'medium' | 'fast' | 'rare' | 'junk'

type EntityBase = { x: number; y: number; vx: number; vy: number; w: number; h: number; kind: FishKind }
type Fish = EntityBase & { value: number; depth: number; swimPhase: number; schoolGroup: number; avoidanceTarget?: { x: number; y: number } }
type Hook = { x: number; y: number; vy: number; w: number; h: number; state: 'idle' | 'down' | 'up'; caught?: Fish }

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function initGame(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  const sfx = setupSfx(() => useGameStore.getState().muted)
  
  // Load boat image
  const boatImage = new Image()
  boatImage.src = boatImg

  // Load fish images
  const fishImages: Record<FishKind, HTMLImageElement> = {
    tiny: new Image(),
    small: new Image(),
    medium: new Image(),
    fast: new Image(),
    rare: new Image(),
    junk: new Image()
  }
  
  fishImages.tiny.src = fish1
  fishImages.small.src = fish2
  fishImages.medium.src = fish3
  fishImages.fast.src = fish4
  fishImages.rare.src = fish5
  fishImages.junk.src = fish6

  let width = 0, height = 0
  const resize = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  // world state
  const boat = { x: 0.5, y: 0.1 }
  let fishes: Fish[] = []
  const hook: Hook = { x: boat.x, y: 0.12, vy: 0, w: 8, h: 8, state: 'idle' }
  const maxDepth = 0.85

  // particles and floating score popups
  type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string }
  type Popup = { x: number; y: number; text: string; life: number; color: string }
  let particles: Particle[] = []
  let popups: Popup[] = []

  // spawn params per level
  const speciesForLevel = (level: number): FishKind[] => {
    const arr: FishKind[] = ['tiny', 'small', 'medium', 'junk']
    if (level >= 2) arr.push('fast')
    if (level >= 3) arr.push('rare')
    return arr
  }

  const fishStats: Record<FishKind, { speed: number; size: number; value: number; depth: number }> = {
    tiny: { speed: 40, size: 8, value: 5, depth: 0.25 },
    small: { speed: 55, size: 10, value: 10, depth: 0.35 },
    medium: { speed: 70, size: 14, value: 20, depth: 0.5 },
    fast: { speed: 110, size: 10, value: 30, depth: 0.6 },
    rare: { speed: 90, size: 16, value: 50, depth: 0.75 },
    junk: { speed: 30, size: 12, value: -15, depth: 0.5 },
  }

  const spawnFish = () => {
    const pool = speciesForLevel(useGameStore.getState().level)
    const kind = pool[Math.floor(Math.random() * pool.length)]
    const st = fishStats[kind]
    const depth = rand(st.depth - 0.1, st.depth + 0.1)
    const y = clamp(depth, 0.2, maxDepth)
    const dir = Math.random() < 0.5 ? -1 : 1
    const x = dir < 0 ? 1.1 : -0.1
    const fish: Fish = { 
      x, y, 
      vx: dir * st.speed, 
      vy: rand(-5, 5), // Add slight vertical movement
      w: st.size, 
      h: st.size * 0.6, 
      kind, 
      value: st.value, 
      depth,
      swimPhase: rand(0, Math.PI * 2), // Random swim animation phase
      schoolGroup: Math.floor(rand(0, 3)), // Assign to one of 3 school groups
      avoidanceTarget: undefined
    }
    fishes.push(fish)
  }

  // spawn loop
  let spawnAcc = 0

  // controls
  const k = { left: false, right: false, cast: false }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') k.left = true
    if (e.key === 'd' || e.key === 'ArrowRight') k.right = true
    if (e.key === ' ') k.cast = true
    if (e.key.toLowerCase() === 'p') useGameStore.getState().pause()
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') k.left = false
    if (e.key === 'd' || e.key === 'ArrowRight') k.right = false
    if (e.key === ' ') k.cast = false
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  let last = performance.now()
  let running = true

  const update = (dt: number) => {
    const state = useGameStore.getState()
    if (state.gamePhase !== 'playing') return

    const input = state.input
    // Merge keyboard + touch inputs
    const left = input.left || k.left
    const right = input.right || k.right
    const cast = input.cast || k.cast

    // boat move
    const speed = 180
    if (left) boat.x -= (speed * dt) / width
    if (right) boat.x += (speed * dt) / width
    boat.x = clamp(boat.x, 0.05, 0.95)

    // hook logic
    if (hook.state === 'idle' && cast) {
      hook.state = 'down'
      hook.x = boat.x
      sfx.plop()
    }
    if (hook.state === 'down') {
      hook.y += 200 * dt / height
      if (hook.y >= maxDepth || !cast) {
        hook.state = 'up'
        sfx.splash()
        for (let i = 0; i < 12; i++) {
          particles.push({ x: hook.x * width, y: hook.y * height, vx: rand(-40,40), vy: rand(-30,-80), life: 0.7, color: 'rgba(173,216,230,0.8)' })
        }
      }
    } else if (hook.state === 'up') {
      hook.y -= 240 * dt / height
      if (hook.y <= 0.12) {
        hook.y = 0.12
        hook.state = 'idle'
        if (hook.caught) {
          useGameStore.getState().addScore(hook.caught.value)
          if (hook.caught.value > 0) {
            sfx.ding()
            popups.push({ x: hook.x * width, y: hook.y * height, text: `+${hook.caught.value}`, life: 1.0, color: '#a7f3d0' })
          } else {
            sfx.buzz()
            popups.push({ x: hook.x * width, y: hook.y * height, text: `${hook.caught.value}`, life: 1.0, color: '#fecaca' })
          }
        }
        hook.caught = undefined
      }
    }

    // spawns
    const cap = 18 + state.level * 4
    spawnAcc += dt
    if (spawnAcc > Math.max(0.5, 2 - state.level * 0.2) && fishes.length < cap) {
      spawnAcc = 0
      spawnFish()
    }

    // Enhanced fish movement with realistic behaviors
    const time = performance.now() / 1000
    const toRemove: Fish[] = []
    
    for (const f of fishes) {
      // Update swim phase for animation
      f.swimPhase += dt * 4
      
      // Base movement
      let targetVx = f.vx
      let targetVy = f.vy
      
      // Schooling behavior - fish in same group tend to move together
      const schoolMates = fishes.filter(other => 
        other !== f && 
        other.schoolGroup === f.schoolGroup && 
        Math.abs(other.x - f.x) < 0.3 && 
        Math.abs(other.y - f.y) < 0.2
      )
      
      if (schoolMates.length > 0) {
        let avgVx = 0, avgVy = 0, avgX = 0, avgY = 0
        schoolMates.forEach(mate => {
          avgVx += mate.vx
          avgVy += mate.vy
          avgX += mate.x
          avgY += mate.y
        })
        avgVx /= schoolMates.length
        avgVy /= schoolMates.length
        avgX /= schoolMates.length
        avgY /= schoolMates.length
        
        // Align with school mates
        targetVx += (avgVx - f.vx) * 0.1
        targetVy += (avgVy - f.vy) * 0.1
        
        // Cohesion - move toward center of school
        targetVx += (avgX - f.x) * 20
        targetVy += (avgY - f.y) * 10
      }
      
      // Separation - avoid crowding
      const nearbyFish = fishes.filter(other => 
        other !== f && 
        Math.abs(other.x - f.x) < 0.15 && 
        Math.abs(other.y - f.y) < 0.1
      )
      
      nearbyFish.forEach(nearby => {
        const repelForceX = (f.x - nearby.x) * 50
        const repelForceY = (f.y - nearby.y) * 30
        targetVx += repelForceX
        targetVy += repelForceY
      })
      
      // Hook avoidance
      if (hook.state !== 'idle') {
        const hookDistance = Math.sqrt(
          Math.pow((f.x - hook.x), 2) + 
          Math.pow((f.y - hook.y), 2)
        )
        
        if (hookDistance < 0.2) {
          const avoidForceX = (f.x - hook.x) * 100
          const avoidForceY = (f.y - hook.y) * 80
          targetVx += avoidForceX
          targetVy += avoidForceY
          
          // Fast fish are more reactive to hooks
          if (f.kind === 'fast') {
            targetVx *= 1.5
            targetVy *= 1.5
          }
        }
      }
      
      // Natural swimming patterns based on fish type
      const naturalFreq = f.kind === 'fast' ? 6 : 3
      const naturalAmplitude = f.kind === 'tiny' ? 0.3 : 0.5
      
      // Add sinusoidal movement for natural swimming
      targetVy += Math.sin(f.swimPhase) * naturalAmplitude * fishStats[f.kind].speed * 0.002
      
      // Depth preference - fish try to return to their preferred depth
      const depthDiff = f.depth - f.y
      targetVy += depthDiff * 20
      
      // Apply movement with some inertia
      f.vx = f.vx + (targetVx - f.vx) * dt * 2
      f.vy = f.vy + (targetVy - f.vy) * dt * 3
      
      // Limit velocities
      const maxSpeed = fishStats[f.kind].speed * 1.5
      f.vx = clamp(f.vx, -maxSpeed, maxSpeed)
      f.vy = clamp(f.vy, -maxSpeed * 0.3, maxSpeed * 0.3)
      
      // Update position
      f.x += (f.vx * dt) / width
      f.y += (f.vy * dt) / height
      
      // Keep fish within water bounds
      f.y = clamp(f.y, 0.2, maxDepth)
      
      // Remove fish that have swum off screen
      if (f.x < -0.3 || f.x > 1.3) toRemove.push(f)
    }
    
    if (toRemove.length) fishes = fishes.filter((f) => !toRemove.includes(f))

    // collisions with hook (account for sway)
    if (!hook.caught && (hook.state === 'down' || hook.state === 'up')) {
      const time = performance.now() / 1000
      const hookSway = Math.sin(time * 4) * 2
      const hx = hook.x * width + hookSway
      const hy = hook.y * height
      for (const f of fishes) {
        const fx = f.x * width
        const fy = f.y * height
        if (Math.abs(fx - hx) < (f.w + hook.w) && Math.abs(fy - hy) < (f.h + hook.h)) {
          hook.caught = f
          hook.state = 'up'
          sfx.splash()
          break
        }
      }
      if (hook.caught) fishes = fishes.filter((f) => f !== hook.caught)
    }

    // timer
    const t = state.timer - dt
    useGameStore.getState().setTimer(t)
    if (t <= 0) {
      if (state.level >= 5) useGameStore.getState().gameOver()
      else useGameStore.getState().nextLevel()
    }

    // continue pulling caught fish toward the hook
    if (hook.caught) {
      hook.caught.x = hook.x
      hook.caught.y = hook.y
    }

    // update particles
    particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 140 * dt; p.life -= dt })
    particles = particles.filter(p => p.life > 0)
    // update popups
    popups.forEach(o => { o.y -= 30 * dt; o.life -= dt })
    popups = popups.filter(o => o.life > 0)
  }

  const renderBackground = () => {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.35)
    skyGrad.addColorStop(0, '#87CEEB')
    skyGrad.addColorStop(1, '#E0F6FF')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height * 0.35)
    
    // Water gradient
    const waterGrad = ctx.createLinearGradient(0, height * 0.35, 0, height)
    waterGrad.addColorStop(0, '#1E90FF')
    waterGrad.addColorStop(1, '#000080')
    ctx.fillStyle = waterGrad
    ctx.fillRect(0, height * 0.35, width, height)
  }

  const drawBoatAndHook = () => {
    // boat
    const bx = boat.x * width
    const by = height * 0.08
    const boatTime = performance.now() / 1000
    const bobbing = Math.sin(boatTime * 1.5) * 3
    
    // Draw boat image if loaded, fallback to enhanced shapes
    if (boatImage.complete && boatImage.naturalWidth > 0) {
      const boatW = 120 // Made much bigger
      const boatH = 80
      ctx.save()
      ctx.translate(bx, by + bobbing)
      ctx.rotate(Math.sin(boatTime * 0.8) * 0.05) // Slight rocking
      ctx.drawImage(boatImage, -boatW/2, -boatH/2, boatW, boatH)
      ctx.restore()
    } else {
      // Enhanced fallback boat drawing
      ctx.save()
      ctx.translate(bx, by + bobbing)
      ctx.rotate(Math.sin(boatTime * 0.8) * 0.05)
      
      // Boat hull
      ctx.fillStyle = '#8B4513'
      ctx.beginPath()
      ctx.ellipse(0, 0, 50, 20, 0, 0, Math.PI * 2)
      ctx.fill()
      
      // Boat deck
      ctx.fillStyle = '#D2691E'
      ctx.fillRect(-35, -15, 70, 20)
      
      // Boat details
      ctx.fillStyle = '#654321'
      ctx.fillRect(-40, -5, 80, 3)
      ctx.fillRect(-25, -20, 50, 8)
      
      ctx.restore()
    }

    // Thread-like rope with wavy animation
    if (hook.state !== 'idle') {
      const ropeTime = performance.now() / 1000
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(bx, by + 20)
      
      // Create wavy rope segments
      const ropeLength = Math.abs(hook.y * height - (by + 20))
      const segments = Math.max(8, Math.floor(ropeLength / 15))
      
      for (let i = 1; i <= segments; i++) {
        const progress = i / segments
        const x = bx + Math.sin(ropeTime * 3 + progress * 8) * (progress * 8) * (hook.state === 'down' ? 1 : 0.3)
        const y = (by + 20) + progress * ropeLength
        
        if (i === segments) {
          // Final segment goes to hook
          ctx.lineTo(hook.x * width, hook.y * height)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      
      // Add rope texture with small segments
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 1
      for (let i = 0; i < segments; i++) {
        const progress = i / segments
        const segY = (by + 20) + progress * ropeLength
        const segX = bx + Math.sin(ropeTime * 3 + progress * 8) * (progress * 8) * (hook.state === 'down' ? 1 : 0.3)
        ctx.beginPath()
        ctx.arc(segX, segY, 1, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // hook with slight sway
    const hookTime = performance.now() / 1000
    const hookSway = hook.state !== 'idle' ? Math.sin(hookTime * 4) * 2 : 0
    ctx.fillStyle = '#eee'
    ctx.beginPath()
    ctx.arc(hook.x * width + hookSway, hook.y * height, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // Hook detail
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(hook.x * width + hookSway, hook.y * height, 4, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()
  }

  const drawFish = (f: Fish, x: number, y: number) => {
    const fishImage = fishImages[f.kind]
    
    // Check if image is loaded
    if (!fishImage.complete || fishImage.naturalWidth === 0) {
      // Fallback to simple circle if image not loaded
      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = f.kind === 'junk' ? '#654321' : '#87CEEB'
      ctx.beginPath()
      ctx.arc(0, 0, f.w / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      return
    }
    
    const time = performance.now() / 1000
    
    ctx.save()
    ctx.translate(x, y)
    
    // Swimming animation - gentle bobbing
    const swimBob = Math.sin(f.swimPhase) * (f.w * 0.1)
    ctx.translate(0, swimBob)
    
    // Face swimming direction
    const faceDirection = f.vx < 0 ? 1 : -1
    ctx.scale(faceDirection, 1)
    
    // Add slight rotation based on vertical velocity for more natural movement
    const rotationAngle = Math.atan2(f.vy, Math.abs(f.vx)) * 0.3
    ctx.rotate(rotationAngle)
    
    // Calculate image size based on fish stats
    const imageScale = f.kind === 'tiny' ? 0.6 : 
                       f.kind === 'small' ? 0.8 : 
                       f.kind === 'medium' ? 1.0 : 
                       f.kind === 'fast' ? 0.9 : 
                       f.kind === 'rare' ? 1.2 : 
                       0.8 // junk
    
    const drawWidth = f.w * imageScale * 2 * 5  // Increased by 5X
    const drawHeight = f.h * imageScale * 2.5 * 5  // Increased by 5X
    
    // Add transparency based on depth for underwater effect
    const depthAlpha = 1 - (f.y - 0.2) * 0.3
    ctx.globalAlpha = Math.max(0.4, Math.min(1, depthAlpha))
    
    // Draw fish image
    ctx.drawImage(
      fishImage, 
      -drawWidth / 2, 
      -drawHeight / 2, 
      drawWidth, 
      drawHeight
    )
    
    ctx.restore()
  }

  const drawFishes = () => {
    // Sort fish by depth for proper layering
    const sortedFish = [...fishes].sort((a, b) => a.y - b.y)
    
    for (const f of sortedFish) {
      const x = f.x * width
      const y = f.y * height
      
      // Add subtle glow for rare fish
      if (f.kind === 'rare') {
        ctx.save()
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 20
        drawFish(f, x, y)
        ctx.restore()
      } else {
        drawFish(f, x, y)
      }
    }
  }

  const loop = () => {
    if (!running) return
    const now = performance.now()
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now

    update(dt)

    ctx.clearRect(0, 0, width, height)
    renderBackground()
    drawFishes()
    drawBoatAndHook()

    // draw enhanced particles
    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    
    // draw enhanced score popups
    for (const o of popups) {
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, o.life))
      ctx.font = 'bold 18px Orbitron, monospace'
      ctx.fillStyle = o.color
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.lineWidth = 3
      ctx.textAlign = 'center'
      
      // Text shadow/stroke
      ctx.strokeText(o.text, o.x, o.y - 8)
      ctx.fillText(o.text, o.x, o.y - 8)
      
      // Add glow effect for positive scores
      if (o.color === '#a7f3d0') {
        ctx.shadowColor = '#10b981'
        ctx.shadowBlur = 10
        ctx.fillText(o.text, o.x, o.y - 8)
      }
      
      ctx.restore()
    }

    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  return () => {
    running = false
    ro.disconnect()
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }
}


