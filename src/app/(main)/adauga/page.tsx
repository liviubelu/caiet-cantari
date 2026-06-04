export const dynamic = "force-dynamic"

import { auth, canEditSongs } from "@/auth"
import { redirect } from "next/navigation"
import { SongForm } from "@/components/SongForm"
import Link from "next/link"

export default async function AdaugaPage() {
  const session = await auth()
  if (!session?.user?.id || !canEditSongs(session.user.role)) redirect("/")

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8">
      <div className="pt-safe-header lg:pt-6 pb-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="text-[28px] font-display font-bold text-gray-900 dark:text-gray-100">Melodie nouă</h1>
      </div>
      <div>
        <SongForm />
      </div>
    </div>
  )
}
