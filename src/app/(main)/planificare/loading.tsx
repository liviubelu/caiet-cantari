export default function PlanificareLoading() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#f0f2f5] dark:bg-gray-950 animate-pulse">
      {/* Left panel — calendar */}
      <div className="flex flex-col lg:w-72 xl:w-80 lg:border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        {/* Month nav + create button */}
        <div className="px-4 lg:px-5 pt-safe-header lg:pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-28 bg-gray-300 dark:bg-gray-700 rounded" />
            <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 mb-0.5 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 w-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 px-3 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 flex flex-wrap gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>

        {/* Events list */}
        <div className="px-3 pb-4">
          <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 mx-2" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — empty placeholder (desktop only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  )
}
