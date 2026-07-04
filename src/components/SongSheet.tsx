import { parseChordPro, type ParsedLine } from "@/lib/chordpro"

/**
 * Light-only (always black-on-white) song rendering with chords above lyrics —
 * used by the in-app sheet viewer. One column on phones, two on wider screens.
 * Uses no `dark:` variants on purpose, so it stays readable regardless of the
 * app theme.
 */
function Line({ line, fs }: { line: ParsedLine; fs: number }) {
  if (line.isComment) {
    if (line.sectionType) {
      return (
        <p className="font-bold uppercase tracking-widest text-gray-500 mt-4 mb-1 first:mt-0" style={{ fontSize: fs * 0.8 }}>
          {line.commentText}
        </p>
      )
    }
    return line.commentText ? (
      <p className="text-gray-500 my-1" style={{ fontSize: fs * 0.8 }}>{line.commentText}</p>
    ) : null
  }

  const empty = line.segments.every((s) => !s.chord && !(s.text || "").trim())
  if (empty) return <div style={{ height: fs * 0.5 }} />

  const italic = line.sectionType === "chorus"

  if (!line.hasChords) {
    return (
      <div className={`text-gray-900 ${italic ? "italic" : ""}`} style={{ fontSize: fs, lineHeight: 1.5 }}>
        {line.segments.map((s) => s.text).join("") || " "}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-end" style={{ lineHeight: 1, marginBottom: 3 }}>
      {line.segments.map((seg, j) => (
        <span key={j} className="inline-flex flex-col items-start">
          <span className="font-bold text-blue-600" style={{ fontSize: fs * 0.82, lineHeight: 1, marginBottom: 1, paddingRight: 6, whiteSpace: "pre" }}>
            {seg.chord ?? " "}
          </span>
          <span className={`text-gray-900 ${italic ? "italic" : ""}`} style={{ whiteSpace: "pre", lineHeight: 1.5, fontSize: fs }}>
            {seg.text || (seg.chord ? "​" : "")}
          </span>
        </span>
      ))}
    </div>
  )
}

export function SongSheet({ content, fontSize = 15 }: { content: string; fontSize?: number }) {
  const lines = parseChordPro(content)

  // Group each section (header + its lines) so a column break never orphans it.
  const groups: ParsedLine[][] = []
  let cur: ParsedLine[] = []
  for (const l of lines) {
    if (l.isComment && l.sectionType && cur.length) { groups.push(cur); cur = [] }
    cur.push(l)
  }
  if (cur.length) groups.push(cur)

  return (
    <div className="columns-1 sm:columns-2 gap-10 font-mono">
      {groups.map((g, i) => (
        <div key={i} className="break-inside-avoid mb-1">
          {g.map((l, j) => (
            <Line key={j} line={l} fs={fontSize} />
          ))}
        </div>
      ))}
    </div>
  )
}
