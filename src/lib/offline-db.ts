/**
 * IndexedDB helpers for offline song storage.
 * Only import this from client components — it uses browser APIs.
 */
import { openDB, type DBSchema } from "idb"

export interface OfflineSong {
  id: string
  title: string
  firstLine: string | null
  category: string | null
  defaultKey: string | null
  content: string
  hasChords: boolean
}

interface CaietDB extends DBSchema {
  songs: {
    key: string
    value: OfflineSong
    indexes: { "by-title": string }
  }
}

const DB_NAME = "caiet-cantari"
const DB_VERSION = 1

function getDB() {
  return openDB<CaietDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("songs", { keyPath: "id" })
      store.createIndex("by-title", "title")
    },
  })
}

/** Replace all stored songs with the freshly fetched list. */
export async function storeSongs(songs: OfflineSong[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("songs", "readwrite")
  await tx.store.clear()
  await Promise.all(songs.map((s) => tx.store.put(s)))
  await tx.done
}

/** Return all songs sorted by title (the index order). */
export async function getAllSongs(): Promise<OfflineSong[]> {
  const db = await getDB()
  return db.getAllFromIndex("songs", "by-title")
}

/** Return a single song by id. */
export async function getSongOffline(id: string): Promise<OfflineSong | undefined> {
  const db = await getDB()
  return db.get("songs", id)
}

/** True if we have at least one song stored. */
export async function hasSongsStored(): Promise<boolean> {
  const db = await getDB()
  return (await db.count("songs")) > 0
}
