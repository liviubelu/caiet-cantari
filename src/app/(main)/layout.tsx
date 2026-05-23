export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { BottomNav } from "@/components/BottomNav"
import { Sidebar } from "@/components/Sidebar"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user
    ? { name: session.user.name ?? null, role: (session.user as { role?: string }).role ?? null }
    : null

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar user={user} />

      {/* Content */}
      <div className="lg:pl-64 min-h-screen">
        <div className="flex justify-center">
          <div className="w-full max-w-lg lg:max-w-2xl">
            <main className="pb-20 lg:pb-12">{children}</main>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  )
}
