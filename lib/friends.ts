"use client"

// Persistenza locale (solo lato dispositivo) per una riconnessione amichevole.
// NON salva la connessione P2P (effimera), ma solo l'identita': nickname e
// "gruppi amici" recenti con l'ultimo codice stanza usato.

const PROFILE_KEY = "classifico:profile"
const GROUPS_KEY = "classifico:groups"

export type Profile = { name: string }

export type FriendGroup = {
  id: string
  label: string // nome del gruppo (modificabile)
  lastCode: string // ultimo codice stanza a 6 cifre usato
  role: "host" | "guest" // come ci si e' uniti l'ultima volta
  members: string[] // nomi visti nell'ultima sessione (solo display)
  lastPlayed: number
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage pieno o non disponibile: ignora */
  }
}

export function loadProfile(): Profile | null {
  return safeGet<Profile | null>(PROFILE_KEY, null)
}

export function saveProfile(p: Profile) {
  safeSet(PROFILE_KEY, p)
}

export function loadGroups(): FriendGroup[] {
  const groups = safeGet<FriendGroup[]>(GROUPS_KEY, [])
  return [...groups].sort((a, b) => b.lastPlayed - a.lastPlayed)
}

// Crea o aggiorna un gruppo in base al codice stanza.
export function upsertGroup(input: {
  code: string
  role: "host" | "guest"
  members?: string[]
  label?: string
}): FriendGroup {
  const groups = loadGroups()
  const existing = groups.find((g) => g.lastCode === input.code)
  const group: FriendGroup = existing
    ? {
        ...existing,
        role: input.role,
        members: input.members ?? existing.members,
        label: input.label ?? existing.label,
        lastPlayed: Date.now(),
      }
    : {
        id: `grp_${Date.now().toString(36)}`,
        label: input.label || "Gruppo amici",
        lastCode: input.code,
        role: input.role,
        members: input.members ?? [],
        lastPlayed: Date.now(),
      }
  const next = [group, ...groups.filter((g) => g.id !== group.id)]
  safeSet(GROUPS_KEY, next.slice(0, 8)) // tieni al massimo 8 gruppi
  return group
}

export function renameGroup(id: string, label: string) {
  const groups = loadGroups().map((g) => (g.id === id ? { ...g, label } : g))
  safeSet(GROUPS_KEY, groups)
}

export function removeGroup(id: string) {
  safeSet(
    GROUPS_KEY,
    loadGroups().filter((g) => g.id !== id),
  )
}
