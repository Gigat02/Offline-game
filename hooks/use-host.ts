"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { HostNet } from "@/lib/net"
import { computeGlobalRanking, pickAdjective } from "@/lib/game"
import type { GameState, Player } from "@/lib/protocol"
import { createRoom, fetchOffers, postAnswer } from "@/lib/signaling-client"

export const HOST_ID = "host"

export function useHost(name: string) {
  const netRef = useRef<HostNet | null>(null)
  const submissionsRef = useRef<Record<string, string[]>>({})
  const roomCodeRef = useRef<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const answeredRef = useRef<Set<string>>(new Set())
  const [roomCode, setRoomCode] = useState<string | null>(null)

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
      if (pollRef.current) clearInterval(pollRef.current)
      net.close()
      netRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- API host: modalita' OFFLINE (QR/codice) ----
  const createInvite = useCallback(() => {
    if (!netRef.current) throw new Error("net non pronto")
    return netRef.current.createInvite()
  }, [])

  const acceptAnswer = useCallback((code: string) => {
    if (!netRef.current) throw new Error("net non pronto")
    return netRef.current.acceptAnswer(code)
  }, [])

  // ---- API host: modalita' ONLINE (codice a 6 cifre, strada A) ----
  // Apre una stanza sul server e avvia il polling che risponde
  // automaticamente alle offerte dei guest. Nessun secondo codice richiesto.
  const openRoom = useCallback(async () => {
    const { code } = await createRoom(name)
    roomCodeRef.current = code
    setRoomCode(code)

    const poll = async () => {
      const c = roomCodeRef.current
      if (!c || !netRef.current) return
      try {
        const { offers } = await fetchOffers(c)
        for (const offer of offers) {
          if (answeredRef.current.has(offer.peerId)) continue
          answeredRef.current.add(offer.peerId)
          try {
            const answerSdp = await netRef.current.answerOffer(offer.peerId, offer.sdp)
            await postAnswer(c, offer.peerId, answerSdp)
          } catch {
            answeredRef.current.delete(offer.peerId)
          }
        }
      } catch {
        /* rete assente: riprova al prossimo tick */
      }
    }
    pollRef.current = setInterval(poll, 1500)
    void poll()
    return code
  }, [name])

  const stopRoomPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
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
    roomCode,
    createInvite,
    acceptAnswer,
    openRoom,
    stopRoomPolling,
    startGame,
    submitRanking,
    nextRound,
    backToLobby,
  }
}
