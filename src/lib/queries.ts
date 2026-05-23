import { cache } from "react"
import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { eq } from "drizzle-orm"

/**
 * Fetches a song by ID, cached per request.
 * Both generateMetadata and the page component can call this
 * without triggering duplicate DB queries.
 */
export const getSongById = cache(async (id: string) => {
  const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
  return song ?? null
})
