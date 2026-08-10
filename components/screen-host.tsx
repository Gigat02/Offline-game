"use client"

import { useState } from "react"
import { useHost } from "@/hooks/use-host"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { PlayerList } from "@/components/player-list"
import { CodeOut, CodeIn } from "@/components/signal-io"
import { GamePlay } from "@/components/game-play"

type InviteStep = "none" | "creating" | "exchange"

export function ScreenHost({ name, onExit }: { name: string; onExit: () => void }) {
  const host = useHost(name)
  const { state } = host

  const [step, setStep] = useState<InviteStep>("none")
  const [offer, setOffer] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)

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

  // ---- Flusso di invito attivo ----
  if (step !== "none") {
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

      {justAdded && (
        <p className="mb-3 rounded-lg bg-accent/15 px-3 py-2 text-center text-sm text-accent">
          Giocatore collegato!
        </p>
      )}

      <div className="flex-1">
        <PlayerList players={state.players} myId={host.myId} />
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button size="lg" variant="accent" onClick={startInvite}>
          Aggiungi giocatore
        </Button>
        <Button size="lg" disabled={!canStart} onClick={host.startGame}>
          {canStart ? "Inizia partita" : "Servono almeno 2 giocatori"}
        </Button>
        <Button variant="ghost" onClick={onExit}>
          Esci
        </Button>
      </div>
    </div>
  )
}
