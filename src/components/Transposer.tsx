"use client"

import { getTransposedKey } from "@/lib/transpose"

interface Props {
  defaultKey: string | null
  semitones: number
  onChange: (semitones: number) => void
}

export function Transposer({ defaultKey, semitones, onChange }: Props) {
  const currentKey = defaultKey ? getTransposedKey(defaultKey, semitones) : null

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(semitones - 1)}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors font-semibold text-lg"
        aria-label="Coboară cu un semiton"
      >
        ♭
      </button>
      <div className="flex flex-col items-center min-w-[48px]">
        {currentKey && (
          <span className="text-base font-bold text-gray-900">{currentKey}</span>
        )}
        {semitones !== 0 && (
          <span className="text-[10px] text-gray-400">
            {semitones > 0 ? `+${semitones}` : semitones}
          </span>
        )}
      </div>
      <button
        onClick={() => onChange(semitones + 1)}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors font-semibold text-lg"
        aria-label="Urcă cu un semiton"
      >
        ♯
      </button>
      {semitones !== 0 && (
        <button
          onClick={() => onChange(0)}
          className="ml-1 text-xs text-gray-400 underline hover:text-gray-600"
        >
          Reset
        </button>
      )}
    </div>
  )
}
