"use client"

import { useState } from "react"

const INPUT =
  "w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

export function AccountRequests() {
  // ── Instrumentist account request ──────────────────────────────────────────
  const [instrLoading, setInstrLoading] = useState(false)
  const [instrSent, setInstrSent] = useState(false)
  const [instrError, setInstrError] = useState("")

  async function requestInstrumentist() {
    if (instrLoading || instrSent) return
    setInstrError("")
    setInstrLoading(true)
    try {
      const res = await fetch("/api/requests/instrumentist", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setInstrError(data.error ?? "A apărut o eroare.")
      } else {
        setInstrSent(true)
      }
    } catch {
      setInstrError("Eroare de rețea. Încearcă din nou.")
    }
    setInstrLoading(false)
  }

  // ── Song request ────────────────────────────────────────────────────────────
  const [songOpen, setSongOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [link, setLink] = useState("")
  const [notes, setNotes] = useState("")
  const [songLoading, setSongLoading] = useState(false)
  const [songSent, setSongSent] = useState(false)
  const [songError, setSongError] = useState("")

  async function submitSong() {
    if (songLoading || !title.trim()) return
    setSongError("")
    setSongLoading(true)
    try {
      const res = await fetch("/api/requests/song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, link, notes }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSongError(data.error ?? "A apărut o eroare.")
      } else {
        setSongSent(true)
      }
    } catch {
      setSongError("Eroare de rețea. Încearcă din nou.")
    }
    setSongLoading(false)
  }

  return (
    <>
      {/* ── Cerere cont instrumentist ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cont de instrumentist</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
              Cere acces ca să poți adăuga și edita melodii.
            </p>
          </div>
          {instrSent ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Trimisă
            </span>
          ) : (
            <button
              onClick={requestInstrumentist}
              disabled={instrLoading}
              className="flex-shrink-0 bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {instrLoading ? "Se trimite…" : "Trimite cerere"}
            </button>
          )}
        </div>
        {instrError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{instrError}</p>}
        {instrSent && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
            Cererea a fost trimisă administratorului. Te anunțăm când e aprobată.
          </p>
        )}
      </div>

      {/* ── Cerere melodie ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setSongOpen((o) => !o)}
          className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cere o melodie</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
              Nu găsești o cântare? Trimite-ne-o și o adăugăm.
            </p>
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            className={`flex-shrink-0 text-gray-400 transition-transform ${songOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {songOpen && !songSent && (
          <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-700/50 pt-3 space-y-3">
            <div>
              <label htmlFor="req-title" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Titlul melodiei *
              </label>
              <input id="req-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mare ești Tu" className={INPUT} />
            </div>
            <div>
              <label htmlFor="req-link" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Link cu versuri <span className="text-gray-400 dark:text-gray-600 normal-case font-normal tracking-normal">(opțional)</span>
              </label>
              <input id="req-link" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className={INPUT} />
            </div>
            <div>
              <label htmlFor="req-notes" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Observații <span className="text-gray-400 dark:text-gray-600 normal-case font-normal tracking-normal">(opțional)</span>
              </label>
              <textarea id="req-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tonalitate, autor, când o folosim…" className={`${INPUT} resize-none`} />
            </div>
            {songError && <p className="text-xs text-red-500 dark:text-red-400">{songError}</p>}
            <button
              onClick={submitSong}
              disabled={songLoading || !title.trim()}
              className="w-full bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {songLoading ? "Se trimite…" : "Trimite cererea"}
            </button>
          </div>
        )}

        {songSent && (
          <div className="px-4 pb-4 border-t border-gray-50 dark:border-gray-700/50 pt-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Cerere trimisă. Mulțumim!
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">Am trimis cererea administratorului.</p>
            <button
              onClick={() => { setSongSent(false); setTitle(""); setLink(""); setNotes(""); setSongError(""); setSongOpen(true) }}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <span className="text-base leading-none">+</span> Mai cere o melodie
            </button>
          </div>
        )}
      </div>
    </>
  )
}
