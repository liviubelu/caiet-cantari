export interface Segment {
  chord?: string
  text: string
}

export interface ParsedLine {
  segments: Segment[]
  hasChords: boolean
  isComment: boolean
  commentText?: string
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
  return content.split("\n").map(parseChordProLine)
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
