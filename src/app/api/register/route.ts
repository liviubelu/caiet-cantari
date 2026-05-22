import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST(req: Request) {
  const { email, password, firstName, lastName } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email și parola sunt obligatorii." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Parola trebuie să aibă minim 6 caractere." }, { status: 400 })
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const [user] = await db
    .insert(users)
    .values({ email, firstName, lastName, passwordHash })
    .returning({ id: users.id, email: users.email })

  return NextResponse.json({ user }, { status: 201 })
}
