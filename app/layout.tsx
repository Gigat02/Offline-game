import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Classifico — Party Game Offline",
  description:
    "Gioco multiplayer locale: mettete in ordine gli amici in base a un aggettivo. Funziona offline, senza internet, in hotspot Wi-Fi.",
  manifest: "/manifest.json",
  applicationName: "Classifico",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Classifico",
  },
}

export const viewport: Viewport = {
  themeColor: "#1a0f2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}>
      <body className="min-h-[100dvh] antialiased">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
