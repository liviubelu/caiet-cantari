"use client"

import { PwaInstallButton, usePwaInstalled } from "@/components/PwaInstallButton"

/**
 * The "Instalează aplicația" card on the account page.
 *
 * Lives in its own client component so the whole card (not just the button)
 * disappears once the app is installed / running standalone.
 */
export function InstallCard() {
  const installed = usePwaInstalled()
  if (installed) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Instalează aplicația</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Acces rapid de pe ecranul principal</p>
        </div>
        <PwaInstallButton className="bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-indigo-600 transition flex-shrink-0" />
      </div>
    </div>
  )
}
