export const dynamic = "force-dynamic"

import { auth, canEditSongs } from "@/auth"
import { redirect } from "next/navigation"
import { SongForm } from "@/components/SongForm"
import Link from "next/link"

export default async function AdaugaPage() {
  const session = await auth()
  if (!session?.user?.id || !canEditSongs(session.user.role)) redirect("/")

  return (
    <div>
      <div className="px-4 pt-12 lg:pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-[28px] font-display font-bold text-gray-900">Melodie nouă</h1>
      </div>
      <div className="px-4">
        <SongForm />
      </div>
    </div>
  )
}
