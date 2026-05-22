import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { sendVerificationEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Emailul este obligatoriu." }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  if (existing?.emailVerified) {
    return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 })
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db
    .insert(verificationTokens)
    .values({ token, email: normalizedEmail, expiresAt })
    .onConflictDoNothing()

  await sendVerificationEmail(normalizedEmail, token)

  return NextResponse.json({ ok: true }, { status: 200 })
}
