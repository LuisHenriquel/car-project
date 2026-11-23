import type { ReactNode } from 'react'
import type { ProjectConfig, Vehicle } from '../api/types'
import {
  BODY_LABELS, CALIPER_COLORS, FINISHES, PAINT_COLORS, RIM_COLORS, RIM_SIZES, WHEEL_STYLES,
} from '../config/options'

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h3><span>{n}</span>{title}</h3>
      {children}
    </section>
  )
}

function Chips<K extends string>({ options, value, onChange }: { options: Record<K, string>; value: K; onChange: (k: K) => void }) {
  return (
    <div className="chips">
      {(Object.keys(options) as K[]).map((k) => (
        <button key={k} className={`chip ${value === k ? 'on' : ''}`} onClick={() => onChange(k)}>
          {options[k]}
        </button>
      ))}
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, onChange, format }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format: (v: number) => string
}) {
  return (
    <label className="slider">
      <span className="slider-top">
        <span>{label}</span>
        <b>{format(value)}</b>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

function Swatches({ items, value, onChange, small }: { items: { name: string; hex: string }[]; value: string; onChange: (hex: string) => void; small?: boolean }) {
  return (
    <div className={`swatches ${small ? 'small' : ''}`}>
      {items.map((c) => (
        <button
          key={c.hex}
          className={`swatch ${value === c.hex ? 'on' : ''}`}
          style={{ background: c.hex }}
          title={c.name}
          aria-label={c.name}
          onClick={() => onChange(c.hex)}
        />
      ))}
    </div>
  )
}

interface Props {
  vehicles: Vehicle[]
  vehicle: Vehicle
  onVehicle: (slug: string) => void
  config: ProjectConfig
  onChange: (patch: Partial<ProjectConfig>) => void
}

const finishLabels = Object.fromEntries(Object.entries(FINISHES).map(([k, v]) => [k, v.label])) as Record<ProjectConfig['paintFinish'], string>
const rimColorLabels = Object.fromEntries(Object.entries(RIM_COLORS).map(([k, v]) => [k, v.label])) as Record<ProjectConfig['rimColor'], string>

export default function ConfiguratorPanel({ vehicles, vehicle, onVehicle, config, onChange }: Props) {
  return (
    <>
      <Section n={1} title="Seu carro">
        <div className="vehicle-list">
          {vehicles.map((v) => (
            <button key={v.slug} className={`vehicle ${v.slug === vehicle.slug ? 'on' : ''}`} onClick={() => onVehicle(v.slug)}>
              <b>{v.name}</b>
              <small>{BODY_LABELS[v.bodyType]} · {v.modelUrl ? 'modelo 3D' : 'carro simples'}</small>
            </button>
          ))}
        </div>
      </Section>

      <Section n={2} title="Pintura">
        <Swatches items={PAINT_COLORS} value={config.paintColor} onChange={(paintColor) => onChange({ paintColor })} />
        <label className="custom-color">
          <input type="color" value={config.paintColor} onChange={(e) => onChange({ paintColor: e.target.value })} />
          Outra cor
        </label>
        <Chips options={finishLabels} value={config.paintFinish} onChange={(paintFinish) => onChange({ paintFinish })} />
      </Section>

      <Section n={3} title="Rodas e pneus">
        <div className="field-label">Aro</div>
        <div className="chips">
          {RIM_SIZES.map((r) => (
            <button key={r} className={`chip ${config.rimInches === r ? 'on' : ''}`} onClick={() => onChange({ rimInches: r })}>{r}"</button>
          ))}
        </div>
        <div className="field-label">Modelo da roda</div>
        <Chips options={WHEEL_STYLES} value={config.wheelStyle} onChange={(wheelStyle) => onChange({ wheelStyle })} />
        <div className="field-label">Cor da roda</div>
        <Chips options={rimColorLabels} value={config.rimColor} onChange={(rimColor) => onChange({ rimColor })} />
        <div className="field-label">Pinça de freio</div>
        <Swatches small items={CALIPER_COLORS} value={config.caliperColor} onChange={(caliperColor) => onChange({ caliperColor })} />
        <Slider label="Roda para fora" value={config.trackMm} min={-10} max={40} onChange={(trackMm) => onChange({ trackMm })} format={(v) => `${v} mm`} />
      </Section>

      <Section n={4} title="Suspensão">
        <Slider
          label="Altura"
          value={config.rideHeightMm}
          min={-90}
          max={60}
          step={5}
          onChange={(rideHeightMm) => onChange({ rideHeightMm })}
          format={(v) => (v === 0 ? 'Original' : v < 0 ? `Rebaixado ${-v} mm` : `Elevado ${v} mm`)}
        />
        <Slider label="Cambagem" value={config.camberDeg} min={0} max={10} step={0.5} onChange={(camberDeg) => onChange({ camberDeg })} format={(v) => `${v}°`} />
      </Section>

      <Section n={5} title="Vidros">
        <Slider label="Insulfilm" value={config.windowTint} min={0} max={95} step={5} onChange={(windowTint) => onChange({ windowTint })} format={(v) => `${v}%`} />
      </Section>
    </>
  )
}
