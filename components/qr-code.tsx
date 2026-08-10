"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"

export function QrCode({ value, size = 240 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setError(false)
    QRCode.toCanvas(
      canvas,
      value,
      { errorCorrectionLevel: "L", margin: 1, width: size, color: { dark: "#1a0f2e", light: "#ffffff" } },
      (err) => {
        if (err) {
          console.log("[v0] QR generation failed (payload too large):", err?.message)
          setError(true)
        }
      },
    )
  }, [value, size])

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-2xl bg-white p-3 shadow-xl"
        style={{ width: size + 24, height: size + 24, display: error ? "none" : "block" }}
      >
        <canvas ref={canvasRef} aria-label="Codice QR di connessione" />
      </div>
      {error && (
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Codice troppo lungo per il QR su questo dispositivo. Usa il codice testuale qui sotto.
        </p>
      )}
    </div>
  )
}
