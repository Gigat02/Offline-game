// Tipi condivisi tra Host e Guest.

export type Phase = "lobby" | "ranking" | "results"

export interface Player {
  id: string
  name: string
  isHost: boolean
  connected: boolean
}

export interface RankingResult {
  id: string
  name: string
  avg: number // posizione media (1 = piu' attinente)
  votes: number // quante classifiche lo hanno incluso
}

// Stato autoritativo, calcolato dall'host e trasmesso a tutti.
export interface GameState {
  phase: Phase
  round: number
  adjective: string
  players: Player[]
  // id dei giocatori che hanno gia' inviato la classifica in questo round
  submitted: string[]
  results: RankingResult[] | null
}

// ---- Messaggi Guest -> Host ----
export type ClientAction =
  | { t: "join"; name: string }
  | { t: "ranking"; order: string[] } // order[0] = piu' attinente

// ---- Messaggi Host -> Guest ----
export type ServerMessage =
  | { t: "welcome"; youId: string }
  | { t: "state"; state: GameState }
  | { t: "kick"; reason: string }
