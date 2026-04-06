import { useEffect, useState } from 'react'
import './CloudDrift.css'

// Clouds placed carefully — no overlapping, spread across the scene
// x is ignored now — horizontal position is driven entirely by the animation + delay
// y controls vertical placement, clouds are spread across different heights
const clouds = [
  // Row 1
  { y: -2, size: 16, src: '/cloud 01.svg', layer: 'back', float: 'drift-r-1' },
  { y: 0, size: 20, src: '/cloud 03.svg', layer: 'mid', float: 'drift-l-1' },
  { y: 2, size: 14, src: '/cloud 02.svg', layer: 'front', float: 'drift-r-5' },

  // Row 2
  { y: 10, size: 18, src: '/cloud 04.svg', layer: 'back', float: 'drift-l-5' },
  { y: 12, size: 15, src: '/cloud 01.svg', layer: 'mid', float: 'drift-r-2' },
  { y: 14, size: 12, src: '/cloud 02.svg', layer: 'front', float: 'drift-l-2' },

  // Row 3
  { y: 22, size: 17, src: '/cloud 03.svg', layer: 'back', float: 'drift-r-6' },
  { y: 24, size: 14, src: '/cloud 04.svg', layer: 'mid', float: 'drift-l-6' },

  // Row 4 — person zone, behind
  { y: 32, size: 16, src: '/cloud 01.svg', layer: 'back', float: 'drift-r-3' },
  { y: 34, size: 13, src: '/cloud 02.svg', layer: 'back', float: 'drift-l-3' },

  // Row 5 — person zone, in front
  { y: 44, size: 15, src: '/cloud 03.svg', layer: 'front', float: 'drift-r-7' },
  { y: 46, size: 12, src: '/cloud 04.svg', layer: 'front', float: 'drift-l-7' },

  // Row 6
  { y: 54, size: 18, src: '/cloud 01.svg', layer: 'mid', float: 'drift-r-4' },
  { y: 56, size: 14, src: '/cloud 02.svg', layer: 'back', float: 'drift-l-4' },
  { y: 58, size: 11, src: '/cloud 03.svg', layer: 'front', float: 'drift-r-8' },

  // Row 7
  { y: 66, size: 20, src: '/cloud 04.svg', layer: 'back', float: 'drift-l-1' },
  { y: 68, size: 15, src: '/cloud 01.svg', layer: 'mid', float: 'drift-r-1' },
  { y: 70, size: 13, src: '/cloud 02.svg', layer: 'front', float: 'drift-l-5' },

  // Row 8
  { y: 78, size: 17, src: '/cloud 03.svg', layer: 'back', float: 'drift-r-5' },
  { y: 80, size: 14, src: '/cloud 04.svg', layer: 'mid', float: 'drift-l-2' },
  { y: 82, size: 12, src: '/cloud 01.svg', layer: 'front', float: 'drift-r-2' },

  // Row 9 — bottom
  { y: 90, size: 19, src: '/cloud 02.svg', layer: 'back', float: 'drift-l-6' },
  { y: 92, size: 16, src: '/cloud 03.svg', layer: 'mid', float: 'drift-r-6' },
  { y: 94, size: 13, src: '/cloud 04.svg', layer: 'front', float: 'drift-l-7' },
]

const parallaxStrength = {
  back: { x: -3, y: -2 },
  mid: { x: -1.5, y: -1 },
  person: { x: 0.5, y: 0.3 },
  front: { x: 2.5, y: 1.5 },
}

export default function CloudDrift() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Small delay then fade everything in
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2
      const y = (e.clientY / window.innerHeight - 0.5) * 2
      setMouse({ x, y })
    }
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  const layerTransform = (layer) => {
    const s = parallaxStrength[layer]
    return `translate(${mouse.x * s.x}px, ${mouse.y * s.y}px)`
  }

  const backClouds = clouds.filter(c => c.layer === 'back')
  const midClouds = clouds.filter(c => c.layer === 'mid')
  const frontClouds = clouds.filter(c => c.layer === 'front')

  return (
    <div className="cloud-page">
      <div className={`cloud-frame ${visible ? 'scene-visible' : 'scene-hidden'}`}>
        <div className="cloud-scene">
          <div className="cloud-layer" style={{ transform: layerTransform('back'), zIndex: 1 }}>
            {backClouds.map((c, i) => <CloudItem key={`b${i}`} y={c.y} size={c.size} src={c.src} float={c.float} />)}
          </div>

          <div className="cloud-layer" style={{ transform: layerTransform('mid'), zIndex: 2 }}>
            {midClouds.map((c, i) => <CloudItem key={`m${i}`} y={c.y} size={c.size} src={c.src} float={c.float} />)}
          </div>

          <div className="cloud-layer" style={{ transform: layerTransform('person'), zIndex: 3 }}>
            <div
              className="person drift-person"
              style={{ left: '33%', top: '30%', width: '34%' }}
            >
              <img src="/Person on cloud.png" alt="Tired person draped over a cloud" />
            </div>
          </div>

          <div className="cloud-layer" style={{ transform: layerTransform('front'), zIndex: 4 }}>
            {frontClouds.map((c, i) => <CloudItem key={`f${i}`} y={c.y} size={c.size} src={c.src} float={c.float} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

function CloudItem({ y, size, src, float }) {
  return (
    <div
      className={`cloud ${float}`}
      style={{ left: 0, top: `${y}%`, width: `${size}vw` }}
    >
      <img src={src} alt="" />
    </div>
  )
}
