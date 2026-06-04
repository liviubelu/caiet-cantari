import { getCachedSongsAll } from "@/lib/queries"

// Public endpoint — songs are already visible to everyone on the home page.
// Used by the offline sync mechanism to download all songs to IndexedDB.
// Cached on Vercel Data Cache (tag "songs"); revalidated immediately when
// any song is added, edited, or deleted via revalidateTag("songs").
export async function GET() {
  const songs = await getCachedSongsAll()
  return Response.json(songs)
}
