import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlans } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidateTag } from "next/cache"

// ── PATCH /api/services/[id]  { notesMorning?, notesEvening? } ───────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { id } = await params
  const { notesMorning, notesEvening } = await req.json()

  const [plan] = await db
    .update(servicePlans)
    .set({
      ...(notesMorning !== undefined && { notesMorning }),
      ...(notesEvening !== undefined && { notesEvening }),
    })
    .where(eq(servicePlans.id, id))
    .returning()

  if (!plan) return NextResponse.json({ error: "Planificarea nu a fost găsită." }, { status: 404 })
  return NextResponse.json(plan)
}
