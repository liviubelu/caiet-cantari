import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { ADMIN_EMAIL } from "@/auth"

export async function POST(req: Request) {
  const { token, firstName, lastName, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: "Date incomplete." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Parola trebuie să aibă minim 6 caractere." }, { status: 400 })
  }

  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.token, token))
    .limit(1)

  if (!vt) return NextResponse.json({ error: "Link invalid sau expirat." }, { status: 400 })
  if (vt.expiresAt < new Date()) {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token))
    return NextResponse.json({ error: "Link-ul a expirat. Solicită unul nou." }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const role = vt.email === ADMIN_EMAIL ? "admin" : "user"

  const [existing] = await db.select().from(users).where(eq(users.email, vt.email)).limit(1)

  if (existing) {
    await db.update(users).set({
      firstName: firstName || existing.firstName,
      lastName: lastName || existing.lastName,
      passwordHash,
      emailVerified: new Date(),
      role,
    }).where(eq(users.email, vt.email))
  } else {
    await db.insert(users).values({
      email: vt.email,
      firstName,
      lastName,
      passwordHash,
      emailVerified: new Date(),
      role,
    })
  }

  await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

  return NextResponse.json({ ok: true, email: vt.email }, { status: 200 })
}
