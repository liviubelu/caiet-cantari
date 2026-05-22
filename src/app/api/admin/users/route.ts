import { NextResponse } from "next/server"
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
