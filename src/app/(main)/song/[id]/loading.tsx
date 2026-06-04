export default function SongLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 flex flex-col animate-pulse">
      {/* Sticky gray nav bar */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/95 dark:bg-gray-950/95 px-4 lg:px-6 pt-safe-bar pb-3 lg:pt-3 flex items-center justify-between">
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* White card */}
      <div className="px-3 lg:px-6 pb-3 flex-1 flex flex-col">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden flex-1">

          {/* Title area */}
          <div className="px-5 pt-5 pb-4">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
            <div className="h-5 w-16 bg-gray-100 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Controls bar */}
          <div className="px-4 py-3 border-t border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="h-8 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
              <div className="h-8 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
            </div>
          </div>

          {/* Lyrics skeleton */}
          <div className="px-5 py-5 space-y-6">
            {[4, 3, 4].map((lines, section) => (
              <div key={section} className="space-y-2">
                <div className="h-3 w-12 bg-indigo-100 dark:bg-indigo-900 rounded mb-3" />
                {Array.from({ length: lines }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 dark:bg-gray-700 rounded" style={{ width: `${50 + (i * 13) % 40}%` }} />
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
