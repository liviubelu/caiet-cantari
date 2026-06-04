import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { auth, canEditSongs } from "@/auth"
import { eq } from "drizzle-orm"
import { extractFirstLine } from "@/lib/chordpro"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  if (!song) return NextResponse.json({ error: "Melodia nu a fost găsită." }, { status: 404 })
  return NextResponse.json(song)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { id } = await params
  const { title, content, category, defaultKey } = await req.json()
  if (!title || !content) {
    return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii." }, { status: 400 })
  }

  const firstLine = extractFirstLine(content)
  const hasChords = content.includes("[")
  const [song] = await db
    .update(songs)
    .set({ title, content, firstLine, category, defaultKey, hasChords })
    .where(eq(songs.id, id))
    .returning()

  if (!song) return NextResponse.json({ error: "Melodia nu a fost găsită." }, { status: 404 })
  revalidateTag("songs")
  return NextResponse.json(song)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { id } = await params
  await db.delete(songs).where(eq(songs.id, id))
  revalidateTag("songs")
  return NextResponse.json({ ok: true })
}
