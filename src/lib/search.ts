/**
 * Normalize text for forgiving search: lowercase, strip diacritics
 * (ă→a, â→a, î→i, ș→s, ț→t, incl. cedilla variants), turn punctuation into
 * spaces, collapse whitespace. So "Fântâna", "fantana" and "fant, ana" all
 * normalize to the same thing.
 */
export function normalizeSearch(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // delete combining diacritics
    .replace(/[^a-z0-9\s]/g, " ") // punctuation → space
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * True if every word of `query` appears in the combined `fields`, after
 * normalization. Empty query matches everything.
 */
export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = normalizeSearch(query)
  if (!q) return true
  const text = fields.map((f) => normalizeSearch(f)).join(" ")
  return q.split(" ").every((word) => text.includes(word))
}
