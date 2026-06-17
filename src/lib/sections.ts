// ── Song sections & custom singing order ────────────────────────────────────
// A song's ChordPro content is split into sections by markers like {verse},
// {chorus}, {coda}. Each section gets a stable id (e.g. "verse-1"), a Romanian
// label ("Strofa 1"), an abbreviation ("S1") and a color. The custom "singing
// order" is just an array of those ids (repeats allowed), stored per song.

export interface SongSection {
  id: string        // stable within this content, e.g. "verse-1" / "chorus-1"
  type: string      // verse | chorus | prechorus | bridge | intro | coda | other
  label: string     // "Strofa 1", "Refren", …
  abbr: string       // "S1", "Ref", …
  color: string      // hex — rendered as a translucent tint in both themes
  italic: boolean    // chorus is shown italic (Romanian hymnal convention)
  lines: string[]    // the section's raw lyric lines (chords included, no marker)
}

const SECTION_META: Record<string, { label: string; abbr: string; color: string; italic?: boolean }> = {
  verse:     { label: "Strofa",    abbr: "S",     color: "#6366f1" },
  chorus:    { label: "Refren",    abbr: "Ref",   color: "#3b82f6", italic: true },
  prechorus: { label: "Prerefren", abbr: "Pre",   color: "#8b5cf6" },
  bridge:    { label: "Punte",     abbr: "Pu",    color: "#ec4899" },
  intro:     { label: "Intro",     abbr: "Intro", color: "#64748b" },
  coda:      { label: "Coda",      abbr: "Coda",  color: "#f59e0b" },
}

// Map a marker word (lowercased) to a known section type.
const TYPE_ALIASES: Record<string, string> = {
  verse: "verse", strofa: "verse", strofă: "verse",
  chorus: "chorus", refren: "chorus",
  prechorus: "prechorus", "pre-chorus": "prechorus", prerefren: "prechorus",
  bridge: "bridge", punte: "bridge",
  intro: "intro",
  coda: "coda", outro: "coda", final: "coda",
}

/** Inner text of a bare `{marker}` line (no value), or null if it's not one. */
function markerInner(line: string): string | null {
  const t = line.trim()
  if (t.length < 3 || !t.startsWith("{") || !t.endsWith("}")) return null
  const inner = t.slice(1, -1)
  if (inner.includes(":")) return null // {title: …} / {key: …} are directives, not sections
  return inner.trim()
}

export interface Marker { type: string; inner: string }

/** Returns the section type + raw inner for a marker line, or null. */
export function sectionTypeFromMarker(line: string): Marker | null {
  const inner = markerInner(line)
  if (inner === null) return null
  return { type: TYPE_ALIASES[inner.toLowerCase()] ?? "other", inner }
}

/** Counting key — known types count by type; unknown ("other") by their word. */
export function countKey(m: Marker): string {
  return m.type === "other" ? `other:${m.inner.toLowerCase()}` : m.type
}

/** Display label/abbr/color for the nth occurrence of a section type. */
export function sectionDisplay(type: string, inner: string, nth: number, total: number) {
  // verses are always numbered; other types only when there's more than one.
  const numbered = type === "verse" || total > 1
  const meta = SECTION_META[type]
  if (meta) {
    return {
      label: numbered ? `${meta.label} ${nth}` : meta.label,
      abbr:  numbered ? `${meta.abbr}${nth}` : meta.abbr,
      color: meta.color,
      italic: !!meta.italic,
    }
  }
  const base = inner ? inner.charAt(0).toUpperCase() + inner.slice(1) : "Secțiune"
  return {
    label: numbered ? `${base} ${nth}` : base,
    abbr:  numbered ? `${base.slice(0, 4)}${nth}` : base.slice(0, 5),
    color: "#6b7280",
    italic: false,
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x"
}

/** Parse ChordPro content into ordered, labelled sections. */
export function parseSections(content: string): SongSection[] {
  const raw = content.split("\n")
  const groups: Array<{ m: Marker; lines: string[] }> = []
  let cur: { m: Marker; lines: string[] } | null = null
  for (const line of raw) {
    const m = sectionTypeFromMarker(line)
    if (m) { cur = { m, lines: [] }; groups.push(cur) }
    else if (cur) cur.lines.push(line)
    // lines before the first marker belong to no section (still rendered elsewhere)
  }
  // trim surrounding blank lines per section
  for (const g of groups) {
    while (g.lines.length && g.lines[g.lines.length - 1].trim() === "") g.lines.pop()
    while (g.lines.length && g.lines[0].trim() === "") g.lines.shift()
  }
  const totals: Record<string, number> = {}
  for (const g of groups) { const k = countKey(g.m); totals[k] = (totals[k] ?? 0) + 1 }
  const seen: Record<string, number> = {}
  return groups.map((g) => {
    const k = countKey(g.m)
    seen[k] = (seen[k] ?? 0) + 1
    const d = sectionDisplay(g.m.type, g.m.inner, seen[k], totals[k])
    const id = g.m.type === "other"
      ? `other-${slugify(g.m.inner)}-${seen[k]}`
      : `${g.m.type}-${seen[k]}`
    return { id, type: g.m.type, label: d.label, abbr: d.abbr, color: d.color, italic: d.italic, lines: g.lines }
  })
}

/** Parse the stored singing order (JSON array of section ids). */
export function parseOrder(singingOrder: string | null | undefined): string[] {
  if (!singingOrder) return []
  try {
    const arr = JSON.parse(singingOrder)
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []
  } catch {
    return []
  }
}

/** Resolve an order (ids) against the current sections, dropping missing ids. */
export function resolveOrder(order: string[], sections: SongSection[]): SongSection[] {
  const byId = new Map(sections.map((s) => [s.id, s]))
  return order.map((id) => byId.get(id)).filter((s): s is SongSection => !!s)
}

/** Remove chord markers like [C] / [G/B] from a line. */
export function stripChords(line: string): string {
  return line.replace(/\[[^\]]*\]/g, "")
}

export interface PresentationSlide { label: string; color: string; lines: string[]; repeat: number }

/**
 * Build the projector slides, lyrics only (chords stripped, blank lines removed).
 * Consecutive repeats of the same section are merged into ONE slide with a
 * `repeat` count (rendered as /: … :/ ×N), instead of identical back-to-back slides.
 */
export function getPresentationSlides(content: string, order: string[]): PresentationSlide[] {
  const sections = parseSections(content)
  const byId = new Map(sections.map((s) => [s.id, s]))
  const ids = order.filter((id) => byId.has(id))
  const slides: PresentationSlide[] = []
  for (let i = 0; i < ids.length; ) {
    const id = ids[i]
    let count = 1
    while (i + count < ids.length && ids[i + count] === id) count++
    const s = byId.get(id)!
    slides.push({
      label: s.label,
      color: s.color,
      lines: s.lines.map((l) => stripChords(l).trim()).filter((l) => l !== ""),
      repeat: count,
    })
    i += count
  }
  return slides
}
