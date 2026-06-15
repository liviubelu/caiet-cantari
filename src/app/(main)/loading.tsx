export default function HomeLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 animate-pulse">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/95 dark:bg-gray-950/95 px-4 lg:px-8 pt-safe-header lg:pt-6 pb-3">
        {/* Mobile header row */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-1.5" />
        <div className="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        {/* Search bar */}
        <div className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
      </div>

      {/* Song cards */}
      <div className="px-4 lg:px-8 py-2">
        {[3, 2, 2].map((count, gi) => (
          <div key={gi} className="mb-4">
            <div className="h-3 w-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 mx-1" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-100 dark:bg-gray-700 rounded-md" />
                    <div className="h-6 w-6 bg-gray-100 dark:bg-gray-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
