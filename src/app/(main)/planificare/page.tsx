export const dynamic = "force-dynamic"

import { auth, canEditSongs } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { getCachedSongs } from "@/lib/queries"
import { PlanificareClient } from "./PlanificareClient"

export default async function PlanificarePage() {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) redirect("/")

  const [allSongs, allUsers] = await Promise.all([
    getCachedSongs(""),
    db.select({ firstName: users.firstName, lastName: users.lastName }).from(users),
  ])

  const userNames = allUsers
    .map((u) => [u.firstName, u.lastName].filter(Boolean).join(" "))
    .filter(Boolean)

  return (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] dark:bg-gray-950">
      <PlanificareClient allSongs={allSongs} userNames={userNames} />
    </div>
  )
}
