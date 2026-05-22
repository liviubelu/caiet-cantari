const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLATS = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

function noteIndex(note: string): number {
  const i = SHARPS.indexOf(note)
  return i >= 0 ? i : FLATS.indexOf(note)
}

export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord
  const match = chord.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return chord
  const [, root, modifier] = match
  const idx = noteIndex(root)
  if (idx < 0) return chord
  const newIdx = ((idx + semitones) % 12 + 12) % 12
  const newRoot = semitones > 0 ? SHARPS[newIdx] : FLATS[newIdx]
  return newRoot + modifier
}

export function transposeContent(content: string, semitones: number): string {
  if (semitones === 0) return content
  return content.replace(/\[([^\]]+)\]/g, (_, c) => `[${transposeChord(c, semitones)}]`)
}

export function getTransposedKey(defaultKey: string | null | undefined, semitones: number): string {
  if (!defaultKey) return ""
  return transposeChord(defaultKey, semitones)
}

export const NOTES = SHARPS
