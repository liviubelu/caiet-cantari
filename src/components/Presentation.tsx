"use client"

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
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
  const [dark, setDark] = useState(true)
  const [rotate, setRotate] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  const total = slides.length
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // Rotate the slide on a portrait phone so it reads big in landscape
  useEffect(() => {
    const mq = window.matchMedia("(orientation: portrait) and (max-width: 820px)")
    const update = () => setRotate(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

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

  // Fullscreen + keep-awake (both best-effort)
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    const nav = navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }
    let lock: { release: () => Promise<void> } | null = null
    nav.wakeLock?.request("screen").then((l) => { lock = l }).catch(() => {})
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
      lock?.release().catch(() => {})
    }
  }, [])

  // Auto-fit: make the lyrics as large as possible without overflowing
  useLayoutEffect(() => {
    const fit = () => {
      const area = contentRef.current
      const text = textRef.current
      if (!area || !text) return
      text.style.fontSize = "140px"
      const ratio = Math.min(area.clientWidth / text.scrollWidth, area.clientHeight / text.scrollHeight)
      const size = Math.max(18, Math.min(140, 140 * ratio * 0.92))
      text.style.fontSize = `${size}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [index, rotate])

  const slide = slides[index]
  const bg = dark ? "#0b0d11" : "#ffffff"
  const fg = dark ? "#f3f4f6" : "#111827"
  const subtle = dark ? "rgba(255,255,255,.55)" : "rgba(17,24,39,.55)"

  const boxStyle: React.CSSProperties = rotate
    ? { position: "absolute", top: "50%", left: "50%", width: "100vh", height: "100vw", transform: "translate(-50%, -50%) rotate(90deg)" }
    : { position: "absolute", inset: 0, width: "100%", height: "100%" }

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-hidden select-none" style={{ background: bg, color: fg }}>
      {/* Tappable slide area — tap advances to the next slide */}
      <div style={boxStyle} className="flex flex-col px-6 py-12" onClick={next}>
        <p className="text-center text-sm font-bold tracking-widest uppercase flex-shrink-0 mb-4" style={{ color: slide.color }}>
          {slide.label}
        </p>
        <div ref={contentRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <div ref={textRef} className="text-center font-display font-bold leading-tight" style={{ fontSize: "140px" }}>
            {slide.lines.length > 0
              ? slide.lines.map((l, i) => <div key={i}>{l}</div>)
              : <div style={{ color: subtle, fontStyle: "italic" }}>(instrumental)</div>}
          </div>
        </div>
      </div>

      {/* Top bar — counter + controls (don't advance when tapped) */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe-bar pb-2 lg:pt-3 pointer-events-none">
        <span className="text-xs font-semibold pointer-events-auto px-2 py-1 rounded-lg" style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", color: subtle }}>
          {index + 1} / {total}
        </span>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label="Schimbă tema"
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", color: fg }}
          >
            {dark ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Închide prezentarea"
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", color: fg }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Prev button + title (bottom) — explicit back, since tapping advances */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-safe pt-2 pointer-events-none">
        <button
          onClick={prev}
          disabled={index === 0}
          aria-label="Înapoi"
          className="pointer-events-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-30"
          style={{ background: dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.06)", color: fg }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
          Înapoi
        </button>
        <span className="text-xs truncate max-w-[55%] text-right" style={{ color: subtle }}>{title}</span>
      </div>
    </div>,
    document.body
  )
}
