export const dynamic = "force-dynamic"

import { auth, canEditSongs } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { servicePlans, servicePlanSongs, songs } from "@/lib/schema"
import { and, eq, gte } from "drizzle-orm"
import { StatisticiClient, type StatWindow } from "./StatisticiClient"

/** Date string (YYYY-MM-DD) for `n` months before today. */
function monthsAgo(n: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

type Row = { songId: string; planId: string; title: string; defaultKey: string | null; date: string }

function aggregate(rows: Row[], threshold: string): StatWindow {
  const inWindow = rows.filter((r) => r.date >= threshold)
  const map = new Map<string, { id: string; title: string; defaultKey: string | null; count: number; lastSung: string }>()
  const events = new Set<string>()
  for (const r of inWindow) {
    events.add(r.planId)
    const e = map.get(r.songId)
    if (e) {
      e.count++
      if (r.date > e.lastSung) e.lastSung = r.date
    } else {
      map.set(r.songId, { id: r.songId, title: r.title, defaultKey: r.defaultKey, count: 1, lastSung: r.date })
    }
  }
  const items = [...map.values()].sort(
    (a, b) => b.count - a.count || b.lastSung.localeCompare(a.lastSung) || a.title.localeCompare(b.title)
  )
  return { items, totalSung: inWindow.length, distinctSongs: map.size, events: events.size }
}

export default async function StatisticiPage() {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) redirect("/")

  const threshold12 = monthsAgo(12)

  // Fetch every "sung" song instance from the last 12 months once, then derive
  // the 1 / 6 / 12-month windows in memory.
  const rows: Row[] = await db
    .select({
      songId: servicePlanSongs.songId,
      planId: servicePlanSongs.planId,
      title: songs.title,
      defaultKey: songs.defaultKey,
      date: servicePlans.date,
    })
    .from(servicePlanSongs)
    .innerJoin(servicePlans, eq(servicePlanSongs.planId, servicePlans.id))
    .innerJoin(songs, eq(servicePlanSongs.songId, songs.id))
    .where(and(eq(servicePlanSongs.sung, true), gte(servicePlans.date, threshold12)))

  const windows = [
    { key: "1", label: "Ultima lună", ...aggregate(rows, monthsAgo(1)) },
    { key: "6", label: "Ultimele 6 luni", ...aggregate(rows, monthsAgo(6)) },
    { key: "12", label: "Ultimele 12 luni", ...aggregate(rows, threshold12) },
  ]

  return (
    <div className="bg-[#f0f2f5] dark:bg-gray-950 flex-1">
      <div className="max-w-3xl mx-auto px-4 lg:px-8">
        <div className="pt-safe-header lg:pt-6 pb-4">
          <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">
            Instrumentiști
          </p>
          <h1 className="text-[28px] font-display font-bold text-gray-900 dark:text-gray-100 leading-tight">
            Statistici cântări
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Cât de des au fost cântate melodiile în programe (doar cele marcate ca fiind cântate).
          </p>
        </div>

        <StatisticiClient windows={windows} />
      </div>
    </div>
  )
}
