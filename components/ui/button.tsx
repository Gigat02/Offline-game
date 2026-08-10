"use client"

import type { ButtonHTMLAttributes } from "react"

type Variant = "primary" | "accent" | "ghost" | "outline" | "danger"
type Size = "md" | "lg" | "sm"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-display font-semibold tracking-tight transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background select-none"

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110",
  accent: "bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:brightness-105",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  danger: "bg-destructive text-white hover:brightness-110",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-base",
  lg: "h-14 px-6 text-lg w-full",
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />
}
