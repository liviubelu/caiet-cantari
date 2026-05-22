import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { favorites, songs } from "@/lib/schema"
import { auth } from "@/auth"
import { and, eq } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json([], { status: 200 })

  const rows = await db
    .select({ song: songs })
    .from(favorites)
    .innerJoin(songs, eq(favorites.songId, songs.id))
    .where(eq(favorites.userId, session.user.id))

  return NextResponse.json(rows.map((r) => r.song))
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 })

  const { songId } = await req.json()
  const [fav] = await db
    .insert(favorites)
    .values({ userId: session.user.id, songId })
    .onConflictDoNothing()
    .returning()

  return NextResponse.json({ ok: true, fav }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 })

  const { songId } = await req.json()
  await db.delete(favorites).where(
    and(eq(favorites.userId, session.user.id), eq(favorites.songId, songId))
  )
  return NextResponse.json({ ok: true })
}
