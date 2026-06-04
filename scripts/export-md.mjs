/**
 * export-md.mjs
 * Generates one .md file per song from scripts/songs.json
 * Output folder: scripts/songs-md/
 *
 * Usage: node scripts/export-md.mjs
 */

import { createRequire } from "module"
import { mkdirSync, writeFileSync, readFileSync } from "fs"
import { join } from "path"

const require = createRequire(import.meta.url)

// ─── Slug from title ──────────────────────────────────────────────────────────
function slug(title) {
  return title
    .toLowerCase()
    .replace(/[ăâ]/g, "a")
    .replace(/[î]/g, "i")
    .replace(/[șş]/g, "s")
    .replace(/[țţ]/g, "t")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
}

// ─── Deduplicate ──────────────────────────────────────────────────────────────
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

// ─── Build .md content ────────────────────────────────────────────────────────
function buildMd(song) {
  const lines = [
    `{title: ${song.title}}`,
    song.defaultKey ? `{key: ${song.defaultKey}}` : `{key: }`,
    ``,
    song.content,
  ]
  return lines.join("\n")
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const rawSongs = JSON.parse(readFileSync("scripts/songs.json", "utf8"))
const songs = deduplicate(rawSongs)

const outDir = "scripts/songs-md"
mkdirSync(outDir, { recursive: true })

for (const song of songs) {
  const num = String(song.number).padStart(3, "0")
  const filename = `${num}-${slug(song.title)}.md`
  const filepath = join(outDir, filename)
  writeFileSync(filepath, buildMd(song), "utf8")
}

console.log(`✓ Generated ${songs.length} files in ${outDir}/`)
console.log(`  First: 001-${slug(songs[0].title)}.md`)
console.log(`  Last:  ${String(songs[songs.length-1].number).padStart(3,"0")}-${slug(songs[songs.length-1].title)}.md`)
