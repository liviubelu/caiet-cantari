import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { loginAttempts } from "@/lib/schema"

// GET /api/auth/throttle?email=... → { minutes } remaining in the login lockout
// (0 if not locked). The login page calls this after a failed sign-in to show a
// clear "too many attempts" message instead of the generic one. Fail-open.
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.toLowerCase().trim()
  if (!email) return NextResponse.json({ minutes: 0 })
  try {
    const [a] = await db.select().from(loginAttempts).where(eq(loginAttempts.email, email)).limit(1)
    const ms = a?.lockedUntil ? a.lockedUntil.getTime() - Date.now() : 0
    return NextResponse.json({ minutes: ms > 0 ? Math.ceil(ms / 60000) : 0 })
  } catch {
    return NextResponse.json({ minutes: 0 })
  }
}
