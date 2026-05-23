// Home page skeleton — shown instantly while songs load from DB
export default function HomeLoading() {
  return (
    <div className="lg:max-w-2xl lg:mx-auto animate-pulse">
      {/* Header area */}
      <div className="sticky top-0 z-40 bg-[#f0f2f5]/95 px-4 pt-12 lg:pt-6 pb-3">
        {/* Mobile header row */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>
        <div className="h-7 w-48 bg-gray-200 rounded mb-1.5" />
        <div className="h-3.5 w-20 bg-gray-200 rounded mb-4" />
        {/* Search bar */}
        <div className="w-full h-10 bg-white border border-gray-200 rounded-xl" />
      </div>

      {/* Song cards */}
      <div className="px-4 py-2 space-y-4">
        {[1, 2, 3].map((g) => (
          <div key={g}>
            <div className="h-3 w-4 bg-gray-200 rounded mb-2 mx-1" />
            <div className="space-y-2">
              {Array.from({ length: g === 1 ? 3 : g === 2 ? 2 : 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 bg-gray-100 rounded-md" />
                    <div className="h-6 w-6 bg-gray-100 rounded-full" />
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
