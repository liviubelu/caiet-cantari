export const DIATONIC: Record<string, string[]> = {
  C:   ["C",   "Dm",   "Em",   "F",   "G",   "Am",   "Bdim"],
  G:   ["G",   "Am",   "Bm",   "C",   "D",   "Em",   "F#dim"],
  D:   ["D",   "Em",   "F#m",  "G",   "A",   "Bm",   "C#dim"],
  A:   ["A",   "Bm",   "C#m",  "D",   "E",   "F#m",  "G#dim"],
  E:   ["E",   "F#m",  "G#m",  "A",   "B",   "C#m",  "D#dim"],
  B:   ["B",   "C#m",  "D#m",  "E",   "F#",  "G#m",  "A#dim"],
  F:   ["F",   "Gm",   "Am",   "Bb",  "C",   "Dm",   "Edim"],
  Bb:  ["Bb",  "Cm",   "Dm",   "Eb",  "F",   "Gm",   "Adim"],
  Eb:  ["Eb",  "Fm",   "Gm",   "Ab",  "Bb",  "Cm",   "Ddim"],
  Ab:  ["Ab",  "Bbm",  "Cm",   "Db",  "Eb",  "Fm",   "Gdim"],
  // Minor
  Am:  ["Am",  "Bdim", "C",    "Dm",  "Em",  "F",    "G"],
  Em:  ["Em",  "F#dim","G",    "Am",  "Bm",  "C",    "D"],
  Bm:  ["Bm",  "C#dim","D",    "Em",  "F#m", "G",    "A"],
  Dm:  ["Dm",  "Edim", "F",    "Gm",  "Am",  "Bb",   "C"],
  Gm:  ["Gm",  "Adim", "Bb",   "Cm",  "Dm",  "Eb",   "F"],
  Cm:  ["Cm",  "Ddim", "Eb",   "Fm",  "Gm",  "Ab",   "Bb"],
  "F#m": ["F#m","G#dim","A",   "Bm",  "C#m", "D",    "E"],
  "C#m": ["C#m","D#dim","E",   "F#m", "G#m", "A",    "B"],
}

export const SECTIONS = [
  { label: "Strofa",    tag: "verse"    },
  { label: "Refren",    tag: "chorus"   },
  { label: "Prerefren", tag: "prechorus"},
  { label: "Coda",      tag: "coda"     },
]
