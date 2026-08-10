"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GuestNet } from "@/lib/net"
import type { GameState } from "@/lib/protocol"
import { postOffer, fetchAnswer, randomPeerId } from "@/lib/signaling-client"

export type GuestStatus = "idle" | "connecting" | "connected" | "closed"

export function useGuest(name: string) {
  const netRef = useRef<GuestNet | null>(null)
  const nameRef = useRef(name)
  nameRef.current = name
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<GameState | null>(null)
  const [myId, setMyId] = useState<string | null>(null)
  const [status, setStatus] = useState<GuestStatus>("idle")

  useEffect(() => {
    const net = new GuestNet({
      onOpen: () => {
        setStatus("connected")
        net.send({ t: "join", name: nameRef.current.slice(0, 16) })
      },
      onClose: () => setStatus("closed"),
      onMessage: (msg) => {
        if (msg.t === "welcome") setMyId(msg.youId)
        else if (msg.t === "state") setState(msg.state)
      },
    })
    netRef.current = net
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      net.close()
      netRef.current = null
    }
  }, [])

  // ---- OFFLINE (QR/codice): riceve l'offerta dell'host, restituisce la risposta ----
  const connect = useCallback(async (offerCode: string) => {
    if (!netRef.current) throw new Error("net non pronto")
    setStatus("connecting")
    return netRef.current.connectWithOffer(offerCode)
  }, [])

  // ---- ONLINE (codice a 6 cifre, strada A): crea offerta, la invia e attende la risposta ----
  const joinRoom = useCallback(async (code: string) => {
    if (!netRef.current) throw new Error("net non pronto")
    setStatus("connecting")
    const peerId = randomPeerId()
    const offerSdp = await netRef.current.createOffer()
    await postOffer(code, peerId, offerSdp, nameRef.current.slice(0, 16))

    // Attende la risposta dell'host (polling), poi completa la connessione.
    await new Promise<void>((resolve, reject) => {
      let tries = 0
      pollRef.current = setInterval(async () => {
        tries++
        try {
          const { answer } = await fetchAnswer(code, peerId)
          if (answer) {
            if (pollRef.current) clearInterval(pollRef.current)
            await netRef.current!.applyAnswer(answer)
            resolve()
          } else if (tries > 40) {
            if (pollRef.current) clearInterval(pollRef.current)
            reject(new Error("L'host non ha risposto. Riprova."))
          }
        } catch (e) {
          if (pollRef.current) clearInterval(pollRef.current)
          reject(e as Error)
        }
      }, 1500)
    })
  }, [])

  const submitRanking = useCallback((order: string[]) => {
    netRef.current?.send({ t: "ranking", order })
  }, [])

  return { isHost: false as const, myId, state, status, connect, joinRoom, submitRanking }
}
