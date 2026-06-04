export default function ColectiiLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 animate-pulse">
      <div className="px-4 lg:px-8 pt-safe-header lg:pt-6 pb-4">
        <div className="h-2.5 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
        <div className="h-7 w-28 bg-gray-300 dark:bg-gray-700 rounded mb-1.5" />
        <div className="h-3.5 w-52 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      <div className="px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
