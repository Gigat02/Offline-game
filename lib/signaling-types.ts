// Tipi condivisi per il signaling online (strada A).
// Il flusso e' "guest-initiated": il guest crea l'offerta, l'host risponde.
// Questo permette all'host di gestire piu' guest in topologia a stella.

export type RoomInfo = {
  code: string // codice a 6 cifre
  hostName: string
  createdAt: number
}

// Deposito effimero di un segnale WebRTC (SDP compresso in base64).
export type SignalPayload = {
  peerId: string // id univoco del guest che sta entrando
  sdp: string // offerta o risposta, gia' compressa
  name?: string // nickname del guest (inviato con l'offerta)
}

export type CreateRoomResponse = { code: string }
export type JoinPollResponse = { answer: string | null }
export type HostPollResponse = { offers: SignalPayload[] }
