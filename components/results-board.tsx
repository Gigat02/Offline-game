"use client"

import type { RankingResult } from "@/lib/protocol"

export function ResultsBoard({
  results,
  adjective,
  round,
  myId,
}: {
  results: RankingResult[]
  adjective: string
  round: number
  myId: string | null
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Round {round} — Classifica
        </p>
        <p className="font-display text-3xl font-bold text-accent">{adjective}</p>
        <p className="mt-1 text-sm text-muted-foreground">Media dei voti di tutti</p>
      </div>

      <ol className="flex flex-1 flex-col gap-2">
        {results.map((r, i) => {
          const isMe = r.id === myId
          const top = i === 0
          return (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                top
                  ? "border-accent bg-accent/10"
                  : "border-border bg-card"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                  top ? "bg-accent text-accent-foreground" : "bg-primary/20 text-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.name}
                {isMe && <span className="ml-1 text-xs text-muted-foreground">(tu)</span>}
              </span>
              <span className="text-right text-xs text-muted-foreground">
                pos. media
                <span className="ml-1 font-display text-sm font-bold text-foreground">
                  {Number.isFinite(r.avg) ? r.avg.toFixed(1) : "—"}
                </span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
