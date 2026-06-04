import type { Metadata, Viewport } from "next"
import { Inter, Lora } from "next/font/google"
import "./globals.css"
import { SwRegister } from "@/components/SwRegister"
import { ThemeProvider } from "@/components/ThemeProvider"

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
  // Matches the app background; ThemeProvider updates this dynamically on toggle
  themeColor: "#f0f2f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${inter.variable} ${lora.variable} h-full`}>
      <body className="h-full">
        {/* Apply saved theme before first paint — prevents flash and syncs status-bar color */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#030712');}})()` }} />
        {/* Capture beforeinstallprompt before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window._pwaPrompt=e;});` }} />
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <SwRegister />
      </body>
    </html>
  )
}
