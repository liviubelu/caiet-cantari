import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlanSongs } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { itemId } = await params
  const { sung } = await req.json()
  const [item] = await db.update(servicePlanSongs)
    .set({ sung })
    .where(eq(servicePlanSongs.id, itemId))
    .returning()
  return NextResponse.json(item)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { itemId } = await params
  await db.delete(servicePlanSongs).where(eq(servicePlanSongs.id, itemId))
  return NextResponse.json({ ok: true })
}
