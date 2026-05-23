import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { auth } from "@/auth"
import { eq, asc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const all = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt))

  return NextResponse.json(all)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { email, firstName, lastName, password, role } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email și parola sunt obligatorii." }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Parola trebuie să aibă minim 6 caractere." }, { status: 400 })
  }
  if (!["instrumentist", "user"].includes(role)) {
    return NextResponse.json({ error: "Rol invalid." }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
  if (existing) {
    return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [created] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      firstName: firstName || null,
      lastName: lastName || null,
      passwordHash,
      role,
      emailVerified: new Date(),
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })

  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { userId, role } = await req.json()
  if (!userId || !["admin", "instrumentist", "user"].includes(role)) {
    return NextResponse.json({ error: "Date invalide." }, { status: 400 })
  }

  const [updated] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, role: users.role })

  return NextResponse.json(updated)
}
