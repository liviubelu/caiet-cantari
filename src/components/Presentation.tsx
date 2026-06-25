"use client"

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import type { PresentationSlide } from "@/lib/sections"

export function PresentationButton({ title, slides }: { title: string; slides: PresentationSlide[] }) {
  const [open, setOpen] = useState(false)
  if (slides.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M8 5v14l11-7-11-7z" fill="currentColor" />
        </svg>
        Prezentare
      </button>
      {open && <PresentationOverlay title={title} slides={slides} onClose={() => setOpen(false)} />}
    </>
  )
}

function PresentationOverlay({
  title, slides, onClose,
}: {
  title: string
  slides: PresentationSlide[]
  onClose: () => void
}) {
  const [index, setIndex] = useState(0)
  // Follow the app's theme (the `dark` class on <html>) — no separate toggle.
  const [dark] = useState(() => document.documentElement.classList.contains("dark"))
  const [rotate, setRotate] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const total = slides.length
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // Backgrounds match the app's theme-color exactly (dark #030712 / light
  // #f0f2f5), so on an iOS standalone PWA the notch / status-bar strip — which
  // keeps the launch theme-color until a reflow — is the same color as the
  // presentation, with no visible seam before any rotation.
  const bg = dark ? "#030712" : "#f0f2f5"
  const fg = dark ? "#f3f4f6" : "#111827"
  const subtle = dark ? "rgba(255,255,255,.55)" : "rgba(17,24,39,.55)"

  // On a portrait phone, rotate the WHOLE presentation 90° so it always reads in
  // landscape (there is no portrait variant).
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 820px) and (pointer: coarse)")
    const update = () => setRotate(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Match the page chrome (the notch / status-bar safe area behind this fixed
  // overlay) to the presentation background, so it never shows a different tint —
  // including on iOS, where the overlay isn't painted under the notch until a
  // reflow. Runs before paint and follows the dark/light toggle.
  useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const meta = document.querySelector('meta[name="theme-color"]')
    const prevHtml = html.style.background
    const prevBody = body.style.background
    const prevTheme = meta?.getAttribute("content") ?? null
    html.style.background = bg
    body.style.background = bg
    meta?.setAttribute("content", bg)
    return () => {
      html.style.background = prevHtml
      body.style.background = prevBody
      if (meta && prevTheme != null) meta.setAttribute("content", prevTheme)
    }
  }, [bg])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " " || e.key === "PageDown") { e.preventDefault(); next() }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); prev() }
      else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, onClose])

  // Fullscreen + auto-landscape + keep-awake (all best-effort).
  // Orientation lock works on Android (in fullscreen); iOS Safari ignores it,
  // so there we fall back to the CSS rotation above.
  useEffect(() => {
    const orient = screen.orientation as unknown as { lock?: (o: string) => Promise<void>; unlock?: () => void }
    Promise.resolve(document.documentElement.requestFullscreen?.())
      .then(() => orient.lock?.("landscape"))
      .catch(() => {})
    const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }
    let lock: { release: () => Promise<void> } | null = null
    nav.wakeLock?.request("screen").then((l) => { lock = l }).catch(() => {})
    return () => {
      try { orient.unlock?.() } catch {}
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
      lock?.release().catch(() => {})
    }
  }, [])

  // Block the swipe-back / browser-back gesture on touch devices — the user must
  // exit via the ✕ button. We trap one history entry and re-push it on popstate.
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return
    history.pushState({ prez: true }, "")
    const onPop = () => history.pushState({ prez: true }, "")
    window.addEventListener("popstate", onPop)
    return () => {
      window.removeEventListener("popstate", onPop)
      if ((window.history.state as { prez?: boolean } | null)?.prez) history.back()
    }
  }, [])

  // Stop iOS from even starting the edge swipe-back: preventDefault on touches
  // that begin at the very left/right screen edge (never on the controls, so the
  // buttons keep working). This kills the gesture before it animates.
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      if ((e.target as HTMLElement | null)?.closest("button")) return
      const edge = 24
      if (t.clientX <= edge || t.clientX >= window.innerWidth - edge) e.preventDefault()
    }
    document.addEventListener("touchstart", onTouchStart, { passive: false })
    return () => document.removeEventListener("touchstart", onTouchStart)
  }, [])

  // Auto-fit: make the lyrics as large as possible without overflowing
  useLayoutEffect(() => {
    const fit = () => {
      const area = contentRef.current
      const text = textRef.current
      if (!area || !text) return
      let size = 220
      text.style.fontSize = `${size}px`
      // Two passes converge on the largest size that fits BOTH width and height.
      for (let p = 0; p < 2; p++) {
        const ratio = Math.min(area.clientWidth / text.scrollWidth, area.clientHeight / text.scrollHeight)
        size = Math.max(16, Math.min(220, size * ratio * 0.98))
        text.style.fontSize = `${size}px`
      }
    }
    fit()
    window.addEventListener("resize", fit)
    window.addEventListener("orientationchange", fit)
    return () => {
      window.removeEventListener("resize", fit)
      window.removeEventListener("orientationchange", fit)
    }
  }, [index, rotate])

  const slide = slides[index]

  // The whole presentation (slide + controls) lives inside this canvas, which is
  // rotated as one block on a portrait phone — so the controls land in landscape
  // too, and there's never a portrait layout.
  const canvasStyle: React.CSSProperties = rotate
    ? { position: "absolute", top: "50%", left: "50%", width: "100vh", height: "100vw", transform: "translate(-50%, -50%) rotate(90deg)" }
    : { position: "absolute", inset: 0 }

  const chip = { background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)" }
  // Keep content/controls clear of the notch & home-indicator on every edge
  // (works for native landscape and for the CSS-rotated iOS case).
  const SAFE = "max(env(safe-area-inset-top),env(safe-area-inset-bottom),env(safe-area-inset-left),env(safe-area-inset-right),16px)"

  return (
    // translateZ(0) promotes this to its own compositing layer so iOS paints the
    // background edge-to-edge — including under the notch — from the first frame
    // (otherwise it only fills the safe area after a reflow, e.g. a rotation).
    <div
      className="fixed inset-0 z-[100] overflow-hidden select-none"
      style={{ background: bg, color: fg, transform: "translateZ(0)", minHeight: "100dvh" }}
    >
      <div style={canvasStyle} className="overflow-hidden">
        <div style={{ position: "absolute", inset: SAFE }}>

        {/* Tappable slide area — tap advances to the next slide */}
        <div className="absolute inset-0 flex flex-col px-3 py-14" onClick={next}>
          <p className="text-center text-sm font-bold tracking-widest uppercase flex-shrink-0 mb-4" style={{ color: slide.color }}>
            {slide.label}
          </p>
          <div ref={contentRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            <div ref={textRef} className="shrink-0 text-center font-display font-bold leading-tight" style={{ fontSize: "140px" }}>
              {slide.lines.length > 0
                ? slide.lines.map((l, i) => {
                    const isFirst = i === 0
                    const isLast = i === slide.lines.length - 1
                    const closeText = slide.repeat >= 3 ? `:/ x${slide.repeat}` : ":/"
                    return (
                      <div key={i} className="whitespace-nowrap">
                        {isFirst && slide.repeat >= 2 && <span className="mr-2">/:</span>}
                        {l}
                        {isLast && slide.repeat >= 2 && <span className="ml-2">{closeText}</span>}
                      </div>
                    )
                  })
                : <div style={{ color: subtle, fontStyle: "italic" }}>(instrumental)</div>}
            </div>
          </div>
        </div>

        {/* Top bar — counter + controls (don't advance when tapped) */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-3 pb-2 pointer-events-none">
          <span className="text-xs font-semibold pointer-events-auto px-2 py-1 rounded-lg" style={{ ...chip, color: subtle }}>
            {index + 1} / {total}
          </span>
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onClose}
              aria-label="Închide prezentarea"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ ...chip, color: fg }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Prev button + title (bottom) — explicit back, since tapping advances */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3 pt-2 pointer-events-none">
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label="Înapoi"
            className="pointer-events-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-30"
            style={{ ...chip, color: fg }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
            Înapoi
          </button>
          <span className="text-xs truncate max-w-[55%] text-right" style={{ color: subtle }}>{title}</span>
        </div>
        </div>
      </div>
    </div>
  )
}
