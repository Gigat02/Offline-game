"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode } from "@/components/qr-code"

export function ShareApp() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setUrl(window.location.origin)
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard non disponibile: nessuna azione
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(true)}>
        Fai scaricare l&apos;app agli altri
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Condividi l'app"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-center font-display text-xl font-bold">Scarica l&apos;app</h3>
            <p className="mx-auto mb-5 max-w-xs text-center text-sm text-muted-foreground text-pretty">
              Gli altri giocatori inquadrano questo codice per aprire l&apos;app. Poi installatela e
              connettetevi allo stesso hotspot Wi-Fi.
            </p>

            {url && (
              <div className="mb-5 flex justify-center">
                <QrCode value={url} size={220} />
              </div>
            )}

            <div className="mb-3 truncate rounded-xl border border-border bg-background px-4 py-3 text-center text-sm font-medium text-muted-foreground">
              {url}
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? "Link copiato!" : "Copia link"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
