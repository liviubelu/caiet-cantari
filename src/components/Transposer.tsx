"use client"

import { getTransposedKey } from "@/lib/transpose"

const SHARPS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLATS  = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]

function noteIndex(note: string): number {
  const i = SHARPS.indexOf(note)
  return i >= 0 ? i : FLATS.indexOf(note)
}

interface Props {
  defaultKey: string | null
  semitones: number
  onChange: (semitones: number) => void
}

export function Transposer({ defaultKey, semitones, onChange }: Props) {
  if (!defaultKey) return null

  const parsed = defaultKey.match(/^([A-G][b#]?)(.*)$/)
  const defaultRoot = parsed?.[1] ?? defaultKey
  const quality = parsed?.[2] ?? ""

  const currentKey = getTransposedKey(defaultKey, semitones)
  const currentRoot = currentKey.match(/^([A-G][b#]?)/)?.[1] ?? currentKey

  function handleChange(targetRoot: string) {
    const fromIdx = noteIndex(defaultRoot)
    const toIdx = noteIndex(targetRoot)
    let delta = (toIdx - fromIdx + 12) % 12
    if (delta > 6) delta -= 12
    onChange(delta)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider text-gray-400 dark:text-gray-500 uppercase">Gamă</span>
      <select
        value={currentRoot}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition appearance-none pr-7 bg-[right_8px_center] bg-no-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        }}
      >
        {SHARPS.map((note) => (
          <option key={note} value={note}>
            {note + quality}
            {note === defaultRoot ? " ✓" : ""}
          </option>
        ))}
      </select>
      {semitones !== 0 && (
        <button
          onClick={() => onChange(0)}
          className="text-xs text-gray-400 hover:text-gray-700 transition"
          title="Resetează la tonalitatea originală"
        >
          Reset
        </button>
      )}
    </div>
  )
}
