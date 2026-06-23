export default function FavoriteLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 animate-pulse">
      <div className="px-4 lg:px-8 pt-safe-header lg:pt-6 pb-4">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        {/* Desktop title */}
        <div className="hidden lg:block h-7 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-4" />

        {/* Quote placeholder */}
        <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-3 py-1 mb-4 space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        </div>
      </div>

      {/* Song cards */}
      <div className="px-4 lg:px-8">
        {[3, 2].map((count, gi) => (
          <div key={gi} className="mb-5">
            <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
