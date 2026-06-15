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
    // Account already exists & verified. Don't reveal this (avoids email
    // enumeration) — return the same success shape, but skip sending a new
    // verification email. The user should sign in or use "forgot password".
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db
    .insert(verificationTokens)
    .values({ token, email: normalizedEmail, expiresAt })
    .onConflictDoNothing()

  try {
    await sendVerificationEmail(normalizedEmail, token)
  } catch (err) {
    // Clean up the token if email failed to send
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token))
    console.error("Email send error:", err)
    return NextResponse.json(
      { error: "Nu s-a putut trimite emailul de confirmare. Contactează administratorul pentru a-ți crea contul." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
