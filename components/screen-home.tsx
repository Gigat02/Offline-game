"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { ShareApp } from "@/components/share-app"
import { loadProfile, saveProfile, loadGroups, removeGroup, type FriendGroup } from "@/lib/friends"

export function ScreenHome({
  onCreate,
  onJoin,
  onReconnect,
}: {
  onCreate: (name: string) => void
  onJoin: (name: string, code?: string) => void
  onReconnect: (name: string, group: FriendGroup) => void
}) {
  const [name, setName] = useState("")
  const [groups, setGroups] = useState<FriendGroup[]>([])
  const valid = name.trim().length >= 2

  // Carica profilo + gruppi salvati (riconnessione amichevole).
  useEffect(() => {
    const p = loadProfile()
    if (p?.name) setName(p.name)
    setGroups(loadGroups())
  }, [])

  // Salva il nickname mentre lo scrivi, cosi' resta pronto la prossima volta.
  useEffect(() => {
    if (name.trim().length >= 2) saveProfile({ name: name.trim() })
  }, [name])

  function forget(id: string) {
    removeGroup(id)
    setGroups(loadGroups())
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-balance">
          Chi è il più <span className="text-accent">tutto</span>?
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground text-pretty">
          Il gioco propone un aggettivo, voi ordinate tutti i giocatori. Le classifiche si fondono in
          un verdetto unico.
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

      {groups.length > 0 && (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Riconnetti a un gruppo
          </p>
          <div className="flex flex-col gap-2">
            {groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="truncate font-medium">{g.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    Codice {g.lastCode} · {g.role === "host" ? "eri host" : "ospite"}
                    {g.members.length > 0 ? ` · ${g.members.join(", ")}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="accent"
                  disabled={!valid}
                  onClick={() => onReconnect(name.trim(), g)}
                >
                  Riconnetti
                </Button>
                <button
                  type="button"
                  onClick={() => forget(g.id)}
                  aria-label={`Dimentica ${g.label}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground text-pretty">
        Codice a 6 cifre: serve internet solo per l&apos;aggancio iniziale (pochi secondi), poi si
        gioca in locale. Oppure usa la modalità offline con QR, senza internet.
      </p>
    </div>
  )
}
