// Codifica/decodifica delle descrizioni WebRTC (SDP) in una stringa compatta,
// adatta a QR code e a copia/incolla manuale. Nessun server richiesto.

import pako from "pako"

function u8ToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  // base64 URL-safe senza padding: piu' compatto e sicuro nei QR
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64ToU8(b64: string): Uint8Array {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/")
  const pad = norm.length % 4 === 0 ? "" : "=".repeat(4 - (norm.length % 4))
  const binary = atob(norm + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Comprime {type, sdp} in una stringa.
export function encodeSignal(desc: RTCSessionDescriptionInit): string {
  const payload = JSON.stringify({ t: desc.type, s: desc.sdp })
  const deflated = pako.deflate(payload)
  return u8ToBase64(deflated)
}

export function decodeSignal(code: string): RTCSessionDescriptionInit {
  const cleaned = code.trim()
  const bytes = base64ToU8(cleaned)
  const json = pako.inflate(bytes, { to: "string" })
  const obj = JSON.parse(json) as { t: RTCSdpType; s: string }
  return { type: obj.t, sdp: obj.s }
}
