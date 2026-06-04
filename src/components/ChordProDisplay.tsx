"use client"

import { useMemo } from "react"
import { parseChordPro, type ParsedLine } from "@/lib/chordpro"
import { transposeContent } from "@/lib/transpose"

interface Props {
  content: string
  semitones?: number
  showChords?: boolean
  fontSize?: number
  twoColumns?: boolean
}

/** Split lines near the midpoint, preferring to break before a section header */
function splitAtMidpoint(lines: ParsedLine[]): [ParsedLine[], ParsedLine[]] {
  const mid = Math.ceil(lines.length / 2)

  for (let offset = 0; offset <= 5; offset++) {
    const after = mid + offset
    if (after < lines.length && lines[after].isComment) {
      return [lines.slice(0, after), lines.slice(after)]
    }
    if (offset > 0) {
      const before = mid - offset
      if (before > 0 && lines[before].isComment) {
        return [lines.slice(0, before), lines.slice(before)]
      }
    }
  }

  return [lines.slice(0, mid), lines.slice(mid)]
}

function LineItem({
  line,
  idx,
  showChords,
  fontSize,
}: {
  line: ParsedLine
  idx: number
  showChords: boolean
  fontSize: number
}) {
  if (line.isComment) {
    return (
      <p
        key={idx}
        className="text-[11px] font-sans font-semibold uppercase tracking-widest text-gray-400 mt-5 mb-1 first:mt-0"
      >
        {line.commentText}
      </p>
    )
  }

  const isEmpty = line.segments.every((s) => !s.chord && !s.text.trim())
  if (isEmpty) return <div key={idx} className="h-3" />

  // ── Lyrics-only (no chords visible) ──────────────────────────────────────
  // Standard CSS hanging indent: first line at left edge, continuations +1em.
  if (!line.hasChords || !showChords) {
    return (
      <div key={idx} className="leading-6 text-gray-900 pl-[1em] [text-indent:-1em]">
        {line.segments.map((s, j) => (
          <span key={j}>{s.text}</span>
        ))}
      </div>
    )
  }

  // ── Chord + lyrics ────────────────────────────────────────────────────────
  // Each segment is a position:relative inline span. The chord is absolutely
  // positioned above it (bottom: 100%). Text flows naturally — no whitespace-pre,
  // no inline-block — so long lines wrap at spaces without splitting syllables.
  //
  // The key insight for "m[G]ă": "m" (end of seg-1) and "ă" (start of seg-2)
  // are adjacent inline spans with no whitespace between them, so the browser
  // will never insert a line break between them. They always land on the same
  // visual line, regardless of where the wrap happens.
  //
  // line-height is enlarged to give the absolute chord room above each text line.
  // Hanging indent (pl-[1em] + text-indent:-1em) applies to the block container
  // because all children are inline spans (first LINE BOX is shifted).
  const chordFontSize = Math.round(fontSize * 0.85)
  const lineHeight = Math.round(fontSize * 0.9 + chordFontSize + 4) // text + chord + gap

  return (
    <div
      key={idx}
      className="text-gray-900 pl-[1em] [text-indent:-1em] mb-1"
      style={{ lineHeight: `${lineHeight}px` }}
    >
      {line.segments.map((seg, j) => (
        <span key={j} className="relative">
          {seg.chord && (
            <span
              className="absolute bottom-full left-0 font-bold text-blue-600 leading-none whitespace-nowrap"
              style={{ fontSize: `${chordFontSize}px`, paddingRight: "0.5rem" }}
            >
              {seg.chord}
            </span>
          )}
          {seg.text || (seg.chord ? "​" : "")}
        </span>
      ))}
    </div>
  )
}

export function ChordProDisplay({
  content,
  semitones = 0,
  showChords = true,
  fontSize = 14,
  twoColumns = false,
}: Props) {
  const lines = useMemo(() => {
    const transposed = transposeContent(content, semitones)
    return parseChordPro(transposed)
  }, [content, semitones])

  const containerStyle = { fontSize: `${fontSize}px` }

  if (twoColumns && lines.length > 0) {
    const [left, right] = splitAtMidpoint(lines)
    return (
      <div className="grid grid-cols-2 gap-10 font-mono leading-relaxed select-text" style={containerStyle}>
        <div>
          {left.map((line, i) => (
            <LineItem key={i} line={line} idx={i} showChords={showChords} fontSize={fontSize} />
          ))}
        </div>
        <div>
          {right.map((line, i) => (
            <LineItem key={i} line={line} idx={i} showChords={showChords} fontSize={fontSize} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="font-mono leading-relaxed select-text" style={containerStyle}>
      {lines.map((line, i) => (
        <LineItem key={i} line={line} idx={i} showChords={showChords} fontSize={fontSize} />
      ))}
    </div>
  )
}
