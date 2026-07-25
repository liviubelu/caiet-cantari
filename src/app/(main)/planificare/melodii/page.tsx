export const dynamic = "force-dynamic"

import { auth, canPlan } from "@/auth"
import { redirect } from "next/navigation"
import { getCachedSongs } from "@/lib/queries"
import { SongPickerClient } from "./SongPickerClient"

interface Props {
  searchParams: Promise<{ planId?: string; period?: string; returnDate?: string }>
}

export default async function MelodiiPickerPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) redirect("/")

  const { planId, period, returnDate } = await searchParams
  if (!planId || !period) redirect("/planificare")

  const allSongs = await getCachedSongs("")

  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-gray-950">
      <SongPickerClient
        allSongs={allSongs}
        planId={planId}
        period={period as "morning" | "evening"}
        returnDate={returnDate ?? ""}
      />
    </div>
  )
}
