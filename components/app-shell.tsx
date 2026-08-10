"use client"

import type { ReactNode } from "react"

export function AppShell({
  children,
  footer,
}: {
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="mb-5 flex items-center justify-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <span className="block h-3 w-3 rounded-sm bg-accent-foreground" />
        </span>
        <h1 className="font-display text-xl font-bold tracking-tight">
          Classi<span className="text-accent">fico</span>
        </h1>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </main>
  )
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>{children}</div>
  )
}
