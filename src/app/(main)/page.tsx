export const dynamic = "force-dynamic"

import { canEditSongs } from "@/auth"
import { getSession } from "@/lib/session"
import { db } from "@/lib/db"
import { favorites } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { getCachedSongs } from "@/lib/queries"
import { HomeClient } from "./HomeClient"

export default async function HomePage() {
  const session = await getSession()

  // Fetch all songs (cached); the client filters live as the user types.
  // Favorites stay dynamic — they are per-user.
  const [songs, favs] = await Promise.all([
    getCachedSongs(""),
    session?.user?.id
      ? db.select().from(favorites).where(eq(favorites.userId, session.user.id))
      : Promise.resolve([]),
  ])

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : null

  return (
    <HomeClient
      songs={songs}
      favIds={favs.map((f) => f.songId)}
      authenticated={!!session?.user}
      canEdit={!!session?.user && canEditSongs(session.user.role)}
      initials={initials}
    />
  )
}
