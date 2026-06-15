import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export const ADMIN_EMAIL = "liviu_belu@yahoo.com"

export function canEditSongs(role: string | undefined | null) {
  return role === "admin" || role === "instrumentist"
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

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user?.passwordHash) return null
        if (!user.emailVerified) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

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
