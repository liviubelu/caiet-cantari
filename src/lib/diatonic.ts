// Diatonic chords for each key (I–VII in major; natural minor for minor keys).
// Includes all 12 major keys and the most-used minor keys.
export const DIATONIC: Record<string, string[]> = {
  // ── Major keys ──────────────────────────────────────────────────────────
  C:    ["C",   "Dm",    "Em",   "F",   "G",   "Am",   "Bdim" ],
  G:    ["G",   "Am",    "Bm",   "C",   "D",   "Em",   "F#dim"],
  D:    ["D",   "Em",    "F#m",  "G",   "A",   "Bm",   "C#dim"],
  A:    ["A",   "Bm",    "C#m",  "D",   "E",   "F#m",  "G#dim"],
  E:    ["E",   "F#m",   "G#m",  "A",   "B",   "C#m",  "D#dim"],
  B:    ["B",   "C#m",   "D#m",  "E",   "F#",  "G#m",  "A#dim"],
  "F#": ["F#",  "G#m",   "A#m",  "B",   "C#",  "D#m",  "Fdim" ],
  "C#": ["C#",  "D#m",   "Fm",   "F#",  "G#",  "A#m",  "Cdim" ],
  F:    ["F",   "Gm",    "Am",   "Bb",  "C",   "Dm",   "Edim" ],
  Bb:   ["Bb",  "Cm",    "Dm",   "Eb",  "F",   "Gm",   "Adim" ],
  Eb:   ["Eb",  "Fm",    "Gm",   "Ab",  "Bb",  "Cm",   "Ddim" ],
  Ab:   ["Ab",  "Bbm",   "Cm",   "Db",  "Eb",  "Fm",   "Gdim" ],
  Db:   ["Db",  "Ebm",   "Fm",   "Gb",  "Ab",  "Bbm",  "Cdim" ],
  // ── Minor keys ──────────────────────────────────────────────────────────
  Am:   ["Am",  "Bdim",  "C",    "Dm",  "Em",  "F",    "G"    ],
  Em:   ["Em",  "F#dim", "G",    "Am",  "Bm",  "C",    "D"    ],
  Bm:   ["Bm",  "C#dim", "D",    "Em",  "F#m", "G",    "A"    ],
  "F#m":["F#m", "G#dim", "A",    "Bm",  "C#m", "D",    "E"    ],
  "C#m":["C#m", "D#dim", "E",    "F#m", "G#m", "A",    "B"    ],
  "G#m":["G#m", "A#dim", "B",    "C#m", "D#m", "E",    "F#"   ],
  Dm:   ["Dm",  "Edim",  "F",    "Gm",  "Am",  "Bb",   "C"    ],
  Gm:   ["Gm",  "Adim",  "Bb",   "Cm",  "Dm",  "Eb",   "F"    ],
  Cm:   ["Cm",  "Ddim",  "Eb",   "Fm",  "Gm",  "Ab",   "Bb"   ],
  Fm:   ["Fm",  "Gdim",  "Ab",   "Bbm", "Cm",  "Db",   "Eb"   ],
  Bbm:  ["Bbm", "Cdim",  "Db",   "Ebm", "Fm",  "Gb",   "Ab"   ],
}

// Enharmonic aliases: sharps that are notated differently in DIATONIC.
// D# = Eb, G# = Ab, A# = Bb (for major); Gb = F# (major).
const ALIASES: Record<string, string> = {
  "D#": "Eb", "G#": "Ab", "A#": "Bb", "Gb": "F#",
  "A#m": "Bbm",
}

/**
 * Returns the diatonic chord set for a given key, handling enharmonic
 * equivalents so that e.g. "D#" correctly resolves to Eb's chords.
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
