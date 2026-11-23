import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import Car from './car/Car'
import { BODIES } from './car/bodies'
import { checkFitment } from './car/specs'
import ARViewer from './ui/ARViewer'
import { decodeConfig, shareUrl } from './ui/share'
import {
  BODY_TYPES, CATALOG, PAINT_COLORS, FINISHES, WHEEL_STYLES, RIM_COLORS, CALIPER_COLORS, RIM_SIZES, DEFAULT_CONFIG,
} from './data/options'

function Scene({ cfg, carRef, autoRotate }) {
  return (
    <>
      <color attach="background" args={['#15181d']} />
      <fog attach="fog" args={['#15181d', 14, 30]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 4]} intensity={1.6} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 1]} rotation-y={Math.PI / 2} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 2, -1]} rotation-y={-Math.PI / 2} scale={[12, 2, 1]} />
        <Lightformer form="ring" color="#ffb38a" intensity={1.5} position={[0, 3, -9]} scale={4} />
      </Environment>
      <Car cfg={cfg} ref={carRef} />
      <ContactShadows position={[0, 0.002, 0]} opacity={0.75} scale={9} blur={2.4} far={2.5} resolution={512} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial color="#1c2026" roughness={0.95} />
      </mesh>
      <OrbitControls
        target={[0, 0.65, 0]}
        enablePan={false}
        minDistance={3.4}
        maxDistance={11}
        maxPolarAngle={Math.PI / 2 - 0.04}
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        makeDefault
      />
    </>
  )
}

function Section({ n, title, children }) {
  return (
    <section className="section">
      <h3><span>{n}</span>{title}</h3>
      {children}
    </section>
  )
}

function Chips({ options, value, onChange }) {
  return (
    <div className="chips">
      {Object.entries(options).map(([k, label]) => (
        <button key={k} className={`chip ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>
          {typeof label === 'string' ? label : label.label}
        </button>
      ))}
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, unit, onChange, format }) {
  return (
    <label className="slider">
      <span className="slider-top">
        <span>{label}</span>
        <b>{format ? format(value) : `${value}${unit ?? ''}`}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export default function App() {
  const [cfg, setCfg] = useState(() => decodeConfig(window.location.hash) ?? DEFAULT_CONFIG)
  const [query, setQuery] = useState(cfg.model)
  const [showList, setShowList] = useState(false)
  const [arOpen, setArOpen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [toast, setToast] = useState(null)
  const carRef = useRef()
  const canvasRef = useRef()

  const set = (patch) => setCfg((c) => ({ ...c, ...patch }))
  const fit = useMemo(() => checkFitment(cfg, BODIES[cfg.body]), [cfg])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CATALOG.filter((m) => !q || m.name.toLowerCase().includes(q)).slice(0, 8)
  }, [query])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const pickModel = (m) => {
    set({ model: m.name, body: m.body })
    setQuery(m.name)
    setShowList(false)
  }

  const share = async () => {
    const url = shareUrl(cfg)
    window.history.replaceState(null, '', url)
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meu projeto no Car Project', url })
        return
      }
      await navigator.clipboard.writeText(url)
      setToast('Link do projeto copiado!')
    } catch {
      setToast('Copie o link na barra de endereço.')
    }
  }

  const photo = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `car-project-${(cfg.model || BODY_TYPES[cfg.body]).toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  const reset = () => {
    setCfg(DEFAULT_CONFIG)
    setQuery('')
    window.history.replaceState(null, '', window.location.pathname)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">CAR</span>
          <span className="logo-2">PROJECT</span>
        </div>
        <div className="top-actions">
          <button className="btn ghost" onClick={photo} title="Baixar foto">📷 <span className="hide-sm">Foto</span></button>
          <button className="btn ghost" onClick={share} title="Compartilhar">🔗 <span className="hide-sm">Compartilhar</span></button>
          <button className="btn primary" onClick={() => setArOpen(true)}>Ver em AR</button>
        </div>
      </header>

      <main className="stage">
        <Canvas
          ref={canvasRef}
          dpr={[1, 2]}
          camera={{ position: [5.2, 2.1, 5.6], fov: 34 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          onPointerDown={() => setAutoRotate(false)}
        >
          <Suspense fallback={null}>
            <Scene cfg={cfg} carRef={carRef} autoRotate={autoRotate} />
          </Suspense>
        </Canvas>

        <div className="hud">
          <div className="hud-title">
            <small>{cfg.model ? 'Seu carro' : 'Carroceria'}</small>
            <strong>{cfg.model || BODY_TYPES[cfg.body]}</strong>
          </div>
          <div className="stats">
            <div><small>Pneu</small><b>{fit.tire}</b></div>
            <div><small>Vão livre</small><b>{fit.groundClearance} cm</b></div>
            <div><small>Folga no para-lama</small><b>{fit.archGapMm} mm</b></div>
          </div>
          {fit.warnings.length > 0 && (
            <ul className="warnings">
              {fit.warnings.map((w) => (
                <li key={w.text} className={w.level}>{w.text}</li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <aside className="panel">
        <Section n="1" title="Seu carro">
          <div className="search">
            <input
              value={query}
              placeholder="Busque: Onix, HB20, Gol, Strada…"
              onFocus={() => setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 150)}
              onChange={(e) => { setQuery(e.target.value); setShowList(true) }}
            />
            {showList && matches.length > 0 && (
              <ul className="results">
                {matches.map((m) => (
                  <li key={m.name}>
                    <button onMouseDown={() => pickModel(m)}>
                      {m.name} <em>{BODY_TYPES[m.body]}</em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Chips options={BODY_TYPES} value={cfg.body} onChange={(body) => { set({ body, model: '' }); setQuery('') }} />
          {cfg.model && <p className="note">Usando o modelo 3D genérico de {BODY_TYPES[cfg.body].toLowerCase()}. O modelo exato do {cfg.model} entra no catálogo em breve.</p>}
        </Section>

        <Section n="2" title="Pintura">
          <div className="swatches">
            {PAINT_COLORS.map((c) => (
              <button
                key={c.hex}
                className={`swatch ${cfg.paint === c.hex ? 'on' : ''}`}
                style={{ background: c.hex }}
                title={c.name}
                aria-label={c.name}
                onClick={() => set({ paint: c.hex })}
              />
            ))}
            <label className="swatch custom" title="Cor personalizada">
              <input type="color" value={cfg.paint} onChange={(e) => set({ paint: e.target.value })} />
              +
            </label>
          </div>
          <Chips options={FINISHES} value={cfg.finish} onChange={(finish) => set({ finish })} />
        </Section>

        <Section n="3" title="Rodas e pneus">
          <div className="field-label">Aro</div>
          <div className="chips">
            {RIM_SIZES.map((r) => (
              <button key={r} className={`chip ${cfg.rim === r ? 'on' : ''}`} onClick={() => set({ rim: r })}>{r}"</button>
            ))}
          </div>
          <div className="field-label">Modelo da roda</div>
          <Chips options={WHEEL_STYLES} value={cfg.wheelStyle} onChange={(wheelStyle) => set({ wheelStyle })} />
          <div className="field-label">Cor da roda</div>
          <div className="swatches small">
            {Object.entries(RIM_COLORS).map(([k, c]) => (
              <button key={k} className={`swatch ${cfg.rimColor === k ? 'on' : ''}`} style={{ background: c.hex }} title={c.label} aria-label={c.label} onClick={() => set({ rimColor: k })} />
            ))}
          </div>
          <div className="field-label">Pinça de freio</div>
          <div className="swatches small">
            {CALIPER_COLORS.map((c) => (
              <button key={c.hex} className={`swatch ${cfg.caliper === c.hex ? 'on' : ''}`} style={{ background: c.hex }} title={c.name} aria-label={c.name} onClick={() => set({ caliper: c.hex })} />
            ))}
          </div>
          <Slider label="Roda para fora" value={cfg.track} min={-10} max={40} unit=" mm" onChange={(track) => set({ track })} />
        </Section>

        <Section n="4" title="Suspensão">
          <Slider
            label="Altura"
            value={cfg.height}
            min={-90}
            max={60}
            step={5}
            onChange={(height) => set({ height })}
            format={(v) => (v === 0 ? 'Original' : v < 0 ? `Rebaixado ${-v} mm` : `Elevado ${v} mm`)}
          />
          <Slider label="Cambagem" value={cfg.camber} min={0} max={10} step={0.5} unit="°" onChange={(camber) => set({ camber })} />
        </Section>

        <Section n="5" title="Extras">
          <Slider label="Insulfilm" value={cfg.tint} min={0} max={95} step={5} unit="%" onChange={(tint) => set({ tint })} />
          <label className="toggle">
            <input type="checkbox" checked={cfg.spoiler} onChange={(e) => set({ spoiler: e.target.checked })} />
            <span>{cfg.body === 'picape' ? 'Santo Antônio' : 'Aerofólio'}</span>
          </label>
        </Section>

        <button className="btn ghost full" onClick={reset}>Recomeçar do zero</button>
      </aside>

      {arOpen && carRef.current && <ARViewer object={carRef.current} onClose={() => setArOpen(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
