import { NextResponse } from "next/server"
import { redis, roomKey, offerKey, answerKey, peersKey, SIGNAL_TTL_SECONDS } from "@/lib/redis"
import type { SignalPayload } from "@/lib/signaling-types"

export const dynamic = "force-dynamic"

// GET /api/signal?code=...&role=host           -> host preleva le offerte in coda dai guest
// GET /api/signal?code=...&role=guest&peerId=  -> guest controlla se e' arrivata la risposta
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code") || ""
    const role = searchParams.get("role") || ""

    const exists = await redis.exists(roomKey(code))
    if (!exists) {
      return NextResponse.json({ error: "Stanza inesistente o scaduta." }, { status: 404 })
    }

    if (role === "host") {
      // Preleva (e svuota) le offerte accodate dai guest.
      const raw = (await redis.lrange<SignalPayload>(peersKey(code), 0, -1)) || []
      if (raw.length > 0) await redis.del(peersKey(code))
      return NextResponse.json({ offers: raw })
    }

    // role === "guest": recupera l'eventuale risposta dell'host.
    const peerId = searchParams.get("peerId") || ""
    const answer = await redis.get<string>(answerKey(code, peerId))
    return NextResponse.json({ answer: answer || null })
  } catch {
    return NextResponse.json({ error: "Errore del server di lobby." }, { status: 500 })
  }
}

// POST /api/signal  -> deposita un segnale (offerta dal guest, risposta dall'host)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, kind, payload } = body as {
      code: string
      kind: "offer" | "answer"
      payload: SignalPayload
    }

    const exists = await redis.exists(roomKey(code))
    if (!exists) {
      return NextResponse.json({ error: "Stanza inesistente o scaduta." }, { status: 404 })
    }

    if (kind === "offer") {
      // Il guest accoda la sua offerta; conservala anche per riferimento.
      await redis.rpush(peersKey(code), payload)
      await redis.expire(peersKey(code), SIGNAL_TTL_SECONDS)
      await redis.set(offerKey(code, payload.peerId), payload.sdp, { ex: SIGNAL_TTL_SECONDS })
    } else {
      // L'host deposita la risposta destinata a un guest specifico.
      await redis.set(answerKey(code, payload.peerId), payload.sdp, { ex: SIGNAL_TTL_SECONDS })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Errore del server di lobby." }, { status: 500 })
  }
}
