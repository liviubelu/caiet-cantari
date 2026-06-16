import { sectionTypeFromMarker, sectionDisplay, countKey } from "./sections"

export interface Segment {
  chord?: string
  text: string
}

export interface ParsedLine {
  segments: Segment[]
  hasChords: boolean
  isComment: boolean
  commentText?: string
  sectionType?: string   // type of the section this line belongs to (verse, chorus, …)
  sectionColor?: string  // color for a section header (comment) line
}

export function parseChordProLine(line: string): ParsedLine {
  if (line.startsWith("{") && line.endsWith("}")) {
    const inner = line.slice(1, -1)
    const colon = inner.indexOf(":")
    return {
      segments: [],
      hasChords: false,
      isComment: true,
      commentText: colon >= 0 ? inner.slice(colon + 1).trim() : inner.trim(),
    }
  }

  const segments: Segment[] = []
  let hasChords = false

  const regex = /\[([^\]]+)\]([^\[]*)/g
  let lastEnd = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    hasChords = true
    const textBefore = line.slice(lastEnd, match.index)
    if (textBefore && segments.length === 0) {
      segments.push({ text: textBefore })
    }
    segments.push({ chord: match[1], text: match[2] })
    lastEnd = match.index + match[0].length
  }

  const remaining = line.slice(lastEnd)
  if (remaining) {
    if (segments.length === 0) {
      segments.push({ text: remaining })
    } else {
      segments[segments.length - 1].text += remaining
    }
  }

  if (segments.length === 0) {
    segments.push({ text: line })
  }

  return { segments, hasChords, isComment: false }
}

export function parseChordPro(content: string): ParsedLine[] {
  const raw = content.split("\n")

  // Pre-scan section totals so labels can be numbered the same way as the
  // section builder (e.g. "Strofa 1/2/3", single "Refren" stays unnumbered).
  const totals: Record<string, number> = {}
  for (const line of raw) {
    const m = sectionTypeFromMarker(line)
    if (m) { const k = countKey(m); totals[k] = (totals[k] ?? 0) + 1 }
  }

  const seen: Record<string, number> = {}
  let curType: string | undefined
  let curColor: string | undefined

  return raw.map((line) => {
    const parsed = parseChordProLine(line)
    const m = sectionTypeFromMarker(line)
    if (m && parsed.isComment) {
      const k = countKey(m)
      seen[k] = (seen[k] ?? 0) + 1
      const d = sectionDisplay(m.type, m.inner, seen[k], totals[k])
      parsed.commentText = d.label
      parsed.sectionType = m.type
      parsed.sectionColor = d.color
      curType = m.type
      curColor = d.color
    } else if (parsed.isComment) {
      // a directive / non-section comment — leave its text, reset section context
      curType = undefined
      curColor = undefined
    } else {
      parsed.sectionType = curType
      parsed.sectionColor = curColor
    }
    return parsed
  })
}

export function extractFirstLine(content: string): string {
  for (const line of content.split("\n")) {
    const parsed = parseChordProLine(line)
    if (parsed.isComment) continue
    const text = parsed.segments.map((s) => s.text).join("").trim()
    if (text) return text
  }
  return ""
}
