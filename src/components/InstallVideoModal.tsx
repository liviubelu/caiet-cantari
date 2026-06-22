"use client"

import { useEffect } from "react"

/**
 * Full-screen install tutorial video. 16:9 on desktop (fills edge-to-edge),
 * full-screen on mobile. Shared by the Home banner and <PwaInstallButton>.
 */
export function InstallVideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  // Native controls only on desktop (a bottom bar that doesn't clash with our
  // close button). On touch — especially iOS Safari — native controls overlay
  // the corners (mute top-right, fullscreen top-left) and collide with the ✕,
  // so we drop them there and let the muted clip just autoplay & loop.
  const finePointer =
    typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0a0a0a] w-full h-full sm:h-auto sm:w-[min(95vw,164vh)] sm:aspect-video sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Închide"
          className="absolute right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 transition"
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
          controls={finePointer}
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
        />
      </div>
    </div>
  )
}
