"use client"

import { useEffect, useState } from "react"
import type { Player } from "@/lib/protocol"
import { Button } from "@/components/ui/button"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function RankingBoard({
  players,
  adjective,
  round,
  myId,
  onSubmit,
}: {
  players: Player[]
  adjective: string
  round: number
  myId: string | null
  onSubmit: (order: string[]) => void
}) {
  const [order, setOrder] = useState<Player[]>([])

  // Nuovo round -> rimescola l'ordine di partenza.
  useEffect(() => {
    setOrder(shuffle(players))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, adjective])

  function move(index: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Round {round}</p>
        <p className="mt-1 text-sm text-muted-foreground text-balance">
          Ordina dal più al meno
        </p>
        <p className="font-display text-3xl font-bold text-accent">{adjective}</p>
      </div>

      <ol className="flex flex-1 flex-col gap-2">
        {order.map((p, i) => {
          const isMe = p.id === myId
          return (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-display text-sm font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {p.name}
                {isMe && <span className="ml-1 text-xs text-muted-foreground">(tu)</span>}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Sposta su"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-lg leading-none disabled:opacity-30 active:scale-95"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label="Sposta giù"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted text-lg leading-none disabled:opacity-30 active:scale-95"
                >
                  ↓
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      <Button
        size="lg"
        className="mt-4"
        onClick={() => onSubmit(order.map((p) => p.id))}
        disabled={order.length === 0}
      >
        Conferma classifica
      </Button>
    </div>
  )
}
