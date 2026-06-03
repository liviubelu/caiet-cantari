export const dynamic = "force-dynamic"

import { getSession } from "@/lib/session"
import { BottomNav } from "@/components/BottomNav"
import { Sidebar } from "@/components/Sidebar"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const user = session?.user
    ? { name: session.user.name ?? null, role: (session.user as { role?: string }).role ?? null }
    : null

  return (
    <div className="h-dvh overflow-hidden bg-[#f0f2f5]">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar user={user} />

      {/* Content — the ONLY scroll container; prevents iOS overscroll glitches */}
      <div className="lg:pl-64 h-full overflow-y-auto overscroll-contain">
        <main className="pb-32 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <BottomNav />
    </div>
  )
}
