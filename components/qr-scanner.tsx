"use client"

import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"

export function QrScanner({
  onResult,
  onCancel,
}: {
  onResult: (text: string) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        video.setAttribute("playsinline", "true")
        await video.play()
        tick()
      } catch (err: any) {
        console.log("[v0] Camera error:", err?.name, err?.message)
        setError(
          "Impossibile accedere alla fotocamera. Incolla il codice manualmente qui sotto.",
        )
      }
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth
        const h = video.videoHeight
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (ctx && w && h) {
          ctx.drawImage(video, 0, 0, w, h)
          const img = ctx.getImageData(0, 0, w, h)
          const code = jsQR(img.data, w, h, { inversionAttempts: "dontInvert" })
          if (code && code.data) {
            onResult(code.data)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border-2 border-primary/60 bg-black aspect-square">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {!error && (
          <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-accent/80" />
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white/90">
            {error}
          </div>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Inquadra il QR dell&apos;altro telefono.
      </p>
      <Button variant="outline" size="sm" onClick={onCancel}>
        Annulla scansione
      </Button>
    </div>
  )
}
