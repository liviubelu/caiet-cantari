"use client"

import { useMemo } from "react"
import { parseChordPro } from "@/lib/chordpro"
import { transposeContent } from "@/lib/transpose"

interface Props {
  content: string
  semitones?: number
  showChords?: boolean
  fontSize?: number
}

export function ChordProDisplay({ content, semitones = 0, showChords = true, fontSize = 14 }: Props) {
  const lines = useMemo(() => {
    const transposed = transposeContent(content, semitones)
    return parseChordPro(transposed)
  }, [content, semitones])

  return (
    <div className="font-mono leading-relaxed select-text" style={{ fontSize: `${fontSize}px` }}>
      {lines.map((line, i) => {
        if (line.isComment) {
          return (
            <p key={i} className="text-[11px] font-sans font-semibold uppercase tracking-widest text-gray-400 mt-5 mb-1 first:mt-0">
              {line.commentText}
            </p>
          )
        }

        const isEmpty = line.segments.every((s) => !s.chord && !s.text.trim())
        if (isEmpty) return <div key={i} className="h-3" />

        if (!line.hasChords || !showChords) {
          return (
            <div key={i} className="leading-6 text-gray-900">
              {line.segments.map((s, j) => (
                <span key={j}>{s.text}</span>
              ))}
            </div>
          )
        }

        return (
          <div key={i} className="flex flex-wrap items-end leading-none mb-1">
            {line.segments.map((seg, j) => (
              <span key={j} className="inline-flex flex-col">
                <span className="font-bold text-blue-600 leading-none mb-0.5 pr-2" style={{ fontSize: `${Math.round(fontSize * 0.85)}px` }}>
                  {seg.chord ?? " "}
                </span>
                <span className="text-gray-900 leading-6">
                  {seg.text || (seg.chord ? "​" : "")}
                </span>
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
