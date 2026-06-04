"use client"

import { useRouter } from "next/navigation"

export function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    // Go back in browser history; fall back to home if there's no history
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Înapoi
    </button>
  )
}
