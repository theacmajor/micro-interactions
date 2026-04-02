import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, useSpring, useTransform, useMotionValue, useReducedMotion } from 'framer-motion'
import { steps } from './steps.jsx'
import './Stepper.css'

const TOTAL = steps.length
const CARD_GAP = 86

function circularOffset(idx, active, total) {
  let diff = idx - active
  if (diff > total / 2) diff -= total
  if (diff < -total / 2) diff += total
  return diff
}

// Smaller non-active cards with stronger depth
function getVisuals(dist) {
  if (dist === 0) return { scale: 1, opacity: 1, shadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }
  if (dist === 1) return { scale: 0.88, opacity: 0.65, shadow: '0 2px 12px rgba(0,0,0,0.04)' }
  if (dist === 2) return { scale: 0.8, opacity: 0.35, shadow: '0 1px 6px rgba(0,0,0,0.02)' }
  return { scale: 0.74, opacity: 0.15, shadow: 'none' }
}

const easeOut = [0.23, 1, 0.32, 1]

// Smooth spring config for settle animation
const springConfig = { stiffness: 280, damping: 34, mass: 0.5 }

// Ultra-short haptic tick via Web Audio API
let audioCtx = null
let _soundEnabled = true
function setSoundEnabled(v) { _soundEnabled = v }
function playClick() {
  if (!_soundEnabled) return
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const ctx = audioCtx
  const t = ctx.currentTime

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(2400, t)
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.008)

  gain.gain.setValueAtTime(0.12, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(t)
  osc.stop(t + 0.015)
}

export default function Stepper() {
  const [active, setActive] = useState(3)
  const prevActive = useRef(active)
  const shouldReduceMotion = useReducedMotion()
  const containerRef = useRef(null)
  const [soundOn, setSoundOn] = useState(true)

  // Single motion value: continuous "position" in step-space
  // e.g. 3.0 = exactly on step 3, 3.5 = halfway between 3 and 4
  const rawPosition = useMotionValue(3)
  const position = useSpring(rawPosition, springConfig)

  // Drag state
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartPos = useRef(3)
  const dragStartTime = useRef(0)
  const lastDragY = useRef(0)
  const lastDragSnap = useRef(3) // track nearest step during drag for click sound

  const mod = (n) => ((n % TOTAL) + TOTAL) % TOTAL

  const goTo = useCallback((newActive) => {
    const a = mod(newActive)
    setActive((prev) => {
      prevActive.current = prev
      if (prev !== a) playClick()
      return a
    })
    // Find shortest path for the spring so it wraps smoothly
    const current = rawPosition.get()
    let target = a
    while (target - current > TOTAL / 2) target -= TOTAL
    while (target - current < -TOTAL / 2) target += TOTAL
    rawPosition.set(target)
  }, [rawPosition])

  // ── Drag with momentum ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let pointerId = null

    const onPointerDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      if (isDragging.current) return

      isDragging.current = true
      pointerId = e.pointerId
      dragStartY.current = e.clientY
      lastDragY.current = e.clientY
      dragStartPos.current = position.get()
      dragStartTime.current = Date.now()
      lastDragSnap.current = Math.round(position.get())

      // Stop any ongoing spring animation
      rawPosition.jump(position.get())

      el.setPointerCapture(e.pointerId)
      e.preventDefault()
    }

    const onPointerMove = (e) => {
      if (!isDragging.current || e.pointerId !== pointerId) return

      const deltaY = e.clientY - dragStartY.current
      lastDragY.current = e.clientY

      // Convert pixel drag to step-space (negative because drag down = go to previous)
      const stepDelta = -deltaY / CARD_GAP

      // Light damping for overscroll feel
      const damped = stepDelta * 0.85
      const newPos = dragStartPos.current + damped

      rawPosition.jump(newPos)

      // Play click when crossing a step boundary
      const currentSnap = Math.round(newPos)
      if (currentSnap !== lastDragSnap.current) {
        lastDragSnap.current = currentSnap
        playClick()
      }
    }

    const onPointerUp = (e) => {
      if (!isDragging.current || e.pointerId !== pointerId) return
      isDragging.current = false

      const totalDeltaY = e.clientY - dragStartY.current
      const elapsed = Math.max(Date.now() - dragStartTime.current, 1)
      const velocityPx = -totalDeltaY / elapsed // px/ms, negative = scrolled up

      // Project momentum: velocity * decay = extra steps
      const currentPos = rawPosition.get()
      const projectedExtra = velocityPx * 120 / CARD_GAP
      const projectedPos = currentPos + projectedExtra

      // Snap to nearest step
      const snapped = mod(Math.round(projectedPos))

      setActive((prev) => {
        prevActive.current = prev
        if (prev !== snapped) playClick()
        return snapped
      })

      // Let spring animate to the snapped position
      // Handle wrapping smoothly
      let target = snapped
      const current = rawPosition.get()
      // Find shortest path considering wrap
      while (target - current > TOTAL / 2) target -= TOTAL
      while (target - current < -TOTAL / 2) target += TOTAL

      rawPosition.set(target)

      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      pointerId = null
    }

    const onPointerCancel = (e) => {
      if (e.pointerId !== pointerId) return
      isDragging.current = false
      const snapped = mod(Math.round(rawPosition.get()))
      goTo(snapped)
      pointerId = null
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerCancel)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [rawPosition, position, goTo])

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1) }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, goTo])

  // ── Scroll ──
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let accum = 0
    const handler = (e) => {
      e.preventDefault()
      accum += e.deltaY
      if (Math.abs(accum) >= 40) {
        goTo(active + (accum > 0 ? 1 : -1))
        accum = 0
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [active, goTo])

  return (
    <div className="stepper-wrapper">
      <div className="stepper-container" ref={containerRef}>
        {steps.map((step, idx) => (
          <StepCard
            key={idx}
            step={step}
            idx={idx}
            position={position}
            active={active}
            prevActive={prevActive.current}
            goTo={goTo}
          />
        ))}
      </div>

      <div className="controls-row">
        <div className="hint">
          <span className="hint-key">↑</span>
          <span className="hint-key">↓</span>
          <span>scroll or drag to navigate</span>
        </div>

        <div className="sound-row">
          <span className="sound-label">Sound</span>
          <button
            className={`sound-toggle ${soundOn ? 'sound-toggle--on' : ''}`}
            onClick={() => {
              const next = !soundOn
              setSoundOn(next)
              setSoundEnabled(next)
              if (next) playClick()
            }}
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            <div className="sound-toggle-track">
              <div className="sound-toggle-thumb" />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, idx, position, active, prevActive, goTo }) {
  // Derive this card's offset from the continuous position value
  const offset = useTransform(position, (pos) => {
    // Normalize pos into 0..TOTAL range first so it works no matter how far it drifts
    const normalizedPos = ((pos % TOTAL) + TOTAL) % TOTAL
    let diff = idx - normalizedPos
    if (diff > TOTAL / 2) diff -= TOTAL
    if (diff < -TOTAL / 2) diff += TOTAL
    return diff
  })

  const y = useTransform(offset, (o) => o * CARD_GAP)
  const scale = useTransform(offset, (o) => {
    const d = Math.abs(o)
    if (d <= 0) return 1
    if (d >= 3) return 0.74
    // Interpolate
    const stops = [1, 0.88, 0.8, 0.74]
    const floor = Math.floor(d)
    const ceil = Math.min(floor + 1, 3)
    const t = d - floor
    return stops[floor] + (stops[ceil] - stops[floor]) * t
  })
  const opacity = useTransform(offset, (o) => {
    const d = Math.abs(o)
    if (d <= 0) return 1
    if (d >= 3) return 0
    const stops = [1, 0.55, 0.2, 0]
    const floor = Math.floor(d)
    const ceil = Math.min(floor + 1, 3)
    const t = d - floor
    return stops[floor] + (stops[ceil] - stops[floor]) * t
  })
  const blur = useTransform(offset, (o) => {
    const d = Math.abs(o)
    if (d <= 0.2) return 0
    if (d >= 3) return 3
    return Math.min(d * 1.2, 3)
  })
  const filter = useTransform(blur, (b) => `blur(${b.toFixed(1)}px)`)
  const zIndex = useTransform(offset, (o) => 10 - Math.round(Math.abs(o)))

  // Discrete values for non-continuous props
  const dist = Math.abs(circularOffset(idx, active, TOTAL))

  const prevOffset = circularOffset(idx, prevActive, TOTAL)
  const currentOffset = circularOffset(idx, active, TOTAL)
  const moved = prevOffset !== currentOffset

  return (
    <motion.div
      className={`step-card${dist === 0 ? ' step-card--active' : ''}`}
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        marginTop: -38,
        y,
        scale,
        opacity,
        filter,
        zIndex,
        cursor: 'grab',
        pointerEvents: dist > 3 ? 'none' : 'auto',
        touchAction: 'none',
      }}
      // Motion blur keyframes on state change
      animate={{
        filter: moved
          ? ['blur(0px)', 'blur(4px)', 'blur(0px)']
          : undefined,
      }}
      transition={{
        filter: { duration: 0.28, ease: easeOut, times: [0, 0.35, 1] },
      }}
      onClick={() => {
        if (dist !== 0) goTo(idx)
      }}
    >
      <div
        className="step-icon"
        style={{
          transform: dist === 0 ? 'scale(1)' : 'scale(0.88)',
          transition: 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <div className="step-icon-inner" style={{ background: step.color, color: step.iconColor }}>
          {step.icon}
        </div>
      </div>

      <div className="step-content">
        <div
          className="step-label"
          style={{
            color: dist === 0 ? '#1a1a1a' : '#999',
            transition: 'color 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {step.label}
        </div>
        <div
          className="step-sublabel"
          style={{
            color: dist === 0 ? '#aaa' : '#ccc',
            transition: 'color 0.25s cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {step.sub}
        </div>
      </div>

      <div
        key={`num-${idx}-${active}`}
        className={`step-number${moved ? ' step-number--blur' : ''}`}
        style={{
          backgroundColor: dist === 0 ? step.color : '#f0f0f0',
          color: dist === 0 ? step.iconColor : '#bbb',
          transition: 'background-color 0.3s cubic-bezier(0.23, 1, 0.32, 1), color 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        {idx + 1}
      </div>
    </motion.div>
  )
}
