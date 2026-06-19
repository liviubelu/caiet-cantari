import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users, loginAttempts } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const ADMIN_EMAIL = "liviu_belu@yahoo.com"

export function canEditSongs(role: string | undefined | null) {
  return role === "admin" || role === "instrumentist"
}

// ── Login brute-force throttle ──────────────────────────────────────────────
// Per email: after MAX_FAILS wrong passwords within WINDOW, lock for LOCK_MS.
// All DB calls are fail-open — if the throttle store is unavailable the login
// proceeds normally (availability over a brief throttle gap).
const MAX_FAILS = 5
const WINDOW_MS = 15 * 60 * 1000
const LOCK_MS = 15 * 60 * 1000

async function isLockedOut(email: string): Promise<boolean> {
  try {
    const [a] = await db.select().from(loginAttempts).where(eq(loginAttempts.email, email)).limit(1)
    return !!a?.lockedUntil && a.lockedUntil.getTime() > Date.now()
  } catch {
    return false
  }
}

async function recordFailure(email: string): Promise<void> {
  try {
    const now = new Date()
    const [a] = await db.select().from(loginAttempts).where(eq(loginAttempts.email, email)).limit(1)
    const within = !!a?.lastAttempt && now.getTime() - a.lastAttempt.getTime() < WINDOW_MS
    const fails = (within ? a!.fails ?? 0 : 0) + 1
    const lockedUntil = fails >= MAX_FAILS ? new Date(now.getTime() + LOCK_MS) : null
    await db
      .insert(loginAttempts)
      .values({ email, fails, lastAttempt: now, lockedUntil })
      .onConflictDoUpdate({ target: loginAttempts.email, set: { fails, lastAttempt: now, lockedUntil } })
  } catch {
    /* fail-open */
  }
}

async function clearAttempts(email: string): Promise<void> {
  try {
    await db.delete(loginAttempts).where(eq(loginAttempts.email, email))
  } catch {
    /* ignore */
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim()
        const password = credentials?.password as string
        if (!email || !password) return null

        // Too many recent failures for this email → reject without checking.
        if (await isLockedOut(email)) return null

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        // Don't record failures for non-existent / unverified accounts (they
        // can't succeed anyway, and it avoids the table filling with sprayed emails).
        if (!user?.passwordHash || !user.emailVerified) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          await recordFailure(email)
          return null
        }

        await clearAttempts(email)
        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role ?? "user"
      }
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.role) session.user.role = token.role as string
      return session
    },
  },
})
