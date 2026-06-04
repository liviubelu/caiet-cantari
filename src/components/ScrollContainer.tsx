"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Single scroll root for the app.
 *
 * Save strategy
 * ─────────────
 * • Continuously on scroll events (so the value is always fresh)
 * • In useLayoutEffect cleanup on route change: runs synchronously after
 *   React commits the new DOM but BEFORE browser reflow. This means
 *   scrollTop is still exactly what the user left it at, not yet clamped
 *   by the incoming (possibly shorter) page content.
 *
 * Restore strategy
 * ────────────────
 * • With dynamic (server-fetched) pages, the RSC response may arrive
 *   after useEffect fires, so a single rAF can't scroll to a position
 *   the page isn't tall enough to reach yet.
 * • We watch <main> with ResizeObserver: each time content is added
 *   (streaming RSC chunks, hydration) we retry. As soon as scrollTop
 *   sticks (page is tall enough) we stop.
 */
export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // ── Save on departure ────────────────────────────────────────────────────
  // Cleanup runs synchronously after DOM commit but before browser reflow,
  // so scrollTop is still at the user's last intentional position.
  useLayoutEffect(() => {
    const el = ref.current
    return () => {
      if (el) sessionStorage.setItem(`scroll:${pathname}`, String(el.scrollTop))
    }
  }, [pathname])

  // ── Save continuously while scrolling ───────────────────────────────────
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const save = () => sessionStorage.setItem(`scroll:${pathname}`, String(el.scrollTop))
    el.addEventListener("scroll", save, { passive: true })
    return () => el.removeEventListener("scroll", save)
  }, [pathname])

  // ── Restore on arrival ───────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    const target = saved ? parseInt(saved, 10) : 0

    // Nothing to restore — make sure we're at the top for new routes
    if (target === 0) {
      el.scrollTop = 0
      return
    }

    let done = false

    const tryRestore = () => {
      if (done) return
      el.scrollTop = target
      // If scrollTop accepted the value the page is tall enough — we're done
      if (el.scrollTop >= target - 5) {
        done = true
        ro.disconnect()
        clearTimeout(timeout)
      }
    }

    // ResizeObserver on <main>: fires every time RSC content is added to the
    // DOM (each streamed chunk, each Suspense boundary resolving). This lets
    // us retry the moment the page becomes tall enough to accept the position.
    const ro = new ResizeObserver(tryRestore)
    const mainEl = el.firstElementChild // the <main> inside ScrollContainer
    if (mainEl) ro.observe(mainEl)

    // First attempt — handles the case where content is already in the DOM
    requestAnimationFrame(tryRestore)

    // Safety valve: stop watching after 5 s to avoid leaking the observer
    const timeout = setTimeout(() => {
      done = true
      ro.disconnect()
    }, 5000)

    return () => {
      done = true
      ro.disconnect()
      clearTimeout(timeout)
    }
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
