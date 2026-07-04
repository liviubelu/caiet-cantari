import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import { parseChordPro, type ParsedLine } from "@/lib/chordpro"
import { HANDOUT_FONT_REGULAR, HANDOUT_FONT_BOLD } from "@/lib/handout-fonts"

// A4 in points; generous but compact margins.
const PAGE = { w: 595.28, h: 841.89 }
const MARGIN = 34
const COL_GAP = 18

const CHORD_BLUE = rgb(0.145, 0.388, 0.922)
const SECTION_GRAY = rgb(0.42, 0.45, 0.5)
const INK = rgb(0.07, 0.09, 0.15)
const RULE = rgb(0.85, 0.87, 0.9)
const BADGE_BG = rgb(0.96, 0.97, 0.99)

// Row heights as multiples of the lyric font size.
const CHORD_LH = 0.92
const LYRIC_LH = 1.34
const EMPTY_H = 0.5
const SECTION_TOP = 1.0
const SECTION_LH = 1.05

interface Fonts { reg: PDFFont; bold: PDFFont }

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(Buffer.from(b64, "base64"))
}

function isEmptyLine(line: ParsedLine): boolean {
  return !line.isComment && line.segments.every((s) => !s.chord && !(s.text || "").trim())
}

/** Height a line occupies at a given lyric font size. */
function lineHeight(line: ParsedLine, fs: number): number {
  if (line.isComment) {
    if (line.sectionType) return fs * SECTION_TOP + fs * 0.85 * (1 + SECTION_LH * 0)
    return line.commentText ? fs * 1.1 : 0
  }
  if (isEmptyLine(line)) return fs * EMPTY_H
  if (!line.hasChords) return fs * LYRIC_LH
  return fs * CHORD_LH + fs * LYRIC_LH
}

/** Effective drawn width of a line (chords can push segments apart). */
function lineWidth(line: ParsedLine, fs: number, fonts: Fonts): number {
  if (line.isComment) return 0
  if (!line.hasChords) return fonts.reg.widthOfTextAtSize(line.segments.map((s) => s.text).join(""), fs)
  let w = 0
  for (const seg of line.segments) {
    const tw = fonts.reg.widthOfTextAtSize(seg.text || "", fs)
    const cw = seg.chord ? fonts.bold.widthOfTextAtSize(seg.chord, fs * 0.82) + fs * 0.4 : 0
    w += Math.max(tw, cw)
  }
  return w
}

/** Group each section (header + its lines) so a column break never orphans a header. */
function groupLines(lines: ParsedLine[]): ParsedLine[][] {
  const groups: ParsedLine[][] = []
  let cur: ParsedLine[] = []
  for (const line of lines) {
    if (line.isComment && line.sectionType && cur.length) { groups.push(cur); cur = [] }
    cur.push(line)
  }
  if (cur.length) groups.push(cur)
  return groups
}

/** Distribute section-groups into `cols` balanced columns (fill first to ~half). */
function distribute(groups: ParsedLine[][], cols: number, fs: number): ParsedLine[][][] {
  if (cols === 1) return [groups]
  const heights = groups.map((g) => g.reduce((s, l) => s + lineHeight(l, fs), 0))
  const total = heights.reduce((a, b) => a + b, 0)
  const out: ParsedLine[][][] = [[], []]
  let acc = 0, ci = 0
  for (let i = 0; i < groups.length; i++) {
    if (ci === 0 && i > 0 && acc >= total / 2) ci = 1
    out[ci].push(groups[i])
    acc += heights[i]
  }
  return out
}

function columnHeight(groups: ParsedLine[][], fs: number): number {
  return groups.reduce((s, g) => s + g.reduce((s2, l) => s2 + lineHeight(l, fs), 0), 0)
}

function drawLine(page: PDFPage, line: ParsedLine, x: number, baselineY: number, fs: number, fonts: Fonts): number {
  if (line.isComment) {
    if (line.sectionType) {
      const y = baselineY - fs * SECTION_TOP
      page.drawText((line.commentText || "").toUpperCase(), { x, y: y - fs * 0.7, size: fs * 0.82, font: fonts.bold, color: SECTION_GRAY })
      return y - fs * 0.85
    }
    if (line.commentText) {
      page.drawText(line.commentText, { x, y: baselineY - fs * 0.8, size: fs * 0.8, font: fonts.reg, color: SECTION_GRAY })
      return baselineY - fs * 1.1
    }
    return baselineY
  }
  if (isEmptyLine(line)) return baselineY - fs * EMPTY_H

  if (!line.hasChords) {
    const text = line.segments.map((s) => s.text).join("")
    page.drawText(text, { x, y: baselineY - fs, size: fs, font: fonts.reg, color: INK })
    return baselineY - fs * LYRIC_LH
  }

  const chordY = baselineY - fs * 0.82
  const lyricY = baselineY - fs * CHORD_LH - fs
  let cx = x
  for (const seg of line.segments) {
    const t = seg.text || ""
    const tw = fonts.reg.widthOfTextAtSize(t, fs)
    const cw = seg.chord ? fonts.bold.widthOfTextAtSize(seg.chord, fs * 0.82) + fs * 0.4 : 0
    if (seg.chord) page.drawText(seg.chord, { x: cx, y: chordY, size: fs * 0.82, font: fonts.bold, color: CHORD_BLUE })
    if (t) page.drawText(t, { x: cx, y: lyricY, size: fs, font: fonts.reg, color: INK })
    cx += Math.max(tw, cw)
  }
  return baselineY - fs * CHORD_LH - fs * LYRIC_LH
}

export async function generateHandoutPdf(opts: {
  title: string
  content: string
  defaultKey?: string | null
}): Promise<Uint8Array> {
  const { title, content, defaultKey } = opts
  const lines = parseChordPro(content)

  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const reg = await doc.embedFont(b64ToBytes(HANDOUT_FONT_REGULAR), { subset: true })
  const bold = await doc.embedFont(b64ToBytes(HANDOUT_FONT_BOLD), { subset: true })
  const fonts: Fonts = { reg, bold }

  const page = doc.addPage([PAGE.w, PAGE.h])

  // ── Header ──────────────────────────────────────────────────────────────
  const titleSize = 17
  const titleY = PAGE.h - MARGIN - titleSize
  page.drawText(title, { x: MARGIN, y: titleY, size: titleSize, font: bold, color: INK })
  if (defaultKey) {
    const bx = MARGIN + bold.widthOfTextAtSize(title, titleSize) + 8
    const bw = bold.widthOfTextAtSize(defaultKey, 11) + 12
    page.drawRectangle({ x: bx, y: titleY - 3, width: bw, height: 18, borderColor: SECTION_GRAY, borderWidth: 0.8, color: BADGE_BG })
    page.drawText(defaultKey, { x: bx + 6, y: titleY + 2, size: 11, font: bold, color: INK })
  }
  const ruleY = titleY - 12
  page.drawLine({ start: { x: MARGIN, y: ruleY }, end: { x: PAGE.w - MARGIN, y: ruleY }, thickness: 0.7, color: RULE })

  const bodyTop = ruleY - 14
  const availableH = bodyTop - MARGIN

  // ── Auto-fit: small type, prefer TWO columns (fills the page like the
  // reference); use one column only for short songs or when lines are too wide
  // for a half column. Everything is server-computed, so the PDF is identical on
  // phone and desktop. ─────────────────────────────────────────────────────
  const groups = groupLines(lines)
  const short = columnHeight(groups, 11) <= availableH * 0.4
  const CONFIGS = short
    ? [
        { cols: 1, font: 11 }, { cols: 1, font: 10.5 }, { cols: 1, font: 10 },
        { cols: 2, font: 10 }, { cols: 2, font: 9 }, { cols: 2, font: 8 },
      ]
    : [
        { cols: 2, font: 11 }, { cols: 2, font: 10.5 }, { cols: 2, font: 10 },
        { cols: 2, font: 9.5 }, { cols: 2, font: 9 }, { cols: 2, font: 8.5 }, { cols: 2, font: 8 },
        { cols: 1, font: 11 }, { cols: 1, font: 10 }, { cols: 1, font: 9 },
        { cols: 2, font: 7.5 }, { cols: 2, font: 7 },
      ]
  let chosen = CONFIGS[CONFIGS.length - 1]
  for (const cfg of CONFIGS) {
    const colW = (PAGE.w - 2 * MARGIN - (cfg.cols - 1) * COL_GAP) / cfg.cols
    const cols = distribute(groups, cfg.cols, cfg.font)
    const maxColH = Math.max(...cols.map((c) => columnHeight(c, cfg.font)))
    const maxW = Math.max(0, ...lines.map((l) => lineWidth(l, cfg.font, fonts)))
    if (maxColH <= availableH && maxW <= colW) { chosen = cfg; break }
  }

  // ── Draw ────────────────────────────────────────────────────────────────
  const colW = (PAGE.w - 2 * MARGIN - (chosen.cols - 1) * COL_GAP) / chosen.cols
  const cols = distribute(groups, chosen.cols, chosen.font)
  cols.forEach((colGroups, ci) => {
    const x = MARGIN + ci * (colW + COL_GAP)
    let y = bodyTop
    for (const g of colGroups) {
      for (const line of g) y = drawLine(page, line, x, y, chosen.font, fonts)
    }
  })

  return doc.save()
}
