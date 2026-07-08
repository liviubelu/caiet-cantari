const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

function noteIndex(note: string): number {
  const i = SHARPS.indexOf(note)
  return i >= 0 ? i : FLATS.indexOf(note)
}

function transposeNote(note: string, semitones: number): string {
  const idx = noteIndex(note)
  if (idx < 0) return note
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  return semitones > 0 ? SHARPS[newIdx] : FLATS[newIdx]
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord
  const match = chord.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return chord
  const [, root, modifier] = match
  if (noteIndex(root) < 0) return chord
  // Transpose the slash-bass note too (D/F# +2 → E/G#, not E/F#).
  const newModifier = modifier.replace(/\/([A-G][b#]?)$/, (_, bass) => "/" + transposeNote(bass, semitones))
  return transposeNote(root, semitones) + newModifier
}

// A token inside [ ] is only transposed if it actually looks like a chord.
// This prevents bracketed annotations such as [Bridge] (root "B" + "ridge")
// from being mangled into [C#ridge] when transposing.
const CHORD_RE = /^[A-G][b#]?(maj|min|m|dim|aug|sus|add|M)?\d*(\([^)]*\))?(sus|add|maj|dim|aug)?\d*([b#]\d+)*(\/[A-G][b#]?)?$/

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content
  return content.replace(/\[([^\]]+)\]/g, (whole, c) =>
    CHORD_RE.test(c) ? `[${transposeChord(c, semitones)}]` : whole
  )
}

export function getTransposedKey(defaultKey: string | null | undefined, semitones: number): string {
  if (!defaultKey) return ""
  return transposeChord(defaultKey, semitones)
}

export function semitonesBetween(fromKey: string, toKey: string): number {
  const rootFrom = fromKey.match(/^[A-G][b#]?/)?.[0] ?? fromKey
  const rootTo = toKey.match(/^[A-G][b#]?/)?.[0] ?? toKey
  const fromIdx = noteIndex(rootFrom)
  const toIdx = noteIndex(rootTo)
  if (fromIdx < 0 || toIdx < 0) return 0
  const diff = ((toIdx - fromIdx) + 12) % 12
  return diff > 6 ? diff - 12 : diff
}

export const NOTES = SHARPS
