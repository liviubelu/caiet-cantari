"use client"

import { useState, useEffect } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type State = "loading" | "can-install" | "ios" | "installed" | "unsupported"

declare global {
  interface Window {
    _pwaPrompt?: BeforeInstallPromptEvent
  }
}

export function PwaInstallButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<State>("loading")
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosModal, setShowIosModal] = useState(false)

  useEffect(() => {
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

    // Otherwise listen for it (fires on first visit or after criteria met)
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

    // If the event doesn't fire in 5s, browser likely doesn't support install
    const timeout = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "unsupported" : prev))
    }, 5000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      window.removeEventListener("appinstalled", installedHandler)
      clearTimeout(timeout)
    }
  }, [])

  async function handleInstall() {
    if (state === "ios") {
      setShowIosModal(true)
      return
    }
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === "accepted") setState("installed")
    setPrompt(null)
    window._pwaPrompt = undefined
  }

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

  if (state === "loading" || state === "unsupported") return null

  return (
    <>
      <button onClick={handleInstall} className={`flex items-center gap-2 ${className}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {state === "ios" ? "Instalează pe iPhone/iPad" : "Instalează aplicația"}
      </button>

      {/* iOS instructions modal */}
      {showIosModal && (
        <div
          className="fixed inset-0 z-[999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-w-sm"
            style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* App header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-indigo-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M7 8h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Caiet de Cântări</p>
                <p className="text-xs text-gray-400">tineri-bartolomeu.com</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-4">
              Adaugă pe ecranul principal:
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-sm text-gray-700">
                  Apasă butonul{" "}
                  <strong className="inline-flex items-center gap-1">
                    Share
                    {/* Correct iOS Share icon: box with arrow pointing up */}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="inline-block">
                      <path
                        d="M12 15V4M8 8l4-4 4 4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 14v6a1 1 0 001 1h14a1 1 0 001-1v-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </strong>{" "}
                  din bara de jos a Safari
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-gray-700">
                  Derulează și apasă{" "}
                  <strong>&ldquo;Adaugă pe ecranul principal&rdquo;</strong>
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-gray-700">
                  Apasă <strong>&ldquo;Adaugă&rdquo;</strong> în colțul din dreapta sus
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
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
