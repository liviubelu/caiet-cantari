/**
 * parse-songs.mjs
 * Extracts all songs from "cantari pe note 1-380.pdf"
 * Strips chord lines, formats as ChordPro (lyrics only), saves songs.json
 *
 * Usage: node scripts/parse-songs.mjs
 */

import { createRequire } from "module"
import { writeFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"

const require = createRequire(import.meta.url)
const pdf = require("pdf-parse")
const fs = require("fs")

// ─── Romanian solfège → standard key ─────────────────────────────────────────
const SOLFEGE = { DO: "C", RE: "D", MI: "E", FA: "F", SOL: "G", LA: "A", SI: "B" }
const SEMITONE_LABELS = {
  "DO DIEZ": "C#", "RE BEMOL": "Db", "RE DIEZ": "D#", "MI BEMOL": "Eb",
  "FA DIEZ": "F#", "SOL BEMOL": "Gb", "SOL DIEZ": "G#", "LA BEMOL": "Ab",
  "LA DIEZ": "A#", "SI BEMOL": "Bb",
}

function convertKey(raw) {
  const s = raw.trim().toUpperCase()
  // Check full key with accidental first
  for (const [ro, std] of Object.entries(SEMITONE_LABELS)) {
    if (s.startsWith(ro)) {
      const isMinor = /MINOR|MINOR/.test(s) || raw.trim()[0] === raw.trim()[0].toLowerCase()
      return std + (isMinor ? "m" : "")
    }
  }
  // Simple key
  for (const [ro, std] of Object.entries(SOLFEGE)) {
    if (s.startsWith(ro)) {
      const isMinor = s.includes("MINOR") || s.includes("MINOR") ||
        raw.trim()[0] === raw.trim()[0].toLowerCase()
      return std + (isMinor ? "m" : "")
    }
  }
  return ""
}

// ─── Detect if a line is a chord line ────────────────────────────────────────
// Chord lines: no Romanian diacritics, tokens all look like chord symbols
const DIACRITICS = /[ăâîșțĂÂÎȘȚşţŞŢ]/
const CHORD_TOKEN = /^[A-Ga-g][b#]?(\d|m|maj|min|dim|aug|sus|add|M|7|9|11|13)*([/\\][A-Ga-g][b#]?)?$/

function isChordLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (DIACRITICS.test(trimmed)) return false

  // Remove repeat signs and separators
  const cleaned = trimmed.replace(/\|:/g, "").replace(/:\|/g, "").replace(/[|:()]/g, "").trim()
  if (!cleaned) return true // was all repeat signs

  // Split by spaces and dashes between chords
  const tokens = cleaned.split(/[\s\-]+/).filter(Boolean)
  if (tokens.length === 0) return false

  // Every token must look like a chord or be a number/empty
  return tokens.every(t => CHORD_TOKEN.test(t) || /^\d+$/.test(t) || t === "")
}

// ─── Detect key line ─────────────────────────────────────────────────────────
// Must be ONLY a key name, nothing else on the line
const KEY_PATTERN = /^(do|re|mi|fa|sol|la|si|DO|RE|MI|FA|SOL|LA|SI)(\s+(MAJOR|MINOR|major|minor|BEMOL|DIEZ|bemol|diez))*\s*$/i

function isKeyLine(line) {
  return KEY_PATTERN.test(line.trim())
}

// ─── Detect song start line ───────────────────────────────────────────────────
// e.g. "7.Aşa mult Tatăl ne-a iubit" or "12.Măreţ eşti Dumnezeu!"
const SONG_START = /^(\d+)\.\s*(.+)/

// ─── Clean a lyric line ───────────────────────────────────────────────────────
function cleanLyric(line) {
  return line
    .replace(/\|:/g, "")     // remove repeat start
    .replace(/:\|/g, "")     // remove repeat end
    .replace(/^\s*\d+\.\s*/, "") // remove verse number prefix (1. 2. 3.)
    .trim()
}

// ─── Main parser ─────────────────────────────────────────────────────────────
async function main() {
  const pdfPath = "C:/Users/liviu/Downloads/cantari pe note 1-380.pdf"
  const buf = fs.readFileSync(pdfPath)
  const data = await pdf(buf)
  const lines = data.text.split("\n")

  console.log(`Total pages: ${data.numpages}, Total lines: ${lines.length}`)

  // Inline key: title ends with "- SOL MAJOR" or "–MI MINOR" etc.
  const INLINE_KEY = /[\-–]\s*((do|re|mi|fa|sol|la|si|DO|RE|MI|FA|SOL|LA|SI)(\s+(MAJOR|MINOR|major|minor|BEMOL|DIEZ|bemol|diez))*)\s*$/i

  // Find all song start positions
  const songStarts = []

  for (let i = 0; i < lines.length - 2; i++) {
    const raw = lines[i].trim()
    const m = raw.match(SONG_START)
    if (!m) continue

    // Case 1: key is embedded in the title line (e.g. "71.Titlu-SOL MAJOR")
    const inlineKey = raw.match(INLINE_KEY)
    if (inlineKey) {
      const cleanTitle = m[2].replace(INLINE_KEY, "").trim()
      songStarts.push({
        lineIdx: i,
        keyLineIdx: i,
        number: parseInt(m[1]),
        title: cleanTitle,
        rawKey: inlineKey[1],
      })
      continue
    }

    // Case 2: key is on the very next non-empty line
    let keyLine = ""
    let keyLineIdx = -1
    for (let j = i + 1; j <= i + 2 && j < lines.length; j++) {
      const candidate = lines[j].trim()
      if (!candidate) continue
      if (isKeyLine(candidate)) {
        keyLine = candidate
        keyLineIdx = j
      }
      break
    }
    if (!keyLine) continue

    songStarts.push({
      lineIdx: i,
      keyLineIdx,
      number: parseInt(m[1]),
      title: m[2].trim(),
      rawKey: keyLine,
    })
  }

  console.log(`Found ${songStarts.length} songs`)

  // Extract each song's content
  const songs = []
  for (let s = 0; s < songStarts.length; s++) {
    const start = songStarts[s]
    const end = s + 1 < songStarts.length ? songStarts[s + 1].lineIdx : lines.length

    const contentLines = lines.slice(start.keyLineIdx + 1, end)

    // Build verse sections
    // A new verse starts when we see a line beginning with digit+dot at line start
    // OR after a blank line following content
    const versePattern = /^\s*\d+[.\)]\s*.+/

    const sections = [] // array of { type, lines[] }
    let current = []
    let inSection = false

    for (const line of contentLines) {
      const trimmed = line.trim()

      // Skip chord lines and key lines
      if (isChordLine(line) || isKeyLine(trimmed)) continue

      // Detect verse start
      if (versePattern.test(trimmed)) {
        if (current.length > 0) sections.push({ type: "verse", lines: current })
        const lyric = cleanLyric(trimmed)
        current = lyric ? [lyric] : []
        inSection = true
        continue
      }

      if (!trimmed) {
        // Blank line: flush current section if it has content
        if (current.length > 0) {
          sections.push({ type: "verse", lines: current })
          current = []
          inSection = false
        }
        continue
      }

      const lyric = cleanLyric(trimmed)
      if (lyric) current.push(lyric)
    }

    if (current.length > 0) sections.push({ type: "verse", lines: current })

    // Build ChordPro content
    const cpLines = []
    for (const sec of sections) {
      if (sec.lines.length === 0) continue
      if (cpLines.length > 0) cpLines.push("")
      cpLines.push(`{verse}`)
      sec.lines.forEach(l => cpLines.push(l))
    }

    songs.push({
      number: start.number,
      title: start.title,
      defaultKey: convertKey(start.rawKey),
      content: cpLines.join("\n"),
    })
  }

  // Save JSON
  writeFileSync("scripts/songs.json", JSON.stringify(songs, null, 2), "utf8")
  console.log(`\nSaved ${songs.length} songs to scripts/songs.json`)

  // Print first 3 as preview
  songs.slice(0, 3).forEach(s => {
    console.log(`\n=== ${s.number}. ${s.title} [${s.defaultKey}] ===`)
    console.log(s.content.slice(0, 300))
    console.log("---")
  })
}

main().catch(console.error)
