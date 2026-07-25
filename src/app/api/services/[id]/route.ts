import { NextResponse } from "next/server"
import { auth, canPlan } from "@/auth"
import { db } from "@/lib/db"
import { servicePlans } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { id } = await params
  const { notesMorning, notesEvening, eventType } = await req.json()
  const [plan] = await db.update(servicePlans).set({
    ...(notesMorning  !== undefined && { notesMorning }),
    ...(notesEvening  !== undefined && { notesEvening }),
    ...(eventType     !== undefined && { eventType }),
  }).where(eq(servicePlans.id, id)).returning()
  if (!plan) return NextResponse.json({ error: "Planificarea nu a fost găsită." }, { status: 404 })
  return NextResponse.json(plan)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { id } = await params
  await db.delete(servicePlans).where(eq(servicePlans.id, id))
  return NextResponse.json({ ok: true })
}
