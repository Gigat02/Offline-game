"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ScreenHome } from "@/components/screen-home"
import { ScreenHost } from "@/components/screen-host"
import { ScreenGuest } from "@/components/screen-guest"

// App multiplayer locale offline — punto di ingresso.
type Mode = "home" | "host" | "guest"

export default function Page() {
  const [mode, setMode] = useState<Mode>("home")
  const [name, setName] = useState("")

  function goHost(n: string) {
    setName(n)
    setMode("host")
  }

  function goGuest(n: string) {
    setName(n)
    setMode("guest")
  }

  return (
    <AppShell>
      {mode === "home" && <ScreenHome onCreate={goHost} onJoin={goGuest} />}
      {mode === "host" && <ScreenHost name={name} onExit={() => setMode("home")} />}
      {mode === "guest" && <ScreenGuest name={name} onExit={() => setMode("home")} />}
    </AppShell>
  )
}
