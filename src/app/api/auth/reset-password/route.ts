import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: "Date incomplete." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Parola trebuie să aibă minim 6 caractere." }, { status: 400 })
  }

  const [rt] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1)

  if (!rt) {
    return NextResponse.json({ error: "Link invalid sau expirat." }, { status: 400 })
  }
  if (rt.expiresAt < new Date()) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))
    return NextResponse.json({ error: "Link-ul a expirat. Solicită unul nou." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, rt.email))

  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))

  return NextResponse.json({ ok: true, email: rt.email })
}
