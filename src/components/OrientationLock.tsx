/**
 * Shown only when a phone is held in landscape (CSS-driven, see `.orientation-lock`
 * in globals.css). Keeps the normal app portrait-only; the presentation overlay
 * has a higher z-index, so landscape stays available there.
 */
export function OrientationLock() {
  return (
    <div className="orientation-lock fixed inset-0 z-[90] flex-col items-center justify-center gap-5 bg-[#f0f2f5] dark:bg-gray-950 text-center px-10">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="text-indigo-500 dark:text-indigo-400">
        <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 19h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M2.5 9a6 6 0 016-6M21.5 15a6 6 0 01-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M2.5 9l-1.2-2M2.5 9l2-1M21.5 15l1.2 2M21.5 15l-2 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Rotește telefonul vertical</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
          Aplicația se folosește pe verticală.<br />Modul prezentare funcționează pe lat.
        </p>
      </div>
    </div>
  )
}
