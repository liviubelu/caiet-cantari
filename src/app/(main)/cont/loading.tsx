export default function ContLoading() {
  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1 animate-pulse">
      <div className="max-w-xl mx-auto px-4 lg:px-0">
        <div className="pt-safe-header lg:pt-6 pb-4">
          <div className="h-2.5 w-12 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
          <div className="h-7 w-40 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>

        <div className="space-y-3">
          {/* Profile card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-44 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-4 w-20 bg-gray-100 dark:bg-gray-700 rounded-full" />
            </div>
          </div>

          {/* Setting cards (dark mode + PWA install) */}
          {[0, 1].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-52 bg-gray-100 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />
            </div>
          ))}

          {/* Version / church info card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-50 dark:border-gray-700 space-y-2">
              <div className="h-3 w-24 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="px-4 py-3.5 space-y-2">
              <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>

          {/* Sign out */}
          <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
