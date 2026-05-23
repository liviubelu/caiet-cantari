"use client"

import { useState, useEffect } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type State = "loading" | "can-install" | "ios" | "installed" | "browser-help"

declare global {
  interface Window {
    _pwaPrompt?: BeforeInstallPromptEvent
  }
}

function detectBrowser(): "chrome" | "edge" | "opera" | "safari" | "firefox" | "other" {
  if (typeof navigator === "undefined") return "other"
  const ua = navigator.userAgent
  if (/OPR|Opera/i.test(ua)) return "opera"
  if (/Edg\//i.test(ua)) return "edge"
  if (/Chrome/i.test(ua)) return "chrome"
  if (/Firefox/i.test(ua)) return "firefox"
  if (/Safari/i.test(ua)) return "safari"
  return "other"
}

const BROWSER_INSTRUCTIONS: Record<string, { name: string; steps: string[] }> = {
  opera: {
    name: "Opera / Opera GX",
    steps: [
      'Uită-te în bara de adresă — în dreapta apare o iconiță de instalare (monitor cu săgeată ⬇)',
      'Click pe ea și alege "Instalează"',
      'Dacă nu o vezi: meniu Opera (O logo, stânga sus) → "Instalează Caiet de Cântări"',
    ],
  },
  edge: {
    name: "Microsoft Edge",
    steps: [
      'Caută iconița de instalare (⊕) în bara de adresă, colțul din dreapta',
      'Sau: Meniu (···) → "Aplicații" → "Instalează acest site ca aplicație"',
      "Confirmă instalarea",
    ],
  },
  chrome: {
    name: "Google Chrome",
    steps: [
      'Caută iconița de instalare (⊕) în bara de adresă, colțul din dreapta',
      'Sau: Meniu (⋮) → "Salvează și partajează" → "Instalează ca aplicație"',
      "Confirmă instalarea",
    ],
  },
  firefox: {
    name: "Firefox",
    steps: [
      "Firefox nu suportă instalarea PWA ca aplicație nativă",
      "Recomandare: folosește Chrome, Edge sau Opera GX",
    ],
  },
  safari: {
    name: "Safari (macOS)",
    steps: [
      'Din bara de meniu: "Dosar" (File) → "Adaugă în Dock"',
      "Sau: butonul Share → \"Adaugă în Dock\"",
    ],
  },
  other: {
    name: "Browserul tău",
    steps: [
      "Caută iconița de instalare (⊕) în bara de adresă",
      'Sau deschide meniul browserului și caută "Instalează aplicația"',
    ],
  },
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<State>("loading")
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [browser, setBrowser] = useState<string>("other")

  useEffect(() => {
    setBrowser(detectBrowser())

    // Already running as installed PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
    if (isStandalone) {
      setState("installed")
      return
    }

    // iOS Safari — no beforeinstallprompt
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    if (isIos) {
      setState("ios")
      return
    }

    // Check if prompt was captured by the global script before React mounted
    if (window._pwaPrompt) {
      setPrompt(window._pwaPrompt)
      setState("can-install")
      return
    }

    // Listen for it
    const handler = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      window._pwaPrompt = promptEvent
      setPrompt(promptEvent)
      setState("can-install")
    }
    window.addEventListener("beforeinstallprompt", handler)

    const installedHandler = () => {
      setState("installed")
      setPrompt(null)
    }
    window.addEventListener("appinstalled", installedHandler)

    // After 4s without beforeinstallprompt, show browser-specific help
    const timeout = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "browser-help" : prev))
    }, 4000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
      clearTimeout(timeout)
    }
  }, [])

  async function handleInstall() {
    if (state === "ios" || state === "browser-help") {
      setShowModal(true)
      return
    }
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setState("installed")
    setPrompt(null)
    window._pwaPrompt = undefined
  }

  const info = BROWSER_INSTRUCTIONS[browser] ?? BROWSER_INSTRUCTIONS.other

  if (state === "installed") {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 font-medium ${className}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Aplicație instalată
      </div>
    )
  }

  if (state === "loading") return null

  const isIosOrHelp = state === "ios" || state === "browser-help"

  return (
    <>
      <button onClick={handleInstall} className={`flex items-center gap-2 ${className}`}>
        {isIosOrHelp ? (
          /* Question/help icon for manual install */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-1.5 2-2.5 2.5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="16.5" r="1" fill="currentColor" />
          </svg>
        ) : (
          /* Download icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {state === "ios"
          ? "Instalează pe iPhone/iPad"
          : state === "browser-help"
          ? "Cum instalez?"
          : "Instalează aplicația"}
      </button>

      {/* Instructions modal (iOS + browser-help) */}
      {showModal && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-w-sm"
            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-indigo-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M7 8h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Caiet de Cântări</p>
                <p className="text-xs text-gray-400">
                  {state === "ios" ? "iPhone / iPad" : info.name}
                </p>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-4">
              {state === "ios" ? "Adaugă pe ecranul principal:" : "Instalează aplicația:"}
            </p>

            <div className="space-y-4">
              {(state === "ios"
                ? [
                    "Apasă butonul Share din bara de jos a Safari",
                    'Derulează și apasă "Adaugă pe ecranul principal"',
                    'Apasă "Adaugă" în colțul din dreapta sus',
                  ]
                : info.steps
              ).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p
                    className="text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full bg-indigo-700 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-indigo-600 transition"
            >
              Am înțeles
            </button>
          </div>
        </div>
      )}
    </>
  )
}
