"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: "light", toggle: () => {} })

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark")
  // Keep the browser status-bar / notch colour in sync with the app background
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", t === "dark" ? "#030712" : "#f0f2f5")
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) ?? "light"
    setTheme(saved)
    applyTheme(saved)
  }, [])

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
