/**
 * import-md.mjs
 * Reads all .md files from scripts/songs-md/ and bulk-inserts into the DB.
 *
 * Usage: node scripts/import-md.mjs [--dry-run]
 */

import { createRequire } from "module"
import { readdirSync, readFileSync } from "fs"
import { join } from "path"

const require = createRequire(import.meta.url)

// Load .env.local
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

// ─── Parse one .md file ───────────────────────────────────────────────────────
function parseMd(raw) {
  const lines = raw.split("\n")
  let title = ""
  let defaultKey = ""
  const contentLines = []

  for (const line of lines) {
    const titleMatch = line.match(/^\{title:\s*(.+?)\}/)
    const keyMatch = line.match(/^\{key:\s*(.*?)\}/)
    if (titleMatch) { title = titleMatch[1].trim(); continue }
    if (keyMatch) { defaultKey = keyMatch[1].trim(); continue }
    contentLines.push(line)
  }

  // Trim leading/trailing blank lines from content
  const content = contentLines.join("\n").trim()

  // Extract first lyric line (first non-empty, non-marker line)
  let firstLine = ""
  for (const l of contentLines) {
    const t = l.trim()
    if (!t || t.startsWith("{")) continue
    firstLine = t.replace(/\[[^\]]+\]/g, "").trim()
    break
  }

  return { title, defaultKey: defaultKey || null, content, firstLine: firstLine || null }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const dir = "scripts/songs-md"
  const files = readdirSync(dir).filter(f => f.endsWith(".md")).sort()
  console.log(`Found ${files.length} .md files`)

  const songs = files.map(f => parseMd(readFileSync(join(dir, f), "utf8")))

  if (isDryRun) {
    console.log("\n--- DRY RUN: first 3 ---")
    songs.slice(0, 3).forEach(s => {
      console.log(`"${s.title}" [${s.defaultKey}]`)
      console.log("  firstLine:", s.firstLine)
      console.log("  content lines:", s.content.split("\n").length)
    })
    return
  }

  const { neon } = await import("@neondatabase/serverless")
  const { drizzle } = await import("drizzle-orm/neon-http")
  const { pgTable, text, timestamp, uuid } = await import("drizzle-orm/pg-core")

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

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)

  const BATCH = 50
  let inserted = 0

  for (let i = 0; i < songs.length; i += BATCH) {
    const batch = songs.slice(i, i + BATCH).map(s => ({
      title: s.title,
      firstLine: s.firstLine,
      content: s.content,
      category: null,
      defaultKey: s.defaultKey,
      createdBy: null,
    }))
    await db.insert(songsTable).values(batch)
    inserted += batch.length
    process.stdout.write(`\rInserted ${inserted}/${songs.length}...`)
  }

  console.log(`\n✓ Done! ${inserted} songs imported.`)
}

main().catch(e => { console.error(e); process.exit(1) })
