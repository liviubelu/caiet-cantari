"use client"

import { useSyncExternalStore } from "react"
import { PwaInstallButton, usePwaInstalled } from "@/components/PwaInstallButton"

const DISMISS_KEY = "install-banner-dismissed"
const DISMISS_EVENT = "install-banner-dismiss"

function subscribeDismiss(onChange: () => void) {
  window.addEventListener("storage", onChange) // other tabs
  window.addEventListener(DISMISS_EVENT, onChange) // this tab
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(DISMISS_EVENT, onChange)
  }
}

function getDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Dismissible "install the app" banner shown at the top of the Home list.
 *
 * Targets new visitors: the install option is otherwise only inside Cont, which
 * has no mobile entry point and that new users have no reason to open. The
 * banner reuses <PwaInstallButton>, so its action is the native install prompt
 * where available and the animated guide everywhere else.
 *
 * Appears only when the app isn't already installed and the user hasn't
 * dismissed it before (persisted in localStorage).
 */
export function InstallBanner() {
  const installed = usePwaInstalled()
  // Hidden during SSR / first hydration (getServerSnapshot = true), then the
  // real localStorage value takes over — so it never flashes for users who
  // already dismissed it, with no hydration mismatch.
  const dismissed = useSyncExternalStore(subscribeDismiss, getDismissed, () => true)

  if (installed || dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {
      /* ignore — private mode, etc. */
    }
    window.dispatchEvent(new Event(DISMISS_EVENT))
  }

  return (
    <div className="relative mb-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900 p-4 pr-10">
      <button
        onClick={dismiss}
        aria-label="Închide"
        className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-indigo-700 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="6" y="2" width="12" height="20" rx="3" stroke="white" strokeWidth="1.8" />
            <path d="M12 7v6M9.5 10.5L12 13l2.5-2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Instalează aplicația</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Acces rapid de pe ecran, chiar și fără internet
          </p>
        </div>
      </div>

      <PwaInstallButton className="mt-3 w-full justify-center bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-indigo-600 transition" />
    </div>
  )
}
