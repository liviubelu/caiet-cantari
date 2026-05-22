import type { Metadata, Viewport } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })

export const metadata: Metadata = {
  title: "Caiet de Cântări — Biserica Bartolomeu",
  description: "Baza de date cu melodiile tinerilor de la Biserica Bartolomeu",
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  themeColor: "#f0f2f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${lora.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  )
}
