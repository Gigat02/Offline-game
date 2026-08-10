"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ScreenHome } from "@/components/screen-home"
import { ScreenHost } from "@/components/screen-host"
import { ScreenGuest } from "@/components/screen-guest"
import type { FriendGroup } from "@/lib/friends"

// App multiplayer locale — punto di ingresso.
// Modalita' online (codice a 6 cifre) e offline (QR) coesistono.
type Mode = "home" | "host" | "guest"

export default function Page() {
  const [mode, setMode] = useState<Mode>("home")
  const [name, setName] = useState("")
  const [autoOnline, setAutoOnline] = useState(false)
  const [presetCode, setPresetCode] = useState<string | undefined>(undefined)
  const [presetLabel, setPresetLabel] = useState<string | undefined>(undefined)

  function reset() {
    setAutoOnline(false)
    setPresetCode(undefined)
    setPresetLabel(undefined)
    setMode("home")
  }

  function goHost(n: string) {
    setName(n)
    setAutoOnline(false)
    setPresetLabel(undefined)
    setMode("host")
  }

  function goGuest(n: string, code?: string) {
    setName(n)
    setAutoOnline(false)
    setPresetCode(code)
    setPresetLabel(undefined)
    setMode("guest")
  }

  // Riconnessione a un tap da un gruppo salvato.
  function goReconnect(n: string, group: FriendGroup) {
    setName(n)
    setAutoOnline(true)
    setPresetLabel(group.label)
    if (group.role === "host") {
      setPresetCode(undefined)
      setMode("host")
    } else {
      setPresetCode(group.lastCode)
      setMode("guest")
    }
  }

  return (
    <AppShell>
      {mode === "home" && (
        <ScreenHome onCreate={goHost} onJoin={goGuest} onReconnect={goReconnect} />
      )}
      {mode === "host" && (
        <ScreenHost name={name} onExit={reset} autoOnline={autoOnline} presetLabel={presetLabel} />
      )}
      {mode === "guest" && (
        <ScreenGuest
          name={name}
          onExit={reset}
          autoOnline={autoOnline}
          presetCode={presetCode}
          presetLabel={presetLabel}
        />
      )}
    </AppShell>
  )
}
