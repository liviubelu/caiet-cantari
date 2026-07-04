/**
 * Opens the song as a real PDF (chords above lyrics, auto-fit to one A4 page) in
 * a new tab, via the /song/[id]/handout route. It renders inline in the
 * browser's PDF viewer, where the user prints/saves it (Ctrl+P). Identical on
 * phone and desktop since it's the same server-generated file.
 */
export function PdfExportButton({ songId }: { songId: string }) {
  return (
    <a
      href={`/song/${songId}/handout`}
      target="_blank"
      rel="noopener noreferrer"
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
