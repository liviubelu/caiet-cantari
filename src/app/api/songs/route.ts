import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { auth } from "@/auth"
import { asc, ilike, or } from "drizzle-orm"
import { extractFirstLine } from "@/lib/chordpro"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  let query = db.select().from(songs).orderBy(asc(songs.title)).$dynamic()

  if (q) {
    query = query.where(
      or(ilike(songs.title, `%${q}%`), ilike(songs.firstLine, `%${q}%`))
    )
  }

  const result = await query
  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 })
  }

  const { title, content, category, defaultKey } = await req.json()
  if (!title || !content) {
    return NextResponse.json({ error: "Titlul și conținutul sunt obligatorii." }, { status: 400 })
  }

  const firstLine = extractFirstLine(content)
  const [song] = await db
    .insert(songs)
    .values({ title, content, firstLine, category, defaultKey, createdBy: session.user.id })
    .returning()

  return NextResponse.json(song, { status: 201 })
}
