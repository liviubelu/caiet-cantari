// Diatonic chords (I–VII) for all 12 major keys and all 12 minor keys.
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
  // ── Minor keys (all 12, natural minor) ──────────────────────────────────
  Am:   ["Am",  "Bdim",  "C",    "Dm",  "Em",  "F",    "G"    ],
  Bbm:  ["Bbm", "Cdim",  "Db",   "Ebm", "Fm",  "Gb",   "Ab"   ],
  Bm:   ["Bm",  "C#dim", "D",    "Em",  "F#m", "G",    "A"    ],
  Cm:   ["Cm",  "Ddim",  "Eb",   "Fm",  "Gm",  "Ab",   "Bb"   ],
  "C#m":["C#m", "D#dim", "E",    "F#m", "G#m", "A",    "B"    ],
  Dm:   ["Dm",  "Edim",  "F",    "Gm",  "Am",  "Bb",   "C"    ],
  Ebm:  ["Ebm", "Fdim",  "Gb",   "Abm", "Bbm", "B",    "Db"   ],
  Em:   ["Em",  "F#dim", "G",    "Am",  "Bm",  "C",    "D"    ],
  Fm:   ["Fm",  "Gdim",  "Ab",   "Bbm", "Cm",  "Db",   "Eb"   ],
  "F#m":["F#m", "G#dim", "A",    "Bm",  "C#m", "D",    "E"    ],
  Gm:   ["Gm",  "Adim",  "Bb",   "Cm",  "Dm",  "Eb",   "F"    ],
  Abm:  ["Abm", "Bbdim", "B",    "C#m", "Ebm", "E",    "F#"   ],
}

// Enharmonic aliases for keys spelled differently from the DIATONIC entries.
const ALIASES: Record<string, string> = {
  // Major
  "D#": "Eb", "G#": "Ab", "A#": "Bb", "Gb": "F#",
  // Minor
  "A#m": "Bbm", "D#m": "Ebm", "G#m": "Abm",
}

/**
 * Returns the diatonic chord set for a given key, resolving enharmonic
 * equivalents so that e.g. "G#" → Ab, "D#m" → Ebm, "A#m" → Bbm.
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
