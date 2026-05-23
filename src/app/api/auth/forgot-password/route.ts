import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: "Emailul este obligatoriu." }, { status: 400 })

  const normalizedEmail = email.toLowerCase().trim()

  // Always return success to avoid email enumeration
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (!user?.emailVerified) {
    // Don't reveal whether account exists
    return NextResponse.json({ ok: true })
  }

  // Delete any existing reset tokens for this email
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.email, normalizedEmail))

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.insert(passwordResetTokens).values({ token, email: normalizedEmail, expiresAt })

  try {
    await sendPasswordResetEmail(normalizedEmail, token)
  } catch (err) {
    console.error("Password reset email error:", err)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))
    return NextResponse.json(
      { error: "Nu s-a putut trimite emailul. Încearcă din nou sau contactează administratorul." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
