import type { Player, RankingResult } from "./protocol"

// Aggettivi / caratteristiche proposti dal sistema.
export const ADJECTIVES: string[] = [
  "disordinato",
  "puntuale",
  "generoso",
  "testardo",
  "avventuroso",
  "pigro",
  "romantico",
  "competitivo",
  "chiacchierone",
  "tirchio",
  "coraggioso",
  "distratto",
  "affidabile",
  "impulsivo",
  "goloso",
  "permaloso",
  "ottimista",
  "curioso",
  "ritardatario",
  "spericolato",
  "misterioso",
  "iperattivo",
  "dormiglione",
  "polemico",
  "spontaneo",
  "vanitoso",
  "sbadato",
  "leale",
  "ambizioso",
  "sognatore",
]

export function pickAdjective(exclude?: string): string {
  let choice = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  if (exclude && ADJECTIVES.length > 1) {
    let guard = 0
    while (choice === exclude && guard++ < 20) {
      choice = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    }
  }
  return choice
}

// Calcola la classifica globale come media delle posizioni assegnate da ogni votante.
// submissions[voterId] = [playerIdPiuAttinente, ..., playerIdMenoAttinente]
export function computeGlobalRanking(
  players: Player[],
  submissions: Record<string, string[]>,
): RankingResult[] {
  const acc: Record<string, { sum: number; count: number }> = {}
  for (const p of players) acc[p.id] = { sum: 0, count: 0 }

  for (const order of Object.values(submissions)) {
    order.forEach((playerId, index) => {
      if (!acc[playerId]) acc[playerId] = { sum: 0, count: 0 }
      acc[playerId].sum += index + 1 // posizione 1-based
      acc[playerId].count += 1
    })
  }

  const results: RankingResult[] = players.map((p) => {
    const a = acc[p.id]
    const avg = a.count > 0 ? a.sum / a.count : Number.POSITIVE_INFINITY
    return { id: p.id, name: p.name, avg, votes: a.count }
  })

  results.sort((x, y) => {
    if (x.avg === y.avg) return x.name.localeCompare(y.name)
    return x.avg - y.avg
  })

  return results
}
