"use client"

import { useEffect, useRef } from "react"

/**
 * Install tutorial video. The clip is 16:9, centered on a dark backdrop.
 *
 * Playback is left entirely to the browser's native <video controls> (so on
 * iPhone you get Safari's own scrubber / pause / etc.). Dismiss by:
 *  - tapping outside the video (the dark backdrop),
 *  - swiping down,
 *  - Escape, or the ✕ (desktop only).
 *
 * The ✕ is hidden on touch devices because iOS Safari draws its native controls
 * in the corners (mute top-right) and they'd collide with it.
 */
export function InstallVideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  // Lock background scroll + close on Escape while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dy = t.clientY - start.y
    const dx = t.clientX - start.x
    // A deliberate downward swipe (not a horizontal scrub or a tap) closes.
    if (dy > 70 && Math.abs(dy) > Math.abs(dx) * 1.5) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/85 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative w-full aspect-video max-h-full bg-[#0a0a0a] sm:w-[min(95vw,164vh)] sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — desktop only; on touch, tap-outside / swipe-down dismiss */}
        <button
          onClick={onClose}
          aria-label="Închide"
          className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 transition [@media(pointer:coarse)]:hidden"
          style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <video
          src="/instalare.mp4"
          className="w-full h-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
        />
      </div>
    </div>
  )
}
