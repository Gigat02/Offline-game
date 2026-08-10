"use client"

import type { GameState } from "@/lib/protocol"
import { RankingBoard } from "@/components/ranking-board"
import { ResultsBoard } from "@/components/results-board"
import { PlayerList } from "@/components/player-list"
import { Button } from "@/components/ui/button"

export function GamePlay({
  state,
  myId,
  isHost,
  onSubmitRanking,
  onNextRound,
  onBackToLobby,
}: {
  state: GameState
  myId: string | null
  isHost: boolean
  onSubmitRanking: (order: string[]) => void
  onNextRound?: () => void
  onBackToLobby?: () => void
}) {
  if (state.phase === "results" && state.results) {
    return (
      <div className="flex flex-1 flex-col">
        <ResultsBoard results={state.results} adjective={state.adjective} round={state.round} myId={myId} />
        {isHost ? (
          <div className="mt-4 flex flex-col gap-3">
            <Button size="lg" onClick={() => onNextRound?.()}>
              Prossimo round
            </Button>
            <Button size="lg" variant="outline" onClick={() => onBackToLobby?.()}>
              Fine partita — torna alla lobby
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            In attesa che l&apos;host scelga il prossimo round...
          </p>
        )}
      </div>
    )
  }

  // Fase ranking: se ho gia' inviato, mostro l'attesa.
  const iSubmitted = myId ? state.submitted.includes(myId) : false
  if (state.phase === "ranking" && iSubmitted) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Round {state.round}</p>
          <p className="font-display text-2xl font-bold text-accent">{state.adjective}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Classifica inviata. In attesa degli altri...
          </p>
        </div>
        <PlayerList players={state.players} myId={myId} submittedIds={state.submitted} />
      </div>
    )
  }

  return (
    <RankingBoard
      players={state.players}
      adjective={state.adjective}
      round={state.round}
      myId={myId}
      onSubmit={onSubmitRanking}
    />
  )
}
