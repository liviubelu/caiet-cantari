export default function StatisticiLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 animate-pulse">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <div className="pt-safe-header lg:pt-6 pb-4">
          <div className="h-2.5 w-24 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-1.5" />
          <div className="h-3.5 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Window tabs */}
        <div className="flex gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl" />
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 space-y-2">
              <div className="h-5 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
              <div className="h-2.5 w-3/4 bg-gray-100 dark:bg-gray-700 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* List */}
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2.5">
              <div className="w-6 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
              </div>
              <div className="h-6 w-8 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
