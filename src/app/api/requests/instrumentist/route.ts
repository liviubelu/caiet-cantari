import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { requestCooldowns } from "@/lib/schema"
import { sendInstrumentistRequestEmail } from "@/lib/email"

const COOLDOWN_MS = 10 * 60 * 1000 // 10 minutes between requests, per user

// POST /api/requests/instrumentist — a logged-in user asks for instrumentist access.
// Rate-limited to once per 10 min/user (server-side, so a page refresh can't bypass it).
// The request is emailed to the admin; the role is changed manually in /admin.
export async function POST() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Trebuie să fii autentificat." }, { status: 401 })
  }
  const userId = session.user.id

  // Enforce the cooldown
  const [row] = await db
    .select()
    .from(requestCooldowns)
    .where(eq(requestCooldowns.userId, userId))
    .limit(1)

  const last = row?.instrumentistAt
  if (last) {
    const elapsed = Date.now() - last.getTime()
    if (elapsed < COOLDOWN_MS) {
      const mins = Math.max(1, Math.ceil((COOLDOWN_MS - elapsed) / 60000))
      return NextResponse.json(
        { error: `Ai trimis deja o cerere recent. Mai poți trimite peste ~${mins} min.`, retryInMinutes: mins },
        { status: 429 }
      )
    }
  }

  const name = session.user.name ?? "Utilizator"
  const email = session.user.email ?? ""

  try {
    await sendInstrumentistRequestEmail({ name, email })
  } catch (err) {
    console.error("Instrumentist request email failed:", err)
    return NextResponse.json({ error: "Nu s-a putut trimite cererea. Încearcă mai târziu." }, { status: 500 })
  }

  // Record the time only after a successful send.
  const now = new Date()
  await db
    .insert(requestCooldowns)
    .values({ userId, instrumentistAt: now })
    .onConflictDoUpdate({ target: requestCooldowns.userId, set: { instrumentistAt: now } })

  return NextResponse.json({ ok: true })
}
