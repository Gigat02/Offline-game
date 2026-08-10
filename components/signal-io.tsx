"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode } from "@/components/qr-code"
import { QrScanner } from "@/components/qr-scanner"

// Mostra un codice da trasmettere all'altro dispositivo (QR + copia testo).
export function CodeOut({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const [showText, setShowText] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setShowText(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-sm font-medium text-muted-foreground text-balance">{label}</p>
      <QrCode value={value} />
      <div className="flex w-full flex-col gap-2">
        <Button variant="outline" size="sm" onClick={copy}>
          {copied ? "Copiato!" : "Copia codice"}
        </Button>
        <button
          onClick={() => setShowText((s) => !s)}
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          {showText ? "Nascondi codice testuale" : "Mostra codice testuale"}
        </button>
        {showText && (
          <textarea
            readOnly
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            className="scroll-slim h-24 w-full resize-none rounded-lg border border-border bg-background p-2 font-mono text-[10px] leading-tight text-muted-foreground"
          />
        )}
      </div>
    </div>
  )
}

// Riceve un codice dall'altro dispositivo (scansione QR o incolla testo).
export function CodeIn({
  label,
  confirmLabel,
  onSubmit,
}: {
  label: string
  confirmLabel: string
  onSubmit: (code: string) => void
}) {
  const [scanning, setScanning] = useState(false)
  const [text, setText] = useState("")

  if (scanning) {
    return (
      <QrScanner
        onResult={(code) => {
          setScanning(false)
          onSubmit(code)
        }}
        onCancel={() => setScanning(false)}
      />
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-center text-sm font-medium text-muted-foreground text-balance">{label}</p>
      <Button variant="accent" onClick={() => setScanning(true)} className="w-full">
        Scansiona QR
      </Button>
      <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        oppure incolla
        <span className="h-px flex-1 bg-border" />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Incolla qui il codice..."
        className="scroll-slim h-20 w-full resize-none rounded-lg border border-border bg-background p-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/60"
      />
      <Button onClick={() => text.trim() && onSubmit(text.trim())} disabled={!text.trim()} className="w-full">
        {confirmLabel}
      </Button>
    </div>
  )
}
