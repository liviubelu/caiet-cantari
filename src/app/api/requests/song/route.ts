import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sendSongRequestEmail } from "@/lib/email"

// POST /api/requests/song { title, link?, notes? }
// A logged-in user requests a song that's not yet in the songbook. Emailed to admin.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 })
  }

  let body: { title?: unknown; link?: unknown; notes?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 })
  }

  const title = String(body.title ?? "").trim().slice(0, 200)
  if (!title) {
    return NextResponse.json({ error: "Titlul melodiei este obligatoriu." }, { status: 400 })
  }
  const link = String(body.link ?? "").trim().slice(0, 500)
  const notes = String(body.notes ?? "").trim().slice(0, 2000)

  const name = session.user.name ?? "Utilizator"
  const email = session.user.email ?? ""

  try {
    await sendSongRequestEmail({ name, email, title, link: link || undefined, notes: notes || undefined })
  } catch (err) {
    console.error("Song request email failed:", err)
    return NextResponse.json({ error: "Nu s-a putut trimite cererea. Încearcă mai târziu." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
