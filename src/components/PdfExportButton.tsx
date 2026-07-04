"use client"

import { parseChordPro, type ParsedLine } from "@/lib/chordpro"

/**
 * Export the song (with chords) to a print/PDF sheet.
 *
 * Builds a self-contained, light-themed A4 layout off-screen, auto-fits it to a
 * single page — preferring one column, then shrinking a little, then switching to
 * two columns (shrinking the font only as much as needed) — and calls
 * window.print(), where the browser offers "Save as PDF".
 *
 * Inline styles only (independent of the app's dark mode / Tailwind), so the
 * sheet is always black-on-white with blue chords and colored section labels.
 */
export function PdfExportButton({ title, content }: { title: string; content: string }) {
  function exportPdf() {
    const lines = parseChordPro(content)

    const STYLE_ID = "song-pdf-style"
    const ROOT_ID = "song-pdf-root"
    document.getElementById(STYLE_ID)?.remove()
    document.getElementById(ROOT_ID)?.remove()

    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = `
      @media print {
        body > *:not(#${ROOT_ID}) { display: none !important; }
        #${ROOT_ID} {
          display: block !important;
          position: static !important; left: auto !important; top: auto !important;
          width: auto !important;
        }
        @page { size: A4; margin: 12mm; }
      }
    `
    document.head.appendChild(style)

    const root = document.createElement("div")
    root.id = ROOT_ID
    // Off-screen at the A4 content width (A4 210mm − 2×12mm margins = 186mm) for
    // measurement; print-color-adjust keeps the chord/section colors when printed.
    root.style.cssText =
      "position:fixed;left:-10000px;top:0;width:186mm;background:#fff;color:#111827;" +
      "-webkit-print-color-adjust:exact;print-color-adjust:exact"
    document.body.appendChild(root)

    // Prefer one column at a comfortable size; if it overflows, shrink a little,
    // then go two columns, shrinking the font only as needed.
    const CONFIGS = [
      { cols: 1, font: 14 }, { cols: 1, font: 13 }, { cols: 1, font: 12 },
      { cols: 2, font: 14 }, { cols: 2, font: 13 }, { cols: 2, font: 12 },
      { cols: 2, font: 11 }, { cols: 2, font: 10 }, { cols: 2, font: 9 },
    ]
    // A4 content height: 297mm − 2×12mm = 273mm ≈ 1031px @96dpi; small safety margin.
    const MAX_H = 1010

    let chosen = CONFIGS[CONFIGS.length - 1]
    for (const cfg of CONFIGS) {
      root.innerHTML = buildHtml(title, lines, cfg.font, cfg.cols)
      if (root.scrollHeight <= MAX_H) { chosen = cfg; break }
    }
    root.innerHTML = buildHtml(title, lines, chosen.font, chosen.cols)

    // Hide on screen (the @media print rule reveals it only for printing).
    root.style.display = "none"

    const cleanup = () => {
      root.remove()
      style.remove()
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)
    // Safety net if afterprint never fires (some mobile browsers).
    setTimeout(cleanup, 120000)

    window.print()
  }

  return (
    <button
      onClick={exportPdf}
      className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 2v6h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      PDF
    </button>
  )
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function renderLine(line: ParsedLine, font: number): string {
  if (line.isComment) {
    if (line.sectionType) {
      return `<div style="font-size:${(font * 0.8).toFixed(1)}px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${line.sectionColor || "#9ca3af"};margin:14px 0 3px">${esc(line.commentText || "")}</div>`
    }
    return line.commentText
      ? `<div style="font-size:${(font * 0.8).toFixed(1)}px;color:#9ca3af;margin:6px 0">${esc(line.commentText)}</div>`
      : ""
  }

  const isEmpty = line.segments.every((s) => !s.chord && !(s.text || "").trim())
  if (isEmpty) return `<div style="height:${Math.round(font * 0.6)}px"></div>`

  const italic = line.sectionType === "chorus" ? "font-style:italic;" : ""

  if (!line.hasChords) {
    const text = line.segments.map((s) => s.text).join("")
    return `<div style="line-height:1.6;${italic}">${esc(text) || "&nbsp;"}</div>`
  }

  const segs = line.segments
    .map((seg) => {
      const chord = seg.chord ? esc(seg.chord) : " "
      const text = seg.text ? esc(seg.text) : seg.chord ? "​" : ""
      return `<span style="display:inline-flex;flex-direction:column;align-items:flex-start">` +
        `<span style="font-weight:700;color:#2563eb;font-size:${(font * 0.85).toFixed(1)}px;line-height:1;margin-bottom:1px;padding-right:6px;white-space:pre">${chord}</span>` +
        `<span style="white-space:pre;line-height:1.6;${italic}">${text}</span></span>`
    })
    .join("")
  return `<div style="display:flex;flex-wrap:wrap;align-items:flex-end;line-height:1;margin-bottom:3px">${segs}</div>`
}

function buildHtml(title: string, lines: ParsedLine[], font: number, cols: number): string {
  // Group each section (header + its lines) so a column break never orphans a
  // header from its verse.
  const groups: ParsedLine[][] = []
  let cur: ParsedLine[] = []
  for (const line of lines) {
    if (line.isComment && line.sectionType && cur.length) {
      groups.push(cur)
      cur = []
    }
    cur.push(line)
  }
  if (cur.length) groups.push(cur)

  const body = groups
    .map((g) => `<div style="break-inside:avoid;-webkit-column-break-inside:avoid">${g.map((l) => renderLine(l, font)).join("")}</div>`)
    .join("")

  return (
    `<div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:700;line-height:1.2;margin:0 0 12px">${esc(title)}</div>` +
    `<div style="column-count:${cols};column-gap:26px;font-family:ui-monospace,Menlo,Consolas,'Liberation Mono',monospace;font-size:${font}px;color:#111827">${body}</div>`
  )
}
