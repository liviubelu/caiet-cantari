import { BottomNav } from "@/components/BottomNav"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex justify-center">
      <div className="w-full max-w-lg flex flex-col min-h-screen">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </div>
  )
}
