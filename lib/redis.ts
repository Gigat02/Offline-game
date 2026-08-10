import { Redis } from "@upstash/redis"

// Client Redis condiviso per il signaling online (strada A).
// Usato solo per lo scambio iniziale di offerta/risposta WebRTC.
export const redis = Redis.fromEnv()

// Prefissi delle chiavi + TTL brevi: i dati di signaling sono effimeri.
export const ROOM_TTL_SECONDS = 60 * 30 // 30 min: la stanza vive per la sessione
export const SIGNAL_TTL_SECONDS = 60 * 5 // 5 min: offerte/risposte scadono in fretta

export const roomKey = (code: string) => `lobby:room:${code}`
export const offerKey = (code: string, peerId: string) => `lobby:offer:${code}:${peerId}`
export const answerKey = (code: string, peerId: string) => `lobby:answer:${code}:${peerId}`
export const peersKey = (code: string) => `lobby:peers:${code}`
