import { useEffect, useState } from 'react'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Exporta o carro montado para GLB e abre no <model-viewer>,
// que cuida da realidade aumentada:
//  - Android (Chrome): WebXR / Scene Viewer
//  - iPhone (Safari): Quick Look (o model-viewer converte para USDZ sozinho)
// O modelo está em escala real (metros), então aparece no chão em tamanho 1:1.

export default function ARViewer({ object, onClose }) {
  const [src, setSrc] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let url
    let cancelled = false
    ;(async () => {
      try {
        await import('@google/model-viewer')
        const exporter = new GLTFExporter()
        const glb = await exporter.parseAsync(object, { binary: true, onlyVisible: true })
        if (cancelled) return
        url = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }))
        setSrc(url)
      } catch (e) {
        console.error(e)
        if (!cancelled) setError('Não consegui gerar o modelo 3D para AR.')
      }
    })()
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [object])

  return (
    <div className="ar-overlay" role="dialog" aria-modal="true" aria-label="Ver em realidade aumentada">
      <div className="ar-card">
        <header>
          <div>
            <h2>Ver no seu espaço</h2>
            <p>Aponte o celular para o chão. O carro aparece em tamanho real.</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </header>
        <div className="ar-stage">
          {error && <p className="ar-msg">{error}</p>}
          {!src && !error && <p className="ar-msg">Preparando o modelo 3D…</p>}
          {src && (
            <model-viewer
              src={src}
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              ar-placement="floor"
              ar-scale="auto"
              camera-controls=""
              touch-action="pan-y"
              shadow-intensity="1"
              exposure="1"
              environment-image="neutral"
              camera-orbit="45deg 70deg auto"
              alt="Seu projeto de carro em 3D"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
            >
              <button slot="ar-button" className="btn primary ar-launch">📱 Abrir câmera (AR)</button>
            </model-viewer>
          )}
        </div>
        <footer>
          No computador o botão de AR não aparece: abra este mesmo link no celular (Android com Chrome ou iPhone com Safari).
        </footer>
      </div>
    </div>
  )
}
