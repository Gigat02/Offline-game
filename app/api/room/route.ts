import { NextResponse } from "next/server"
import { redis, roomKey, ROOM_TTL_SECONDS } from "@/lib/redis"

export const dynamic = "force-dynamic"

function sixDigits() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// POST /api/room  -> crea una stanza con codice a 6 cifre univoco.
export async function POST(req: Request) {
  try {
    const { hostName } = await req.json().catch(() => ({ hostName: "" }))

    // Genera un codice non ancora in uso (max 5 tentativi).
    let code = ""
    for (let i = 0; i < 5; i++) {
      const candidate = sixDigits()
      // setnx-like: crea solo se non esiste, con TTL.
      const ok = await redis.set(
        roomKey(candidate),
        { hostName: hostName || "Host", createdAt: Date.now() },
        { nx: true, ex: ROOM_TTL_SECONDS },
      )
      if (ok) {
        code = candidate
        break
      }
    }

    if (!code) {
      return NextResponse.json({ error: "Impossibile generare un codice, riprova." }, { status: 503 })
    }

    return NextResponse.json({ code })
  } catch {
    return NextResponse.json({ error: "Errore del server di lobby." }, { status: 500 })
  }
}
