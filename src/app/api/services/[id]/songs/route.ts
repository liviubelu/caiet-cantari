import { NextResponse } from "next/server"
import { auth, canPlan } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanSongs, songs } from "@/lib/schema"
import { eq, and, asc, max } from "drizzle-orm"

// ── POST /api/services/[id]/songs  { songId, period, key? } ──────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { id: planId } = await params
  const { songId, period, key } = await req.json()
  if (!songId || !period) {
    return NextResponse.json({ error: "songId și period sunt obligatorii." }, { status: 400 })
  }

  // Get the next position
  const [{ maxPos }] = await db
    .select({ maxPos: max(servicePlanSongs.position) })
    .from(servicePlanSongs)
    .where(and(eq(servicePlanSongs.planId, planId), eq(servicePlanSongs.period, period)))

  const position = (maxPos ?? -1) + 1

  const [item] = await db
    .insert(servicePlanSongs)
    .values({ planId, songId, period, position, key: key ?? null })
    .returning()

  // Return item enriched with song title
  const [song] = await db
    .select({ title: songs.title, defaultKey: songs.defaultKey })
    .from(songs)
    .where(eq(songs.id, songId))
    .limit(1)

  return NextResponse.json({ ...item, title: song?.title ?? "", defaultKey: song?.defaultKey ?? null })
}
