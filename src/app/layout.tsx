import type { Metadata, Viewport } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { SwRegister } from "@/components/SwRegister"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" })

export const metadata: Metadata = {
  title: "Caiet de Cântări — Biserica Bartolomeu",
  description: "Baza de date cu melodiile tinerilor de la Biserica Bartolomeu",
  icons: {
    apple: "/api/pwa-icon?size=180",
  },
}

export const viewport: Viewport = {
  themeColor: "#4338ca",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // enables env(safe-area-inset-*) on Android + iOS
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${lora.variable} h-full`}>
      <body className="h-full">
        {/* Capture beforeinstallprompt before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window._pwaPrompt=e;});`,
          }}
        />
        {children}
        <SwRegister />
      </body>
    </html>
  )
}
