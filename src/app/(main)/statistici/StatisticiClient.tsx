"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyBadge } from "@/components/KeyBadge"
import { formatRoDate } from "@/lib/format"

export type StatItem = {
  id: string
  title: string
  defaultKey: string | null
  count: number
  lastSung: string
}

export type StatWindow = {
  items: StatItem[]
  totalSung: number
  distinctSongs: number
  events: number
}

type WindowTab = StatWindow & { key: string; label: string }

export function StatisticiClient({ windows }: { windows: WindowTab[] }) {
  const [active, setActive] = useState(windows[0]?.key ?? "1")
  const win = windows.find((w) => w.key === active) ?? windows[0]
  const maxCount = win.items[0]?.count ?? 1

  return (
    <div className="pb-8">
      {/* Window selector */}
      <div className="flex gap-2 mb-4">
        {windows.map((w) => (
          <button
            key={w.key}
            onClick={() => setActive(w.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              active === w.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "CÂNTĂRI", value: win.totalSung },
          { label: "MELODII", value: win.distinctSongs },
          { label: "EVENIMENTE", value: win.events },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            <p className="text-[10px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Ranked list */}
      {win.items.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm">Nicio melodie marcată ca fiind cântată în această perioadă.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {win.items.map((s, i) => (
            <li
              key={s.id}
              className="relative overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {/* Proportional bar */}
              <div
                className="absolute inset-y-0 left-0 bg-indigo-50 dark:bg-indigo-950/40 pointer-events-none"
                style={{ width: `${Math.max(6, (s.count / maxCount) * 100)}%` }}
              />
              <Link href={`/song/${s.id}`} className="relative flex items-center gap-3 px-3 py-2.5">
                <span className="w-6 text-center text-xs font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{s.title}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    Ultima dată: {formatRoDate(s.lastSung)}
                  </p>
                </div>
                {s.defaultKey && <KeyBadge keyName={s.defaultKey} />}
                <span className="flex items-baseline gap-0.5 flex-shrink-0">
                  <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{s.count}</span>
                  <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">×</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
