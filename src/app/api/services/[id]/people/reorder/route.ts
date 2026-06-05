import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanPeople } from "@/lib/schema"
import { eq } from "drizzle-orm"

// ── POST /api/services/[id]/people/reorder  { ids: string[] } ─────────────────

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
      db.update(servicePlanPeople).set({ position }).where(eq(servicePlanPeople.id, id))
    )
  )

  return NextResponse.json({ ok: true })
}
