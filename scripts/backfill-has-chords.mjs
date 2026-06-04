/**
 * One-time backfill: sets has_chords = true for every song whose content
 * contains at least one ChordPro chord marker ("["), false otherwise.
 *
 * Run after the schema migration (npm run db:push):
 *   node scripts/backfill-has-chords.mjs
 */

import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"

// Read DATABASE_URL from .env.local
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
const dbUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const sql = neon(dbUrl)

console.log("Backfilling has_chords column…")

const result = await sql`
  UPDATE songs
  SET    has_chords = (content LIKE '%[%')
`

console.log(`Done. ${result.count ?? "All"} rows updated.`)
