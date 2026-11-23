import { useEffect, useState } from 'react'
import type * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

// Exporta o carro montado em .glb e abre no <model-viewer>, que cuida do AR:
// Android (Chrome) via WebXR e iPhone (Safari) via Quick Look.
// O modelo está em metros, então aparece no chão em tamanho real.

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>
    }
  }
}

export default function ARViewer({ object, onClose }: { object: THREE.Object3D; onClose: () => void }) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url: string | undefined
    let cancelled = false
    ;(async () => {
      try {
        await import('@google/model-viewer')
        const glb = (await new GLTFExporter().parseAsync(object, { binary: true, onlyVisible: true })) as ArrayBuffer
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
              ar-modes="webxr quick-look"
              ar-placement="floor"
              camera-controls=""
              shadow-intensity="1"
              environment-image="neutral"
              camera-orbit="45deg 70deg auto"
              alt="Seu projeto de carro em 3D"
              style={{ width: '100%', height: '100%' }}
            >
              <button slot="ar-button" className="btn primary ar-launch">Abrir câmera (AR)</button>
            </model-viewer>
          )}
        </div>
        <footer>No computador o botão de AR não aparece: abra o link no celular (Android com Chrome ou iPhone com Safari).</footer>
      </div>
    </div>
  )
}
