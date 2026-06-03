"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Scroll container that:
 * 1. Acts as the single scroll root for the main content area
 * 2. Saves scroll position per-route in sessionStorage
 * 3. Restores scroll position when navigating back to a previously visited route
 */
export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Restore scroll position after route change (runs after DOM update)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const saved = sessionStorage.getItem(`scroll:${pathname}`)

    // rAF ensures the new page content is painted before we scroll
    requestAnimationFrame(() => {
      el.scrollTop = saved ? parseInt(saved, 10) : 0
    })
  }, [pathname])

  // Persist scroll position as the user scrolls (passive = no layout thrash)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const save = () => {
      sessionStorage.setItem(`scroll:${pathname}`, String(el.scrollTop))
    }

    el.addEventListener("scroll", save, { passive: true })
    return () => el.removeEventListener("scroll", save)
  }, [pathname])

  return (
    <div
      ref={ref}
      className="lg:pl-64 h-full overflow-y-auto overscroll-contain bg-white"
    >
      {children}
    </div>
  )
}
