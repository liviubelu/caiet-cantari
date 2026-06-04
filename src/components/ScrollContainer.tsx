"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Scroll container that:
 * 1. Acts as the single scroll root for the main content area
 * 2. Saves scroll position per-route in sessionStorage
 * 3. Restores scroll position when navigating back to a previously visited route
 *
 * Retry loop: with dynamic (server-fetched) pages the content may arrive
 * after useEffect fires, so scrollTop clamps to 0. We keep retrying each
 * animation frame until the position "sticks" or we give up (~30 frames).
 */
export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Restore scroll position after route change
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    const target = saved ? parseInt(saved, 10) : 0

    if (target === 0) {
      el.scrollTop = 0
      return
    }

    // Retry until the page is tall enough to accept the target scroll
    // (dynamic pages stream content after the effect fires)
    let raf: number
    let attempts = 0
    const MAX_ATTEMPTS = 30 // ~500 ms at 60 fps

    const tryRestore = () => {
      el.scrollTop = target
      // If it didn't stick yet and we have retries left, try again next frame
      if (el.scrollTop < target - 5 && attempts++ < MAX_ATTEMPTS) {
        raf = requestAnimationFrame(tryRestore)
      }
    }

    raf = requestAnimationFrame(tryRestore)
    return () => cancelAnimationFrame(raf)
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
