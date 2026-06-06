export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh overflow-y-auto overscroll-none bg-[#f0f2f5] dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
