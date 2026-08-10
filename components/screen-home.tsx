"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { ShareApp } from "@/components/share-app"

export function ScreenHome({
  onCreate,
  onJoin,
}: {
  onCreate: (name: string) => void
  onJoin: (name: string) => void
}) {
  const [name, setName] = useState("")
  const valid = name.trim().length >= 2

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
          Chi è il più <span className="text-accent">tutto</span>?
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground text-pretty">
          Il gioco propone un aggettivo, voi ordinate tutti i giocatori. Le classifiche si fondono
          in un verdetto unico.
        </p>
      </div>

      <Card>
        <label htmlFor="nick" className="mb-2 block text-sm font-medium text-muted-foreground">
          Il tuo nickname
        </label>
        <input
          id="nick"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="es. Mario"
          className="mb-4 h-12 w-full rounded-xl border border-border bg-background px-4 text-lg font-medium outline-none focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <div className="flex flex-col gap-3">
          <Button size="lg" disabled={!valid} onClick={() => onCreate(name.trim())}>
            Crea partita
          </Button>
          <Button size="lg" variant="outline" disabled={!valid} onClick={() => onJoin(name.trim())}>
            Unisciti a una partita
          </Button>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <ShareApp />
        </div>
      </Card>

      <p className="text-center text-xs text-muted-foreground text-pretty">
        Connessi allo stesso hotspot Wi-Fi. Nessun internet necessario: la connessione è diretta tra
        i telefoni.
      </p>
    </div>
  )
}
