export default function SongLoading() {
  return (
    <div className="bg-white flex-1 animate-pulse">
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
      <div className="px-4 py-3 border-t border-b border-gray-100 flex items-center gap-3">
        <div className="h-8 w-24 bg-gray-100 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <div className="h-8 w-16 bg-gray-100 rounded-lg" />
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Lyrics skeleton */}
      <div className="px-4 lg:px-10 py-5 lg:max-w-3xl space-y-6">
        {[4, 3, 4].map((lines, section) => (
          <div key={section} className="space-y-2">
            <div className="h-3 w-12 bg-indigo-100 rounded mb-3" />
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${50 + (i * 13) % 40}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
