"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./ThemeProvider"

/**
 * Client-side providers that must wrap the whole app:
 * - SessionProvider: required for useSession() in BottomNav / Sidebar
 * - ThemeProvider:  required for dark mode toggle
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
