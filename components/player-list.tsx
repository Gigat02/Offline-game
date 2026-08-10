"use client"

import type { Player } from "@/lib/protocol"

export function PlayerList({
  players,
  myId,
  submittedIds,
}: {
  players: Player[]
  myId: string | null
  submittedIds?: string[]
}) {
  return (
    <ul className="flex flex-col gap-2">
      {players.map((p) => {
        const isMe = p.id === myId
        const hasSubmitted = submittedIds?.includes(p.id)
        return (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                p.isHost ? "bg-accent text-accent-foreground" : "bg-primary/20 text-foreground"
              }`}
            >
              {p.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">
                {p.name}
                {isMe && <span className="ml-1 text-xs text-muted-foreground">(tu)</span>}
              </span>
              <span className="text-xs text-muted-foreground">
                {p.isHost ? "Host" : "Giocatore"}
              </span>
            </div>
            {submittedIds ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  hasSubmitted
                    ? "bg-accent/20 text-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {hasSubmitted ? "Pronto" : "..."}
              </span>
            ) : (
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  p.connected ? "bg-accent" : "bg-muted-foreground/40"
                }`}
                aria-label={p.connected ? "connesso" : "disconnesso"}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
