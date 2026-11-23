import { DEFAULT_CONFIG } from '../data/options'

// O projeto fica salvo no próprio link (#p=...), então dá para mandar pelo WhatsApp.

export function encodeConfig(cfg) {
  const json = JSON.stringify(cfg)
  return btoa(unescape(encodeURIComponent(json))).replace(/=+$/, '')
}

export function decodeConfig(hash) {
  try {
    const m = hash.match(/p=([^&]+)/)
    if (!m) return null
    const json = decodeURIComponent(escape(atob(m[1])))
    const parsed = JSON.parse(json)
    const out = { ...DEFAULT_CONFIG }
    for (const k of Object.keys(DEFAULT_CONFIG)) {
      if (k in parsed && typeof parsed[k] === typeof DEFAULT_CONFIG[k]) out[k] = parsed[k]
    }
    return out
  } catch {
    return null
  }
}

export function shareUrl(cfg) {
  const url = new URL(window.location.href)
  url.hash = `p=${encodeConfig(cfg)}`
  return url.toString()
}
