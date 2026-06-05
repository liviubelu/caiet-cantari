import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanPeople } from "@/lib/schema"
import { eq } from "drizzle-orm"

// ── DELETE /api/services/[id]/people/[personId] ───────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; personId: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { personId } = await params
  await db.delete(servicePlanPeople).where(eq(servicePlanPeople.id, personId))
  return NextResponse.json({ ok: true })
}
