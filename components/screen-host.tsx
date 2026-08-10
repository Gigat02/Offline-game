"use client"

import { useEffect, useRef, useState } from "react"
import { useHost } from "@/hooks/use-host"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { PlayerList } from "@/components/player-list"
import { CodeOut, CodeIn } from "@/components/signal-io"
import { GamePlay } from "@/components/game-play"
import { upsertGroup } from "@/lib/friends"

type Mode = "choose" | "online" | "offline"
type OfflineStep = "none" | "creating" | "exchange"

export function ScreenHost({
  name,
  onExit,
  autoOnline,
  presetLabel,
}: {
  name: string
  onExit: () => void
  autoOnline?: boolean
  presetLabel?: string
}) {
  const host = useHost(name)
  const { state, roomCode } = host

  const [mode, setMode] = useState<Mode>(autoOnline ? "online" : "choose")
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  // Offline (QR)
  const [step, setStep] = useState<OfflineStep>("none")
  const [offer, setOffer] = useState("")
  const [justAdded, setJustAdded] = useState(false)

  // Avvia automaticamente la stanza online (creazione codice a 6 cifre).
  useEffect(() => {
    if (mode !== "online" || startedRef.current) return
    startedRef.current = true
    host
      .openRoom()
      .then((code) => {
        upsertGroup({ code, role: "host", label: presetLabel, members: [name] })
      })
      .catch((e) => {
        console.log("[v0] openRoom error:", e?.message)
        setError("Impossibile aprire la stanza online. Controlla la connessione e riprova.")
        startedRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Aggiorna i membri salvati quando cambiano i giocatori connessi.
  useEffect(() => {
    if (!roomCode) return
    const members = state.players.map((p) => p.name)
    upsertGroup({ code: roomCode, role: "host", label: presetLabel, members })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.players.length, roomCode])

  // ---- Offline: crea invito QR ----
  async function startInvite() {
    setError(null)
    setStep("creating")
    try {
      const code = await host.createInvite()
      setOffer(code)
      setStep("exchange")
    } catch (e: any) {
      console.log("[v0] createInvite error:", e?.message)
      setError("Errore nella creazione dell'invito. Riprova.")
      setStep("none")
    }
  }

  async function acceptAnswer(code: string) {
    setError(null)
    try {
      await host.acceptAnswer(code)
      setStep("none")
      setOffer("")
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2500)
    } catch (e: any) {
      console.log("[v0] acceptAnswer error:", e?.message)
      setError("Codice risposta non valido. Chiedi al giocatore di rigenerarlo.")
    }
  }

  // ---- In partita ----
  if (state.phase !== "lobby") {
    return (
      <GamePlay
        state={state}
        myId={host.myId}
        isHost
        onSubmitRanking={host.submitRanking}
        onNextRound={host.nextRound}
        onBackToLobby={host.backToLobby}
      />
    )
  }

  // ---- Scelta modalita' ----
  if (mode === "choose") {
    return (
      <div className="flex flex-1 flex-col justify-center gap-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Crea partita</p>
          <h2 className="font-display text-2xl font-bold">Come vi collegate?</h2>
        </div>
        <Card className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setMode("online")}
            className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/20"
          >
            <p className="font-display font-bold">Codice a 6 cifre</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Gli altri digitano il codice ed entrano. Serve internet solo per pochi secondi.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode("offline")}
            className="rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
          >
            <p className="font-display font-bold">QR offline</p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Nessun internet: scambio di QR tra i telefoni. Piu' passaggi.
            </p>
          </button>
        </Card>
        <Button variant="ghost" onClick={onExit}>
          Indietro
        </Button>
      </div>
    )
  }

  // ---- Offline: flusso di invito attivo ----
  if (mode === "offline" && step !== "none") {
    return (
      <div className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col gap-5">
          {step === "creating" && (
            <p className="my-auto text-center text-sm text-muted-foreground">
              Creazione invito in corso...
            </p>
          )}
          {step === "exchange" && (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">Passo 1</p>
                <CodeOut value={offer} label="Fai scansionare questo QR al nuovo giocatore." />
              </div>
              <div className="h-px w-full bg-border" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">Passo 2</p>
                <CodeIn
                  label="Scansiona il codice di risposta che ti mostra il giocatore."
                  confirmLabel="Collega giocatore"
                  onSubmit={acceptAnswer}
                />
              </div>
            </>
          )}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </Card>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            setStep("none")
            setOffer("")
            setError(null)
          }}
        >
          Annulla
        </Button>
      </div>
    )
  }

  // ---- Lobby ----
  const canStart = state.players.filter((p) => p.connected).length >= 2

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">La tua lobby</p>
        <h2 className="font-display text-2xl font-bold">
          {state.players.length} {state.players.length === 1 ? "giocatore" : "giocatori"}
        </h2>
      </div>

      {mode === "online" && (
        <Card className="mb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Codice partita</p>
          {roomCode ? (
            <p className="font-display text-4xl font-bold tracking-[0.3em] text-accent">{roomCode}</p>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">Apertura stanza...</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Gli altri lo digitano su &quot;Unisciti&quot; per entrare. Nessun altro codice richiesto.
          </p>
        </Card>
      )}

      {justAdded && (
        <p className="mb-3 rounded-lg bg-accent/15 px-3 py-2 text-center text-sm text-accent">
          Giocatore collegato!
        </p>
      )}

      <div className="flex-1">
        <PlayerList players={state.players} myId={host.myId} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {mode === "offline" && (
          <Button size="lg" variant="accent" onClick={startInvite}>
            Aggiungi giocatore
          </Button>
        )}
        <Button size="lg" disabled={!canStart} onClick={host.startGame}>
          {canStart ? "Inizia partita" : "Servono almeno 2 giocatori"}
        </Button>
        <Button variant="ghost" onClick={onExit}>
          Esci
        </Button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
    </div>
  )
}
