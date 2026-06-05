import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanSongs } from "@/lib/schema"
import { eq } from "drizzle-orm"

// ── POST /api/services/[id]/songs/reorder  { ids: string[] } ─────────────────
// ids = ordered array of servicePlanSongs.id for a given period

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { ids } = await req.json() as { ids: string[] }
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids trebuie să fie un array." }, { status: 400 })
  }

  await Promise.all(
    ids.map((id, position) =>
      db.update(servicePlanSongs).set({ position }).where(eq(servicePlanSongs.id, id))
    )
  )

  return NextResponse.json({ ok: true })
}
