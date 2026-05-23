"use client"

import { useState, useEffect } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type State = "loading" | "can-install" | "ios" | "installed" | "unsupported"

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

    // iOS Safari — no beforeinstallprompt, show manual instructions
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream
    if (isIos) {
      setState("ios")
      return
    }

    // Chrome / Edge / Samsung / Desktop — listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setState("can-install")
    }
    window.addEventListener("beforeinstallprompt", handler)

    const installedHandler = () => setState("installed")
    window.addEventListener("appinstalled", installedHandler)

    // If event hasn't fired after 3s, browser doesn't support install
    const timeout = setTimeout(() => {
      setState((prev) => (prev === "loading" ? "unsupported" : prev))
    }, 3000)

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
      <button
        onClick={handleInstall}
        className={`flex items-center gap-2 ${className}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v13M8 12l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
            className="bg-white rounded-t-3xl p-6 w-full max-w-sm pb-safe"
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
                <p className="text-xs text-gray-400">tineri-bartolomeu.com</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-700 mb-4">
              Adaugă pe ecranul principal:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-sm text-gray-700">
                    Apasă butonul{" "}
                    <span className="inline-flex items-center gap-1 font-semibold">
                      Share
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline">
                        <path d="M8 12V4m0 0L5 7m3-3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 14v5a1 1 0 001 1h14a1 1 0 001-1v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>{" "}
                    din bara de jos a Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-sm text-gray-700">
                  Derulează și apasă{" "}
                  <span className="font-semibold">"Adaugă pe ecranul principal"</span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-7 h-7 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-sm text-gray-700">
                  Apasă <span className="font-semibold">"Adaugă"</span> în colțul din dreapta sus
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
