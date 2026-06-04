export function KeyBadge({ keyName }: { keyName: string }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-semibold font-mono border border-gray-200 dark:border-gray-600">
      {keyName}
    </span>
  )
}
