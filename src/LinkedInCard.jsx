import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useSpring, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'

// Soft tonal tick — pitched to the bar value for a musical feel
let audioCtx = null
let _soundEnabled = true
function setSoundEnabled(v) { _soundEnabled = v }
function playTick(barValue, maxValue) {
  if (!_soundEnabled) return
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const ctx = audioCtx
  const t = ctx.currentTime

  const ratio = barValue / maxValue
  const freq = 300 + ratio * 900

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, t)

  gain.gain.setValueAtTime(0.08, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(t)
  osc.stop(t + 0.04)
}

// Mock data — follower growth Jan to Apr
const data = [
  { month: 'Jan', values: [10, 14, 8, 12, 16, 11, 9, 15, 13, 17] },
  { month: 'Feb', values: [18, 22, 15, 20, 24, 19, 16, 21, 23, 25] },
  { month: 'Mar', values: [26, 30, 22, 28, 34, 25, 31, 36, 29, 33] },
  { month: 'Apr', values: [34, 40, 30, 38, 42, 36, 44, 46, 41, 48] },
]

const allBars = data.flatMap((d, mi) =>
  d.values.map((v) => ({ value: v, monthIndex: mi }))
)

const maxVal = Math.max(...allBars.map((b) => b.value))
const TOTAL_BARS = allBars.length
const BAR_WIDTH = 3
const BAR_GAP = 5
const CHART_WIDTH = TOTAL_BARS * (BAR_WIDTH + BAR_GAP) - BAR_GAP
const CHART_HEIGHT = 240
const ACTIVE_BAR_WIDTH = 5

const tooltipValues = ['+12', '+18', '+26', '+34']

const springConfig = { stiffness: 200, damping: 30, mass: 0.2 }

// Easing
const easeOut = [0.23, 1, 0.32, 1]

export default function LinkedInCard() {
  const [hoveredBar, setHoveredBar] = useState(null)
  const [isHovering, setIsHovering] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [animKey, setAnimKey] = useState(0)
  const prevBar = useRef(null)
  const chartRef = useRef(null)

  // Smooth spring-driven tooltip position
  const tipX = useMotionValue(0)
  const tipY = useMotionValue(0)
  const springX = useSpring(tipX, springConfig)
  const springY = useSpring(tipY, springConfig)

  // Rolling number for tooltip
  const rawNum = useMotionValue(0)
  const springNum = useSpring(rawNum, { stiffness: 800, damping: 50, mass: 0.1 })

  const handleMouseMove = useCallback((e) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const barIdx = Math.floor(x / (BAR_WIDTH + BAR_GAP))
    const clamped = Math.max(0, Math.min(TOTAL_BARS - 1, barIdx))

    if (prevBar.current !== clamped) {
      playTick(allBars[clamped].value, maxVal)
    }
    prevBar.current = clamped
    setHoveredBar(clamped)
    setIsHovering(true)

    const barCenterX = clamped * (BAR_WIDTH + BAR_GAP) + BAR_WIDTH / 2
    const barTopY = CHART_HEIGHT - (allBars[clamped].value / maxVal) * (CHART_HEIGHT - 16)
    tipX.set(barCenterX)
    tipY.set(barTopY)
    rawNum.set(allBars[clamped].value)
  }, [tipX, tipY, rawNum])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoveredBar(null)
    prevBar.current = null
  }, [])

  const activeMonth = hoveredBar !== null ? allBars[hoveredBar].monthIndex : null

  // Intro animation delays
  const CARD_DELAY = 0
  const TITLE_DELAY = 0.15
  const SUBTITLE_DELAY = 0.3
  const BUTTON_DELAY = 0.4
  const BARS_START = 0.5
  const BAR_STAGGER = 0.015
  const LABELS_DELAY = BARS_START + TOTAL_BARS * BAR_STAGGER + 0.1
  const DIVIDER_DELAY = LABELS_DELAY + 0.15
  const METRICS_DELAY = DIVIDER_DELAY + 0.2

  return (
    <motion.div
      key={animKey}
      className="relative"
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: easeOut, delay: CARD_DELAY }}
    >
      <motion.div
        className="relative cursor-default select-none"
        style={{
          width: CHART_WIDTH + 80,
          borderRadius: 32,
          overflow: 'hidden',
          padding: '36px 40px 36px',
          background: 'linear-gradient(155deg, #1B3A5C 0%, #14283D 50%, #0F1F30 100%)',
        }}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-16">
          <div>
            <motion.h2
              className="text-[28px] font-bold tracking-tight leading-none"
              style={{ color: '#E8EDF2' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: TITLE_DELAY }}
            >
              Followers
            </motion.h2>
            <motion.p
              className="text-[20px] font-medium mt-1"
              style={{ color: '#4A6D8C' }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: easeOut, delay: SUBTITLE_DELAY }}
            >
              LinkedIn Growth
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: easeOut, delay: BUTTON_DELAY }}
          >
            <MagneticButton />
          </motion.div>
        </div>

        {/* Chart area */}
        <div
          ref={chartRef}
          className="relative"
          style={{ width: CHART_WIDTH, height: CHART_HEIGHT + 36 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Tooltip */}
          <AnimatePresence>
            {isHovering && hoveredBar !== null && (
              <motion.div
                className="absolute pointer-events-none z-10"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15, ease: easeOut }}
                style={{
                  left: springX,
                  top: springY,
                  x: '-50%',
                  y: -52,
                }}
              >
                <div
                  className="rounded-[12px] text-[13px] font-bold whitespace-nowrap"
                  style={{
                    padding: '8px 16px',
                    background: '#0D1B2A',
                    color: '#A8C8E0',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    letterSpacing: '0.01em',
                  }}
                >
                  <span className="inline-flex items-center">
                    <span style={{ marginRight: 1 }}>+</span>
                    <RollingNumber value={springNum} />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cursor dot */}
          <AnimatePresence>
            {isHovering && hoveredBar !== null && (
              <motion.div
                className="absolute pointer-events-none z-10"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.12 }}
                style={{
                  left: springX,
                  top: springY,
                  x: -4,
                  y: -4,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#A8D4F0',
                  boxShadow: '0 0 12px rgba(168, 212, 240, 0.5)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Bars — grow from bottom with stagger */}
          <svg
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            className="block"
          >
            {allBars.map((bar, i) => {
              const barHeight = (bar.value / maxVal) * (CHART_HEIGHT - 16)
              const isActive = isHovering && hoveredBar === i
              const isActiveMonth = isHovering && bar.monthIndex === activeMonth
              const isInactive = isHovering && !isActiveMonth

              const w = isActive ? ACTIVE_BAR_WIDTH : BAR_WIDTH
              const xOffset = isActive ? (ACTIVE_BAR_WIDTH - BAR_WIDTH) / 2 : 0
              const x = i * (BAR_WIDTH + BAR_GAP) - xOffset

              let fill = 'rgba(86, 160, 211, 0.3)'
              if (isActive) fill = '#A8D4F0'
              else if (isActiveMonth) fill = 'rgba(86, 160, 211, 0.5)'
              else if (isInactive) fill = 'rgba(86, 160, 211, 0.12)'

              return (
                <motion.rect
                  key={i}
                  x={x}
                  width={w}
                  rx={isActive ? 2.5 : 1.5}
                  fill={fill}
                  initial={{ y: CHART_HEIGHT, height: 0 }}
                  animate={{ y: CHART_HEIGHT - barHeight, height: barHeight }}
                  transition={{
                    duration: 0.6,
                    ease: easeOut,
                    delay: BARS_START + i * BAR_STAGGER,
                  }}
                  style={{
                    transition: 'fill 0.2s cubic-bezier(0.23, 1, 0.32, 1), width 0.15s ease, x 0.15s ease',
                  }}
                />
              )
            })}
          </svg>

          {/* Month labels — fade in after bars */}
          <div
            className="flex justify-between"
            style={{ width: CHART_WIDTH, marginTop: 14 }}
          >
            {data.map((d, mi) => {
              const isActive = isHovering && mi === activeMonth
              return (
                <motion.span
                  key={mi}
                  className="text-[11px] font-medium tracking-wide"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: easeOut, delay: LABELS_DELAY + mi * 0.05 }}
                  style={{
                    width: d.values.length * (BAR_WIDTH + BAR_GAP) - BAR_GAP,
                    textAlign: 'left',
                    color: isActive ? '#8AB8D8' : '#2E4A62',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {d.month}
                </motion.span>
              )
            })}
          </div>
        </div>

        {/* Divider — wipe from left */}
        <motion.div
          style={{ height: 1, background: 'rgba(255, 255, 255, 0.05)', marginTop: 28, marginBottom: 20 }}
          initial={{ scaleX: 0, transformOrigin: 'left' }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: easeOut, delay: DIVIDER_DELAY }}
        />

        {/* Bottom metrics — slide up with count */}
        <div className="flex justify-between items-end" style={{ paddingTop: 0 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: METRICS_DELAY }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2 whitespace-nowrap"
              style={{ color: '#3A5A78' }}
            >
              Total Followers
            </p>
            <p
              className="text-[42px] font-bold tracking-tight leading-none"
              style={{ color: '#D4E0EB' }}
            >
              <CountUp target={3076} delay={METRICS_DELAY} />
            </p>
          </motion.div>
          <motion.div
            className="text-right"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: METRICS_DELAY + 0.1 }}
          >
            <p
              className="text-[10px] font-semibold tracking-[0.15em] uppercase mb-2 whitespace-nowrap"
              style={{ color: '#3A5A78' }}
            >
              New Followers
            </p>
            <p
              className="text-[42px] font-bold tracking-tight leading-none"
              style={{ color: '#D4E0EB' }}
            >
              <CountUp target={126} delay={METRICS_DELAY + 0.1} />
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex items-center justify-between"
        style={{ width: CHART_WIDTH + 80, marginTop: 20, padding: '0 40px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: METRICS_DELAY + 0.4 }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: '#b0b0b0', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Hover to explore
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAnimKey((k) => k + 1)}
            aria-label="Replay animation"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#b0b0b0',
              borderRadius: 6,
              transition: 'color 0.15s ease',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#888'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#b0b0b0'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <div style={{ width: 1, height: 14, background: '#ddd' }} />
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, fontWeight: 500, color: '#b0b0b0', letterSpacing: '0.01em', fontFamily: "'Inter', sans-serif" }}>Sound</span>
            <button
              onClick={() => {
                const next = !soundOn
                setSoundOn(next)
                setSoundEnabled(next)
                if (next) playTick(30, maxVal)
              }}
              aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
              style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer', outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <div style={{ width: 34, height: 20, borderRadius: 10, background: soundOn ? '#34C759' : '#ddd', padding: 2, transition: 'background 0.2s cubic-bezier(0.23, 1, 0.32, 1)', display: 'flex', alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, background: '#fff', boxShadow: '0 0.5px 2px rgba(0,0,0,0.15)', transform: soundOn ? 'translateX(14px)' : 'translateX(0)', transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)' }} />
              </div>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Count up from 0 to target with comma formatting
function CountUp({ target, delay = 0 }) {
  const [display, setDisplay] = useState(0)
  const value = useMotionValue(0)
  const spring = useSpring(value, { stiffness: 100, damping: 30, mass: 0.5 })

  useEffect(() => {
    const timeout = setTimeout(() => {
      value.set(target)
    }, delay * 1000)
    return () => clearTimeout(timeout)
  }, [target, delay, value])

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      setDisplay(Math.round(v))
    })
    return unsub
  }, [spring])

  return <>{display.toLocaleString()}</>
}

// Slot-machine digit roller
function RollingNumber({ value }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const unsub = value.on('change', (v) => {
      setDisplay(Math.round(v))
    })
    return unsub
  }, [value])

  const digits = String(display).split('')

  return (
    <span className="inline-flex" style={{ lineHeight: 1 }}>
      {digits.map((d, i) => (
        <DigitSlot key={digits.length - i} digit={parseInt(d)} />
      ))}
    </span>
  )
}

// Magnetic button
function MagneticButton() {
  const btnRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 250, damping: 20, mass: 0.3 })
  const springY = useSpring(y, { stiffness: 250, damping: 20, mass: 0.3 })

  const MAGNETIC_RADIUS = 80
  const STRENGTH = 0.35

  const handleMouseMove = useCallback((e) => {
    const el = btnRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = e.clientX - centerX
    const distY = e.clientY - centerY
    const dist = Math.sqrt(distX * distX + distY * distY)

    if (dist < MAGNETIC_RADIUS) {
      const pull = (1 - dist / MAGNETIC_RADIUS) * STRENGTH
      x.set(distX * pull)
      y.set(distY * pull)
    } else {
      x.set(0)
      y.set(0)
    }
  }, [x, y])

  const handleMouseLeave = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  useEffect(() => {
    const card = btnRef.current?.closest('.relative')?.parentElement
    if (!card) return
    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <motion.button
      ref={btnRef}
      className="flex items-center justify-center rounded-full"
      style={{
        width: 40,
        height: 40,
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        x: springX,
        y: springY,
      }}
      whileHover={{
        background: 'rgba(255, 255, 255, 0.14)',
        scale: 1.1,
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#7BA3C4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </svg>
    </motion.button>
  )
}

const DIGIT_HEIGHT = 17

function DigitSlot({ digit }) {
  const targetY = -digit * DIGIT_HEIGHT
  const y = useMotionValue(targetY)
  const springY = useSpring(y, { stiffness: 900, damping: 45, mass: 0.1 })
  const velocity = useRef(0)
  const [blur, setBlur] = useState(0)

  useEffect(() => {
    const unsub = springY.on('change', () => {
      velocity.current = springY.getVelocity()
      const absV = Math.abs(velocity.current)
      setBlur(Math.min(absV / 300, 2.5))
    })
    return unsub
  }, [springY])

  useEffect(() => {
    y.set(targetY)
  }, [targetY, y])

  return (
    <span
      className="inline-block overflow-hidden relative"
      style={{
        width: '0.6em',
        height: DIGIT_HEIGHT,
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
      }}
    >
      <motion.span
        className="block"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          y: springY,
          filter: `blur(${blur}px)`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span
            key={n}
            className="block text-center"
            style={{ height: DIGIT_HEIGHT, lineHeight: `${DIGIT_HEIGHT}px` }}
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}
