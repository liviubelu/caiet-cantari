"use client"

/**
 * "PDF" action next to the presentation button.
 *
 * Desktop/Android: opens the real server-generated PDF (/song/[id]/handout) in a
 * new tab — it renders in the browser's PDF viewer with print/save controls.
 *
 * iOS: a raw PDF opens with no back button and print buried in Share, which
 * feels bare/trapped. So there we go to the in-app sheet viewer (/sheet) — same
 * tab, with a proper Back button and a "Descarcă PDF" action.
 */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

export function PdfExportButton({ songId }: { songId: string }) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isIos()) {
      e.preventDefault()
      window.location.href = `/song/${songId}/sheet`
    }
    // otherwise let the anchor open the PDF in a new tab
  }

  return (
    <a
      href={`/song/${songId}/handout`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      PDF
    </a>
  )
}
