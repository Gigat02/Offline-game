"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HostNet } from "@/lib/net"
import { computeGlobalRanking, pickAdjective } from "@/lib/game"
import type { GameState, Player } from "@/lib/protocol"

export const HOST_ID = "host"

export function useHost(name: string) {
  const netRef = useRef<HostNet | null>(null)
  const submissionsRef = useRef<Record<string, string[]>>({})

  const initial: GameState = {
    phase: "lobby",
    round: 0,
    adjective: "",
    players: [{ id: HOST_ID, name, isHost: true, connected: true }],
    submitted: [],
    results: null,
  }
  const stateRef = useRef<GameState>(initial)
  const [state, setState] = useState<GameState>(initial)

  // Pubblica lo stato: aggiorna React e trasmette a tutti i guest.
  const publish = useCallback(() => {
    const next: GameState = {
      ...stateRef.current,
      submitted: Object.keys(submissionsRef.current),
    }
    stateRef.current = next
    setState(next)
    netRef.current?.broadcast({ t: "state", state: next })
  }, [])

  const maybeFinalize = useCallback(() => {
    const s = stateRef.current
    if (s.phase !== "ranking") return publish()
    const active = s.players.filter((p) => p.connected)
    const allIn = active.length >= 2 && active.every((p) => submissionsRef.current[p.id])
    if (allIn) {
      const results = computeGlobalRanking(active, submissionsRef.current)
      stateRef.current = { ...s, phase: "results", results }
      setState(stateRef.current)
      netRef.current?.broadcast({ t: "state", state: stateRef.current })
    } else {
      publish()
    }
  }, [publish])

  useEffect(() => {
    const net = new HostNet({
      onPeerOpen: () => {
        // Il giocatore invia "join" col nome subito dopo l'apertura del canale.
      },
      onPeerClose: (id) => {
        const s = stateRef.current
        stateRef.current = { ...s, players: s.players.filter((p) => p.id !== id) }
        delete submissionsRef.current[id]
        maybeFinalize()
      },
      onAction: (id, action) => {
        if (action.t === "join") {
          const s = stateRef.current
          if (!s.players.some((p) => p.id === id)) {
            const player: Player = { id, name: action.name.slice(0, 16), isHost: false, connected: true }
            stateRef.current = { ...s, players: [...s.players, player] }
          }
          net.send(id, { t: "welcome", youId: id })
          publish()
        } else if (action.t === "ranking") {
          submissionsRef.current[id] = action.order
          maybeFinalize()
        }
      },
    })
    netRef.current = net
    return () => {
      net.close()
      netRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- API host ----
  const createInvite = useCallback(() => {
    if (!netRef.current) throw new Error("net non pronto")
    return netRef.current.createInvite()
  }, [])

  const acceptAnswer = useCallback((code: string) => {
    if (!netRef.current) throw new Error("net non pronto")
    return netRef.current.acceptAnswer(code)
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    if (s.players.filter((p) => p.connected).length < 2) return
    submissionsRef.current = {}
    stateRef.current = {
      ...s,
      phase: "ranking",
      round: 1,
      adjective: pickAdjective(),
      results: null,
    }
    publish()
  }, [publish])

  const submitRanking = useCallback(
    (order: string[]) => {
      submissionsRef.current[HOST_ID] = order
      maybeFinalize()
    },
    [maybeFinalize],
  )

  const nextRound = useCallback(() => {
    const s = stateRef.current
    submissionsRef.current = {}
    stateRef.current = {
      ...s,
      phase: "ranking",
      round: s.round + 1,
      adjective: pickAdjective(s.adjective),
      results: null,
    }
    publish()
  }, [publish])

  const backToLobby = useCallback(() => {
    const s = stateRef.current
    submissionsRef.current = {}
    stateRef.current = { ...s, phase: "lobby", adjective: "", results: null }
    publish()
  }, [publish])

  return {
    isHost: true as const,
    myId: HOST_ID,
    state,
    createInvite,
    acceptAnswer,
    startGame,
    submitRanking,
    nextRound,
    backToLobby,
  }
}
