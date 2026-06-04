// Diatonic chords (I–VII natural minor / major) for all 12 keys.
// All keys use sharps notation consistently (no flats in key names).
export const DIATONIC: Record<string, string[]> = {
  // ── Major keys ──────────────────────────────────────────────────────────
  C:    ["C",   "Dm",    "Em",   "F",   "G",   "Am",   "Bdim" ],
  "C#": ["C#",  "D#m",   "Fm",   "F#",  "G#",  "A#m",  "Cdim" ],
  D:    ["D",   "Em",    "F#m",  "G",   "A",   "Bm",   "C#dim"],
  "D#": ["D#",  "Fm",    "Gm",   "G#",  "A#",  "Cm",   "Ddim" ],
  E:    ["E",   "F#m",   "G#m",  "A",   "B",   "C#m",  "D#dim"],
  F:    ["F",   "Gm",    "Am",   "A#",  "C",   "Dm",   "Edim" ],
  "F#": ["F#",  "G#m",   "A#m",  "B",   "C#",  "D#m",  "Fdim" ],
  G:    ["G",   "Am",    "Bm",   "C",   "D",   "Em",   "F#dim"],
  "G#": ["G#",  "A#m",   "Cm",   "C#",  "D#",  "Fm",   "Gdim" ],
  A:    ["A",   "Bm",    "C#m",  "D",   "E",   "F#m",  "G#dim"],
  "A#": ["A#",  "Cm",    "Dm",   "D#",  "F",   "Gm",   "Adim" ],
  B:    ["B",   "C#m",   "D#m",  "E",   "F#",  "G#m",  "A#dim"],
  // ── Minor keys (all 12, sharps notation) ────────────────────────────────
  Cm:   ["Cm",  "Ddim",  "D#",   "Fm",  "Gm",  "G#",   "A#"   ],
  "C#m":["C#m", "D#dim", "E",    "F#m", "G#m", "A",    "B"    ],
  Dm:   ["Dm",  "Edim",  "F",    "Gm",  "Am",  "A#",   "C"    ],
  "D#m":["D#m", "Fdim",  "F#",   "G#m", "A#m", "B",    "C#"   ],
  Em:   ["Em",  "F#dim", "G",    "Am",  "Bm",  "C",    "D"    ],
  Fm:   ["Fm",  "Gdim",  "G#",   "A#m", "Cm",  "C#",   "D#"   ],
  "F#m":["F#m", "G#dim", "A",    "Bm",  "C#m", "D",    "E"    ],
  Gm:   ["Gm",  "Adim",  "A#",   "Cm",  "Dm",  "D#",   "F"    ],
  "G#m":["G#m", "A#dim", "B",    "C#m", "D#m", "E",    "F#"   ],
  Am:   ["Am",  "Bdim",  "C",    "Dm",  "Em",  "F",    "G"    ],
  "A#m":["A#m", "Cdim",  "C#",   "D#m", "Fm",  "F#",   "G#"   ],
  Bm:   ["Bm",  "C#dim", "D",    "Em",  "F#m", "G",    "A"    ],
}

// Flat-to-sharp aliases so that songs stored with flat key names still
// resolve to correct diatonic chords.
const ALIASES: Record<string, string> = {
  // Major flats → sharp equivalents
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#",
  // Minor flats → sharp equivalents
  Bbm: "A#m", Ebm: "D#m", Abm: "G#m", Dbm: "C#m", Gbm: "F#m",
}

/**
 * Returns the diatonic chord set for a given key.
 * Resolves flat spellings (Bb, Eb, Ab…) to their sharp equivalents.
 */
export function getDiatonicChords(key: string): string[] {
  return DIATONIC[key] ?? DIATONIC[ALIASES[key] ?? ""] ?? []
}

export const SECTIONS = [
  { label: "Strofa",    tag: "verse"     },
  { label: "Refren",    tag: "chorus"    },
  { label: "Prerefren", tag: "prechorus" },
  { label: "Coda",      tag: "coda"      },
]
