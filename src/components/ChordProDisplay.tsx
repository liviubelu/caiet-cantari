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

  // Look up to 5 lines around mid for a section header to start the right column on
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

  if (!line.hasChords || !showChords) {
    return (
      <div key={idx} className="leading-6 text-gray-900">
        {line.segments.map((s, j) => (
          <span key={j}>{s.text}</span>
        ))}
      </div>
    )
  }

  return (
    <div key={idx} className="flex flex-wrap items-end leading-none mb-1">
      {line.segments.map((seg, j) => (
        <span key={j} className="inline-flex flex-col">
          <span
            className="font-bold text-blue-600 leading-none mb-0.5 pr-2"
            style={{ fontSize: `${Math.round(fontSize * 0.85)}px` }}
          >
            {seg.chord ?? " "}
          </span>
          <span className="text-gray-900 leading-6 whitespace-pre">
            {seg.text || (seg.chord ? "​" : "")}
          </span>
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
