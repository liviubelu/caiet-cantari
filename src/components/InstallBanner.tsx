"use client"

import { useState } from "react"
import { usePwaInstalled } from "@/components/PwaInstallButton"
import { InstallVideoModal } from "@/components/InstallVideoModal"

/**
 * Dismissible "install the app" banner at the top of the Home list.
 *
 * The whole card opens the tutorial video. It always shows when the app isn't
 * installed — the ✕ only hides it for the current view (no persistence), so it
 * reappears on refresh, ensuring new visitors keep seeing how to install.
 */
export function InstallBanner() {
  const installed = usePwaInstalled()
  const [hidden, setHidden] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  if (installed || hidden) return null

  return (
    <>
      <div
        data-hide-in-pwa
        className="relative mb-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900"
      >
        {/* The whole card opens the tutorial video */}
        <button
          onClick={() => setShowVideo(true)}
          className="w-full flex items-center gap-3.5 p-4 pr-12 text-left"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-700 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="2" width="12" height="20" rx="3" stroke="white" strokeWidth="1.8" />
              <path d="M12 7v6M9.5 10.5L12 13l2.5-2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Instalează aplicația</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Acces rapid de pe ecran — apasă să vezi cum
            </p>
          </div>
        </button>

        {/* Hide for now — vertically centered on the right; reappears on refresh */}
        <button
          onClick={() => setHidden(true)}
          aria-label="Închide"
          className="absolute top-1/2 -translate-y-1/2 right-2.5 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <InstallVideoModal open={showVideo} onClose={() => setShowVideo(false)} />
    </>
  )
}
