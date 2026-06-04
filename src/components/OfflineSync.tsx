"use client"

import { useEffect } from "react"
import { storeSongs, type OfflineSong } from "@/lib/offline-db"

/**
 * Invisible component — mounts in the layout and keeps IndexedDB in sync.
 *
 * Strategy:
 * - On every app open when online: fetch /api/songs/all and overwrite
 *   IndexedDB. Since the endpoint is cached on Vercel Data Cache (tag
 *   "songs"), this is near-instant and only hits the DB after a song change.
 * - When coming back online during a session: sync again so any songs added
 *   while offline on another device are downloaded immediately.
 */
async function syncSongs() {
  try {
    const res = await fetch("/api/songs/all", { cache: "no-store" })
    if (!res.ok) return
    const songs: OfflineSong[] = await res.json()
    await storeSongs(songs)
  } catch {
    // Silently ignore — we're probably offline or the request timed out
  }
}

export function OfflineSync() {
  useEffect(() => {
    if (navigator.onLine) syncSongs()

    window.addEventListener("online", syncSongs)
    return () => window.removeEventListener("online", syncSongs)
  }, [])

  return null
}
