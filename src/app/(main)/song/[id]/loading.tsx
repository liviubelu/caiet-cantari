export default function SongLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/95 border-b border-gray-100 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-100 rounded" />
      </div>

      {/* Title area */}
      <div className="px-4 lg:px-10 pt-5 pb-4">
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-7 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
      </div>

      {/* Controls bar */}
      <div className="px-4 lg:px-10 pb-4 flex items-center gap-3">
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        <div className="h-8 w-16 bg-gray-100 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Lyrics skeleton */}
      <div className="px-4 lg:px-10 py-5 space-y-6">
        {[1, 2, 3].map((section) => (
          <div key={section} className="space-y-2">
            <div className="h-3 w-12 bg-indigo-100 rounded mb-3" />
            {Array.from({ length: section === 2 ? 3 : 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-2.5 bg-gray-100 rounded w-16" />
                <div
                  className="h-4 bg-gray-200 rounded"
                  style={{ width: `${55 + Math.random() * 35}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
