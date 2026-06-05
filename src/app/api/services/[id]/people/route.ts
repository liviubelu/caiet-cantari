import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanPeople } from "@/lib/schema"
import { eq, max } from "drizzle-orm"

// ── POST /api/services/[id]/people  { name: string } ─────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { id: planId } = await params
  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Numele este obligatoriu." }, { status: 400 })
  }

  const [{ maxPos }] = await db
    .select({ maxPos: max(servicePlanPeople.position) })
    .from(servicePlanPeople)
    .where(eq(servicePlanPeople.planId, planId))

  const [person] = await db
    .insert(servicePlanPeople)
    .values({ planId, name: name.trim(), position: (maxPos ?? -1) + 1 })
    .returning()

  return NextResponse.json(person)
}
