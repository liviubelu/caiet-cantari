"use client"

import { useRouter } from "next/navigation"

/**
 * Top bar for the in-app sheet viewer: a real Back button (so the user is never
 * trapped, e.g. on iOS) plus "Descarcă PDF" which opens the actual PDF where the
 * OS print/share options live. Hidden when printing.
 */
export function SheetToolbar({ songId, title }: { songId: string; title: string }) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 pt-safe-bar print:hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gray-900 px-2 py-1.5 -ml-1 rounded-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Înapoi
        </button>
        <p className="flex-1 min-w-0 truncate text-center text-sm font-semibold text-gray-800">{title}</p>
        <a
          href={`/song/${songId}/handout`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-gray-700 transition flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V3M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15v4a1 1 0 001 1h12a1 1 0 001-1v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          PDF
        </a>
      </div>
    </div>
  )
}
