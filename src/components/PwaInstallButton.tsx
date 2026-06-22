"use client"

import { useState, useEffect, useSyncExternalStore } from "react"
import { InstallVideoModal } from "@/components/InstallVideoModal"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type State = "loading" | "can-install" | "manual"

declare global {
  interface Window {
    _pwaPrompt?: BeforeInstallPromptEvent
  }
}

// Once the user installs (appinstalled), stay "installed" for the rest of the
// session even in a browser tab (where display-mode never flips to standalone).
let installedFlag = false

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

function subscribeInstalled(onChange: () => void) {
  const onInstalled = () => {
    installedFlag = true
    onChange()
  }
  window.addEventListener("appinstalled", onInstalled)
  const mq = window.matchMedia("(display-mode: standalone)")
  mq.addEventListener?.("change", onChange)
  return () => {
    window.removeEventListener("appinstalled", onInstalled)
    mq.removeEventListener?.("change", onChange)
  }
}

/**
 * Is the app running as an installed PWA?
 *
 * True when launched from the home screen / app window (standalone display
 * mode, or iOS' `navigator.standalone`), or the moment the user installs it
 * (`appinstalled`). Used to hide every "install" affordance once installed.
 *
 * Implemented with `useSyncExternalStore` so it stays correct across SSR
 * hydration (server renders "not installed", client reconciles after mount).
 *
 * Note: in a regular browser tab we can't reliably tell that the app is
 * installed elsewhere — only that *this* surface is/became standalone.
 */
export function usePwaInstalled(): boolean {
  return useSyncExternalStore(
    subscribeInstalled,
    () => installedFlag || isStandalone(),
    () => false,
  )
}

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const installed = usePwaInstalled()
  const [state, setState] = useState<State>("loading")
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  // Computed once on mount; nothing renders with it until `state` leaves
  // "loading", so the server/client first paint (null) stays in sync.
  const [isIos] = useState(isIosDevice)

  // Platform detection must run after hydration (the server can't know the UA),
  // so these initial setStates are deliberate — a lazy useState initializer would
  // make the server (always "loading") and client first paint disagree.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // iOS Safari never fires beforeinstallprompt → manual (video) guide.
    if (isIosDevice()) {
      setState("manual")
      return
    }

    // The prompt may have been captured by the bootstrap before React mounted.
    if (window._pwaPrompt) {
      setPrompt(window._pwaPrompt)
      setState("can-install")
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      window._pwaPrompt = promptEvent
      setPrompt(promptEvent)
      setState("can-install")
    }
    window.addEventListener("beforeinstallprompt", handler)

    // No native prompt after 4s → fall back to the manual (video) guide.
    const timeout = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "manual" : prev))
    }, 4000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(timeout)
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleInstall() {
    if (state === "manual") {
      setShowVideo(true)
      return
    }
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
    window._pwaPrompt = undefined
  }

  // Already installed (or just installed) → no install UI at all.
  if (installed) return null
  if (state === "loading") return null

  return (
    <>
      <button onClick={handleInstall} className={`flex items-center gap-2 ${className}`}>
        {state === "manual" ? (
          /* Help / play icon for the install guide */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
          </svg>
        ) : (
          /* Download icon for the native install prompt */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {state === "manual"
          ? isIos
            ? "Cum instalez pe iPhone/iPad"
            : "Cum instalez aplicația"
          : "Instalează aplicația"}
      </button>

      {/* Install tutorial video — replaces the old text instructions. */}
      <InstallVideoModal open={showVideo} onClose={() => setShowVideo(false)} />
    </>
  )
}
