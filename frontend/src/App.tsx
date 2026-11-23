import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type * as THREE from 'three'
import { api } from './api/client'
import type { ProjectConfig, Vehicle } from './api/types'
import ARViewer from './components/ARViewer'
import ConfiguratorPanel from './components/ConfiguratorPanel'
import { DEFAULT_CONFIG } from './config/options'
import Stage from './three/Stage'
import { FALLBACK_VEHICLES } from './vehicles/fallback'
import { checkFitment } from './vehicles/fitment'

type ApiState = 'loading' | 'online' | 'offline'

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(FALLBACK_VEHICLES)
  const [apiState, setApiState] = useState<ApiState>('loading')
  const [vehicleSlug, setVehicleSlug] = useState(FALLBACK_VEHICLES[0].slug)
  const [config, setConfig] = useState<ProjectConfig>(DEFAULT_CONFIG)
  const [projectId, setProjectId] = useState<string | null>(() => new URLSearchParams(location.search).get('projeto'))
  const [projectName, setProjectName] = useState('Meu projeto')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [arOpen, setArOpen] = useState(false)
  const [modelIssues, setModelIssues] = useState<string[]>([])
  const carRef = useRef<THREE.Group>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Carrega o catálogo da API; sem API, usa os carros locais.
  useEffect(() => {
    api.listVehicles()
      .then((list) => {
        if (list.length > 0) setVehicles(list)
        setApiState('online')
      })
      .catch(() => setApiState('offline'))
  }, [])

  // Abre um projeto salvo (?projeto=<id>).
  useEffect(() => {
    if (!projectId || apiState !== 'online') return
    api.getProject(projectId)
      .then((p) => {
        setVehicleSlug(p.vehicleSlug)
        setConfig({ ...DEFAULT_CONFIG, ...p.config })
        setProjectName(p.name)
      })
      .catch(() => setToast('Não encontrei esse projeto.'))
    // só na primeira vez que a API responde
  }, [apiState])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const vehicle = vehicles.find((v) => v.slug === vehicleSlug) ?? vehicles[0]
  const fit = useMemo(() => checkFitment(vehicle.specs, config), [vehicle, config])
  const onChange = useCallback((patch: Partial<ProjectConfig>) => setConfig((c) => ({ ...c, ...patch })), [])
  const onIssues = useCallback((issues: string[]) => setModelIssues(issues), [])

  const selectVehicle = (slug: string) => {
    setVehicleSlug(slug)
    setModelIssues([])
  }

  const save = async () => {
    if (apiState !== 'online') {
      setToast('A API não está rodando: não dá para salvar agora.')
      return
    }
    setSaving(true)
    try {
      const body = { name: projectName.trim() || 'Meu projeto', vehicleSlug: vehicle.slug, config }
      const saved = projectId ? await api.updateProject(projectId, body) : await api.createProject(body)
      setProjectId(saved.id)
      const url = new URL(location.href)
      url.searchParams.set('projeto', saved.id)
      history.replaceState(null, '', url)
      setToast('Projeto salvo!')
    } catch {
      setToast('Não consegui salvar o projeto.')
    } finally {
      setSaving(false)
    }
  }

  const photo = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'car-project.png'
    a.click()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">CAR</span>
          <span className="logo-2">PROJECT</span>
          <span className={`api-dot ${apiState}`} title={apiState === 'online' ? 'API conectada' : apiState === 'offline' ? 'API desligada: usando carros locais' : 'Conectando…'} />
        </div>
        <div className="top-actions">
          <button className="btn ghost" onClick={photo}>Foto</button>
          <button className="btn primary" onClick={() => setArOpen(true)}>Ver em AR</button>
        </div>
      </header>

      <main className="stage">
        <Stage vehicle={vehicle} config={config} carRef={carRef} canvasRef={canvasRef} onIssues={onIssues} />
        <div className="hud">
          <div className="hud-title">
            <small>{vehicle.brand ?? 'Seu carro'}</small>
            <strong>{vehicle.name}</strong>
          </div>
          <div className="stats">
            <div><small>Pneu</small><b>{fit.tire}</b></div>
            <div><small>Vão livre</small><b>{fit.groundClearanceCm} cm</b></div>
            <div><small>Folga no para-lama</small><b>{fit.archGapMm} mm</b></div>
          </div>
          {fit.warnings.length > 0 && (
            <ul className="warnings">
              {fit.warnings.map((w) => <li key={w.text} className={w.level}>{w.text}</li>)}
            </ul>
          )}
          {modelIssues.length > 0 && (
            <ul className="warnings">
              {modelIssues.map((i) => <li key={i} className="warn">Modelo fora do padrão: {i}</li>)}
            </ul>
          )}
        </div>
      </main>

      <aside className="panel">
        <ConfiguratorPanel vehicles={vehicles} vehicle={vehicle} onVehicle={selectVehicle} config={config} onChange={onChange} />
        <section className="section save">
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} aria-label="Nome do projeto" maxLength={120} />
          <button className="btn primary full" onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : projectId ? 'Salvar alterações' : 'Salvar projeto'}
          </button>
          <button className="btn ghost full" onClick={() => setConfig(DEFAULT_CONFIG)}>Voltar ao original</button>
        </section>
      </aside>

      {arOpen && carRef.current && <ARViewer object={carRef.current} onClose={() => setArOpen(false)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
