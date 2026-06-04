export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { asc } from "drizzle-orm"
import { AdminUsersClient } from "./AdminUsersClient"
import Link from "next/link"

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== "admin") redirect("/")

  const allUsers = await db
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

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 pt-safe-header pb-8 lg:pt-12">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cont" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
              Administrator
            </p>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">Utilizatori</h1>
          </div>
        </div>

        <AdminUsersClient initialUsers={allUsers} />
      </div>
    </div>
  )
}
