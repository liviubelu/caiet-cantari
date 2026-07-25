"use client"

import { handoutFileName } from "@/lib/handout-name"

/**
 * Opens the song as a real PDF (chords above lyrics, auto-fit to one A4 page) in
 * a new tab. The URL ends in the song's filename (…/handout/El e Fântâna.pdf) so
 * the browser's built-in PDF viewer saves it with the song's name, not "handout".
 *
 * The current transpose is read at click time from sessionStorage (written by
 * SongDetailClient), so the PDF comes out in the key shown on screen.
 */
export function PdfExportButton({ songId, songTitle }: { songId: string; songTitle: string }) {
  function buildUrl(): string {
    const name = encodeURIComponent(handoutFileName(songTitle))
    let st = 0
    try {
      st = parseInt(sessionStorage.getItem(`transpose:${songId}`) ?? "0", 10) || 0
    } catch {}
    return `/song/${songId}/handout/${name}${st ? `?st=${st}` : ""}`
  }

  function open(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    window.open(buildUrl(), "_blank", "noopener,noreferrer")
  }

  return (
    <a
      href={`/song/${songId}/handout/${encodeURIComponent(handoutFileName(songTitle))}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={open}
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
