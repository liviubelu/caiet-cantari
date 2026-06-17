import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sendInstrumentistRequestEmail } from "@/lib/email"

// POST /api/requests/instrumentist — a logged-in user asks for instrumentist access.
// The request is emailed to the admin; the role is changed manually in /admin.
export async function POST() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 })
  }

  const name = session.user.name ?? "Utilizator"
  const email = session.user.email ?? ""

  try {
    await sendInstrumentistRequestEmail({ name, email })
  } catch (err) {
    console.error("Instrumentist request email failed:", err)
    return NextResponse.json({ error: "Nu s-a putut trimite cererea. Încearcă mai târziu." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
