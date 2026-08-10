// Livello di rete WebRTC P2P con signaling manuale (QR / codice).
// Topologia a stella: l'Host e' il server autoritativo, i Guest si collegano solo a lui.
// Nessun server internet: le connessioni usano i candidati ICE locali (LAN / hotspot).

import { encodeSignal, decodeSignal } from "./signal"
import type { ClientAction, ServerMessage } from "./protocol"

// Nessun STUN/TURN: solo candidati della rete locale.
const RTC_CONFIG: RTCConfiguration = { iceServers: [] }

// Attende il completamento della raccolta ICE (con timeout di sicurezza),
// cosi' l'SDP contiene tutti i candidati locali (signaling non-trickle).
function waitIceComplete(pc: RTCPeerConnection, timeoutMs = 3500): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", check)
      clearTimeout(timer)
      resolve()
    }
    const check = () => {
      if (pc.iceGatheringState === "complete") done()
    }
    const timer = setTimeout(done, timeoutMs)
    pc.addEventListener("icegatheringstatechange", check)
  })
}

// ------------------------------------------------------------------
// HOST
// ------------------------------------------------------------------

interface HostPeer {
  id: string
  pc: RTCPeerConnection
  channel: RTCDataChannel
}

export interface HostCallbacks {
  onAction: (fromId: string, action: ClientAction) => void
  onPeerOpen: (id: string) => void
  onPeerClose: (id: string) => void
}

export class HostNet {
  private peers = new Map<string, HostPeer>()
  private pending: HostPeer | null = null
  private counter = 0
  private cb: HostCallbacks

  constructor(cb: HostCallbacks) {
    this.cb = cb
  }

  // Crea un nuovo invito (offerta) per un singolo giocatore.
  // Restituisce il codice da mostrare via QR / testo.
  async createInvite(): Promise<string> {
    const id = `p${++this.counter}`
    const pc = new RTCPeerConnection(RTC_CONFIG)
    const channel = pc.createDataChannel("game", { ordered: true })

    const peer: HostPeer = { id, pc, channel }
    this.pending = peer

    channel.onopen = () => this.cb.onPeerOpen(id)
    channel.onclose = () => {
      this.peers.delete(id)
      this.cb.onPeerClose(id)
    }
    channel.onmessage = (e) => {
      try {
        const action = JSON.parse(e.data) as ClientAction
        this.cb.onAction(id, action)
      } catch {
        /* ignore malformed */
      }
    }
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        if (this.peers.has(id)) {
          this.peers.delete(id)
          this.cb.onPeerClose(id)
        }
      }
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    await waitIceComplete(pc)
    return encodeSignal(pc.localDescription!)
  }

  // Applica la risposta ricevuta dal giocatore all'invito in sospeso.
  async acceptAnswer(answerCode: string): Promise<string> {
    if (!this.pending) throw new Error("Nessun invito in attesa di risposta.")
    const peer = this.pending
    const answer = decodeSignal(answerCode)
    await peer.pc.setRemoteDescription(answer)
    this.peers.set(peer.id, peer)
    this.pending = null
    return peer.id
  }

  cancelPending() {
    if (this.pending) {
      try {
        this.pending.pc.close()
      } catch {}
      this.pending = null
    }
  }

  send(id: string, msg: ServerMessage) {
    const peer = this.peers.get(id)
    if (peer && peer.channel.readyState === "open") {
      peer.channel.send(JSON.stringify(msg))
    }
  }

  broadcast(msg: ServerMessage) {
    const data = JSON.stringify(msg)
    for (const peer of this.peers.values()) {
      if (peer.channel.readyState === "open") peer.channel.send(data)
    }
  }

  close() {
    this.cancelPending()
    for (const peer of this.peers.values()) {
      try {
        peer.pc.close()
      } catch {}
    }
    this.peers.clear()
  }
}

// ------------------------------------------------------------------
// GUEST
// ------------------------------------------------------------------

export interface GuestCallbacks {
  onMessage: (msg: ServerMessage) => void
  onOpen: () => void
  onClose: () => void
}

export class GuestNet {
  private pc: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private cb: GuestCallbacks

  constructor(cb: GuestCallbacks) {
    this.cb = cb
  }

  // Riceve l'offerta dell'host, genera la risposta (codice da rimandare all'host).
  async connectWithOffer(offerCode: string): Promise<string> {
    const pc = new RTCPeerConnection(RTC_CONFIG)
    this.pc = pc

    pc.ondatachannel = (e) => {
      const channel = e.channel
      this.channel = channel
      channel.onopen = () => this.cb.onOpen()
      channel.onclose = () => this.cb.onClose()
      channel.onmessage = (ev) => {
        try {
          this.cb.onMessage(JSON.parse(ev.data) as ServerMessage)
        } catch {
          /* ignore */
        }
      }
    }
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        this.cb.onClose()
      }
    }

    const offer = decodeSignal(offerCode)
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    await waitIceComplete(pc)
    return encodeSignal(pc.localDescription!)
  }

  send(action: ClientAction) {
    if (this.channel && this.channel.readyState === "open") {
      this.channel.send(JSON.stringify(action))
    }
  }

  close() {
    try {
      this.channel?.close()
      this.pc?.close()
    } catch {}
    this.channel = null
    this.pc = null
  }
}
