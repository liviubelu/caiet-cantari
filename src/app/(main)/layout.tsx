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
    <div className="h-dvh overflow-hidden bg-[#f0f2f5]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar user={user} />

      {/* Content — the ONLY scroll container; prevents iOS overscroll glitches */}
      <div className="lg:pl-64 h-full overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto lg:max-w-none lg:mx-0">
          <main className="pb-24 lg:pb-12">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  )
}
