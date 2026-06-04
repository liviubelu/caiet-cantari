/**
 * import-songs.mjs
 * Bulk imports songs from scripts/songs.json into the PostgreSQL database.
 *
 * Usage: node scripts/import-songs.mjs [--dry-run]
 */

import { createRequire } from "module"
import { readFileSync } from "fs"

const require = createRequire(import.meta.url)

// Load .env.local manually
function loadEnv() {
  const lines = readFileSync(".env.local", "utf8").split("\n")
  for (const line of lines) {
    const eq = line.indexOf("=")
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (key && !process.env[key]) process.env[key] = val
  }
}
loadEnv()

const isDryRun = process.argv.includes("--dry-run")

// ─── Extract first lyric line from ChordPro content ──────────────────────────
function extractFirstLine(content) {
  const lines = content.split("\n")
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith("{")) continue
    // Remove chord markers [X]
    return t.replace(/\[[^\]]+\]/g, "").trim()
  }
  return ""
}

// ─── Deduplicate: keep the one with more content ──────────────────────────────
function deduplicate(songs) {
  const map = new Map()
  for (const song of songs) {
    const existing = map.get(song.number)
    if (!existing || song.content.length > existing.content.length) {
      map.set(song.number, song)
    }
  }
  return [...map.values()].sort((a, b) => a.number - b.number)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const rawSongs = JSON.parse(readFileSync("scripts/songs.json", "utf8"))
  const songs = deduplicate(rawSongs)
  console.log(`Loaded ${rawSongs.length} songs → ${songs.length} after deduplication`)

  if (isDryRun) {
    console.log("\n--- DRY RUN: first 5 songs ---")
    songs.slice(0, 5).forEach(s => {
      console.log(`#${s.number} "${s.title}" [${s.defaultKey}]`)
      console.log("  firstLine:", extractFirstLine(s.content))
      console.log("  content lines:", s.content.split("\n").length)
    })
    return
  }

  // Dynamic import of postgres + drizzle (ESM)
  const { default: postgres } = await import("postgres")
  const { drizzle } = await import("drizzle-orm/postgres-js")
  const { pgTable, text, timestamp, uuid } = await import("drizzle-orm/pg-core")

  // Inline song table definition (matches src/lib/schema.ts)
  const songsTable = pgTable("songs", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    firstLine: text("first_line"),
    content: text("content").notNull(),
    category: text("category"),
    defaultKey: text("default_key"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
  })

  const client = postgres(process.env.DATABASE_URL, { max: 1 })
  const db = drizzle(client)

  // Insert in batches of 50
  const BATCH = 50
  let inserted = 0
  let skipped = 0

  for (let i = 0; i < songs.length; i += BATCH) {
    const batch = songs.slice(i, i + BATCH).map(s => ({
      title: s.title,
      firstLine: extractFirstLine(s.content) || null,
      content: s.content,
      category: null,
      defaultKey: s.defaultKey || null,
      createdBy: null,
    }))

    try {
      await db.insert(songsTable).values(batch)
      inserted += batch.length
      process.stdout.write(`\rInserted ${inserted}/${songs.length}...`)
    } catch (err) {
      console.error(`\nBatch ${i}-${i + BATCH} failed:`, err.message)
      skipped += batch.length
    }
  }

  console.log(`\n\nDone! Inserted: ${inserted}, Skipped: ${skipped}`)
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
