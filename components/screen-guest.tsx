"use client"

import { useEffect, useRef, useState } from "react"
import { useGuest } from "@/hooks/use-guest"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { PlayerList } from "@/components/player-list"
import { CodeOut, CodeIn } from "@/components/signal-io"
import { GamePlay } from "@/components/game-play"
import { upsertGroup } from "@/lib/friends"

type Mode = "choose" | "online" | "offline"

export function ScreenGuest({
  name,
  onExit,
  autoOnline,
  presetCode,
  presetLabel,
}: {
  name: string
  onExit: () => void
  autoOnline?: boolean
  presetCode?: string
  presetLabel?: string
}) {
  const guest = useGuest(name)
  const { state, status } = guest

  const [mode, setMode] = useState<Mode>(autoOnline ? "online" : "choose")
  const [code, setCode] = useState(presetCode ?? "")
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const autoRef = useRef(false)

  // Online: digita il codice a 6 cifre ed entra (nessun secondo codice).
  async function joinWithCode(c: string) {
    const clean = c.replace(/\D/g, "").slice(0, 6)
    if (clean.length !== 6) {
      setError("Il codice deve avere 6 cifre.")
      return
    }
    setError(null)
    try {
      await guest.joinRoom(clean)
      upsertGroup({ code: clean, role: "guest", label: presetLabel })
    } catch (e: any) {
      console.log("[v0] joinRoom error:", e?.message)
      setError(e?.message || "Connessione non riuscita. Controlla il codice e la rete.")
    }
  }

  // Riconnessione automatica da un gruppo salvato.
  useEffect(() => {
    if (autoOnline && presetCode && !autoRef.current) {
      autoRef.current = true
      void joinWithCode(presetCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOnline, presetCode])

  // Offline: riceve l'offerta QR dell'host, produce la risposta.
  async function handleOffer(offerCode: string) {
    setError(null)
    try {
      const answerCode = await guest.connect(offerCode)
      setAnswer(answerCode)
    } catch (e: any) {
      console.log("[v0] guest connect error:", e?.message)
      setError("Codice invito non valido. Chiedi all'host di rigenerarlo.")
    }
  }

  // ---- In partita ----
  if (state && state.phase !== "lobby") {
    return <GamePlay state={state} myId={guest.myId} isHost={false} onSubmitRanking={guest.submitRanking} />
  }

  // ---- Connesso: sala d'attesa lobby ----
  if (status === "connected" && state) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">In lobby</p>
          <h2 className="font-display text-2xl font-bold">In attesa dell&apos;host</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            L&apos;host farà partire la partita quando siete tutti pronti.
          </p>
        </div>
        <div className="flex-1">
          <PlayerList players={state.players} myId={guest.myId} />
        </div>
        <Button variant="ghost" className="mt-4" onClick={onExit}>
          Esci
        </Button>
      </div>
    )
  }

  if (status === "closed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Connessione persa</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Il collegamento con l&apos;host si è interrotto. Torna indietro e riprova.
        </p>
        <Button variant="outline" onClick={onExit}>
          Torna alla home
        </Button>
      </div>
    )
  }

  // ---- Scelta modalita' ----
  if (mode === "choose") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Unisciti</p>
          <h2 className="font-display text-2xl font-bold">Come ti colleghi?</h2>
        </div>
        <Card className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode("online")}
            className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/20"
          >
            <p className="font-display font-bold">Codice a 6 cifre</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Digita il codice dell&apos;host ed entri subito. Serve internet per pochi secondi.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode("offline")}
            className="rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
          >
            <p className="font-display font-bold">QR offline</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Nessun internet: scansioni il QR dell&apos;host. Piu' passaggi.
            </p>
          </button>
        </Card>
        <Button variant="ghost" onClick={onExit}>
          Indietro
        </Button>
      </div>
    )
  }

  // ---- Online: inserimento codice a 6 cifre ----
  if (mode === "online") {
    const connecting = status === "connecting"
    return (
      <div className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Codice partita
            </p>
            <label htmlFor="code" className="mb-2 mt-1 block text-sm text-muted-foreground">
              Inserisci le 6 cifre che ti ha dato l&apos;host.
            </label>
            <input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              disabled={connecting}
              className="h-16 w-full rounded-xl border border-border bg-background text-center font-display text-4xl font-bold tracking-[0.3em] outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
          </div>
          <Button size="lg" disabled={code.length !== 6 || connecting} onClick={() => joinWithCode(code)}>
            {connecting ? "Connessione in corso..." : "Entra nella partita"}
          </Button>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </Card>
        <Button variant="ghost" className="mt-3" onClick={onExit} disabled={connecting}>
          Annulla
        </Button>
      </div>
    )
  }

  // ---- Offline: flusso QR ----
  return (
    <div className="flex flex-1 flex-col">
      <Card className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Passo 1</p>
          <CodeIn label="Scansiona il QR mostrato dall'host." confirmLabel="Connetti" onSubmit={handleOffer} />
        </div>

        {answer && (
          <>
            <div className="h-px w-full bg-border" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Passo 2</p>
              <CodeOut
                value={answer}
                label="Mostra questo QR di risposta all'host per completare la connessione."
              />
              <p className="mt-3 text-center text-sm text-muted-foreground">
                {status === "connecting" ? "In attesa dell'host..." : ""}
              </p>
            </div>
          </>
        )}

        {error && <p className="text-center text-sm text-destructive">{error}</p>}
      </Card>
      <Button variant="ghost" className="mt-3" onClick={onExit}>
        Annulla
      </Button>
    </div>
  )
}
