"use client"

// Client per il server di signaling (strada A). Usato SOLO per l'aggancio iniziale.
import type { SignalPayload } from "./signaling-types"

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Errore rete (${res.status})`)
  }
  return res.json() as Promise<T>
}

// Host: crea una stanza e ottiene il codice a 6 cifre.
export function createRoom(hostName: string) {
  return jsonFetch<{ code: string }>("/api/room", {
    method: "POST",
    body: JSON.stringify({ hostName }),
  })
}

// Host: preleva le offerte accodate dai guest in attesa.
export function fetchOffers(code: string) {
  return jsonFetch<{ offers: SignalPayload[] }>(`/api/signal?code=${code}&role=host`)
}

// Host: deposita la risposta destinata a uno specifico guest.
export function postAnswer(code: string, peerId: string, sdp: string) {
  return jsonFetch<{ ok: true }>("/api/signal", {
    method: "POST",
    body: JSON.stringify({ code, kind: "answer", payload: { peerId, sdp } }),
  })
}

// Guest: deposita la propria offerta nella stanza.
export function postOffer(code: string, peerId: string, sdp: string, name: string) {
  return jsonFetch<{ ok: true }>("/api/signal", {
    method: "POST",
    body: JSON.stringify({ code, kind: "offer", payload: { peerId, sdp, name } }),
  })
}

// Guest: controlla se e' arrivata la risposta dell'host.
export function fetchAnswer(code: string, peerId: string) {
  return jsonFetch<{ answer: string | null }>(`/api/signal?code=${code}&role=guest&peerId=${peerId}`)
}

export function randomPeerId() {
  return `g${Math.random().toString(36).slice(2, 10)}`
}
