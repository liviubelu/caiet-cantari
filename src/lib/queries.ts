import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { songs } from "@/lib/schema"
import { eq, asc, or, sql } from "drizzle-orm"

// ── Songs list (home page) ──────────────────────────────────────────────────
// Cached on Vercel Data Cache, tagged "songs".
// revalidateTag("songs") in the API routes clears this immediately after
// any create / update / delete — so the next page render is always fresh.
// A new Vercel deploy also clears all caches automatically (new Build ID).
export const getCachedSongs = unstable_cache(
  async (q: string) => {
    let query = db
      .select({
        id: songs.id,
        title: songs.title,
        firstLine: songs.firstLine,
        category: songs.category,
        defaultKey: songs.defaultKey,
        hasChords: songs.hasChords,
      })
      .from(songs)
      .orderBy(asc(songs.title))
      .$dynamic()

    if (q) {
      // unaccent() normalises diacritics on both sides so "si" matches "și",
      // "a" matches "ă", etc. ilike handles case-insensitivity.
      const pattern = `%${q}%`
      query = query.where(
        or(
          sql`unaccent(${songs.title})     ilike unaccent(${pattern})`,
          sql`unaccent(${songs.firstLine}) ilike unaccent(${pattern})`,
          sql`unaccent(${songs.content})   ilike unaccent(${pattern})`
        )
      )
    }

    return query
  },
  ["songs-list"],
  { tags: ["songs"] }
)

// ── Songs for collections page ──────────────────────────────────────────────
// Same tag — revalidateTag("songs") clears this too.
export const getCachedSongsForCollections = unstable_cache(
  async () =>
    db
      .select({
        id: songs.id,
        title: songs.title,
        category: songs.category,
        defaultKey: songs.defaultKey,
        firstLine: songs.firstLine,
      })
      .from(songs)
      .orderBy(asc(songs.title)),
  ["songs-for-collections"],
  { tags: ["songs"] }
)

// ── Song detail ─────────────────────────────────────────────────────────────
// Two-layer cache:
//   1. unstable_cache  → persistent cross-request cache on Vercel Data Cache
//   2. React cache     → deduplicates within a single request so
//                        generateMetadata() and the page component share
//                        one lookup instead of two.
const getSongByIdPersisted = unstable_cache(
  async (id: string) => {
    const [song] = await db.select().from(songs).where(eq(songs.id, id)).limit(1)
    return song ?? null
  },
  ["song-by-id"],
  { tags: ["songs"] }
)

export const getSongById = cache(getSongByIdPersisted)

// ── All songs for offline sync endpoint ────────────────────────────────────
// Includes content so devices can display songs without internet.
// Tagged "songs" — cleared immediately when any song is added/edited/deleted.
export const getCachedSongsAll = unstable_cache(
  async () =>
    db
      .select({
        id: songs.id,
        title: songs.title,
        firstLine: songs.firstLine,
        category: songs.category,
        defaultKey: songs.defaultKey,
        content: songs.content,
        hasChords: songs.hasChords,
      })
      .from(songs)
      .orderBy(asc(songs.title)),
  ["songs-all"],
  { tags: ["songs"] }
)
