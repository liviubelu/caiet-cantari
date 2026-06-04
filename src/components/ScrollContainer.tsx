"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * Single scroll root for the app.
 *
 * WHY this is non-trivial
 * ──────────────────────
 * • Scroll events can fire AFTER a route change (browser adjusts scrollTop
 *   when page content gets shorter). The old save-listener is still alive at
 *   that point (useEffect cleanup is async), so it would overwrite the correct
 *   saved position with a clamped value.
 *
 * • Reading el.scrollTop in a useLayoutEffect cleanup (synchronous) can FORCE
 *   browser reflow, which itself clamps the value — same bug, different path.
 *
 * Solution
 * ────────
 * • Keep a ref (activePathnameRef) that is updated SYNCHRONOUSLY in
 *   useLayoutEffect. The save listener checks it: if the stored pathname no
 *   longer matches the current route, the event came from a browser
 *   scroll-adjustment and is ignored.
 *
 * • Store scroll positions in posRef (set only by intentional scroll events),
 *   not by reading the DOM. The useLayoutEffect cleanup flushes posRef to
 *   sessionStorage — no DOM read, no reflow.
 *
 * • Restoration uses ResizeObserver on <main> so we retry every time the
 *   server-rendered content adds more DOM nodes, regardless of how long the
 *   server takes to respond.
 */
export function ScrollContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // Updated synchronously (useLayoutEffect) so scroll listeners can check
  // whether the route has already changed before they save.
  const activePathnameRef = useRef(pathname)

  // Last intentional scroll position per pathname, captured from scroll events.
  // We NEVER read el.scrollTop for saving (can trigger reflow and return a
  // clamped value after new shorter content has been committed).
  const posRef = useRef<Record<string, number>>({})

  // ── Track active pathname synchronously; flush position on departure ─────
  useLayoutEffect(() => {
    const prev = activePathnameRef.current
    activePathnameRef.current = pathname

    // Initialise position for this route if not yet seen
    if (!(pathname in posRef.current)) {
      posRef.current[pathname] = 0
    }

    return () => {
      // Flush the last intentional position for the route we're leaving.
      // Using posRef (not el.scrollTop) avoids any reflow / clamping issues.
      sessionStorage.setItem(`scroll:${prev}`, String(posRef.current[prev] ?? 0))
    }
  }, [pathname])

  // ── Save on scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const onScroll = () => {
      // Guard: ignore scroll events that fire after the route has changed
      // (e.g. browser clamping scrollTop when new content is shorter).
      if (activePathnameRef.current !== pathname) return

      posRef.current[pathname] = el.scrollTop
      sessionStorage.setItem(`scroll:${pathname}`, String(el.scrollTop))
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [pathname])

  // ── Restore on arrival ────────────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    const target = saved ? parseInt(saved, 10) : 0

    if (target === 0) {
      el.scrollTop = 0
      return
    }

    let done = false

    const tryRestore = () => {
      if (done) return
      el.scrollTop = target
      // scrollTop accepted the value → page is tall enough → done
      if (el.scrollTop >= target - 5) {
        done = true
        ro.disconnect()
        clearTimeout(timeout)
      }
    }

    // ResizeObserver on <main>: fires every time RSC content is streamed into
    // the DOM. Retries the moment the page becomes tall enough to scroll to
    // `target`, regardless of server response time.
    const ro = new ResizeObserver(tryRestore)
    const mainEl = el.firstElementChild // <main> inside ScrollContainer
    if (mainEl) ro.observe(mainEl)

    // First attempt — handles the common case where content is already present
    requestAnimationFrame(tryRestore)

    // Cancel restoration if the user starts interacting (touch / click)
    const onUserInteract = () => {
      done = true
      ro.disconnect()
      clearTimeout(timeout)
    }
    el.addEventListener("pointerdown", onUserInteract, { once: true, passive: true })

    // Safety valve: give up after 5 s so the observer doesn't leak
    const timeout = setTimeout(() => {
      done = true
      ro.disconnect()
    }, 5000)

    return () => {
      done = true
      ro.disconnect()
      clearTimeout(timeout)
      el.removeEventListener("pointerdown", onUserInteract)
    }
  }, [pathname])

  // Song pages are fully white (content + overscroll bounce areas).
  // All other pages use the app's gray background.
  const bg = pathname.startsWith("/song/") ? "bg-white" : "bg-[#f0f2f5]"

  return (
    <div
      ref={ref}
      className={`lg:pl-64 h-full overflow-y-auto overscroll-contain ${bg}`}
    >
      {children}
    </div>
  )
}
