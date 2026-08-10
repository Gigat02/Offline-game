"use client"

import { useState } from "react"
import { useGuest } from "@/hooks/use-guest"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/app-shell"
import { PlayerList } from "@/components/player-list"
import { CodeOut, CodeIn } from "@/components/signal-io"
import { GamePlay } from "@/components/game-play"

export function ScreenGuest({ name, onExit }: { name: string; onExit: () => void }) {
  const guest = useGuest(name)
  const { state, status } = guest

  const [answer, setAnswer] = useState("")
  const [error, setError] = useState<string | null>(null)

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
    return (
      <GamePlay state={state} myId={guest.myId} isHost={false} onSubmitRanking={guest.submitRanking} />
    )
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

  // ---- Flusso di connessione ----
  return (
    <div className="flex flex-1 flex-col">
      <Card className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Passo 1</p>
          <CodeIn
            label="Scansiona il QR mostrato dall'host."
            confirmLabel="Connetti"
            onSubmit={handleOffer}
          />
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
