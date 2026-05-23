export default function FavoriteLoading() {
  return (
    <div className="lg:max-w-2xl lg:mx-auto animate-pulse">
      <div className="px-4 pt-12 lg:pt-6 pb-4">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>

        {/* Quote placeholder */}
        <div className="border-l-2 border-gray-200 pl-3 py-1 mb-4 space-y-1.5">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-white rounded-xl p-3 border border-gray-100 space-y-2">
              <div className="h-5 w-6 bg-gray-200 rounded mx-auto" />
              <div className="h-2.5 bg-gray-100 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Song cards */}
      <div className="px-4 space-y-5">
        {[3, 2].map((count, gi) => (
          <div key={gi}>
            <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
            <div className="space-y-2">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="h-6 w-6 bg-red-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
