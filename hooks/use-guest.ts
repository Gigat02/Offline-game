"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { GuestNet } from "@/lib/net"
import type { GameState } from "@/lib/protocol"

export type GuestStatus = "idle" | "connecting" | "connected" | "closed"

export function useGuest(name: string) {
  const netRef = useRef<GuestNet | null>(null)
  const nameRef = useRef(name)
  nameRef.current = name

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
      net.close()
      netRef.current = null
    }
  }, [])

  const connect = useCallback(async (offerCode: string) => {
    if (!netRef.current) throw new Error("net non pronto")
    setStatus("connecting")
    return netRef.current.connectWithOffer(offerCode)
  }, [])

  const submitRanking = useCallback((order: string[]) => {
    netRef.current?.send({ t: "ranking", order })
  }, [])

  return { isHost: false as const, myId, state, status, connect, submitRanking }
}
