"use client"

import { useTheme } from "@/components/ThemeProvider"

export function DarkModeToggle() {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"

  return (
    <div className="px-4 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Mod întunecat</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {isDark ? "Activ" : "Inactiv"}
        </p>
      </div>
      <button
        onClick={toggle}
        aria-label="Toggle dark mode"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isDark ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  )
}
