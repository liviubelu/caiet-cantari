"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChordProDisplay } from "./ChordProDisplay"
import { KeyBadge } from "./KeyBadge"
import { OrderBar } from "./OrderBar"
import { CATEGORIES, getCategoryColor } from "@/lib/categories"
import { NOTES, transposeContent, semitonesBetween } from "@/lib/transpose"
import { getDiatonicChords, SECTIONS } from "@/lib/diatonic"
import { parseSections, parseOrder } from "@/lib/sections"

interface Props {
  songId?: string
  initialValues?: {
    title: string
    content: string
    category: string
    defaultKey: string
    singingOrder?: string | null
  }
}

const PLACEHOLDER = `{verse}
[C]Doamne, [G]Te iubesc cu [Am]toată [F]inima
[C]Doamne, [G]Te iubesc cu [Am]tot su[F]fletul

{chorus}
[F]Te [C]laud, [G]Te [Am]ador
[F]Tu ești [C]Domnul [G]meu`

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

export function SongForm({ songId, initialValues }: Props) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [content, setContent] = useState(initialValues?.content ?? "")
  const [category, setCategory] = useState(initialValues?.category ?? "")
  const [defaultKey, setDefaultKey] = useState(initialValues?.defaultKey ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [order, setOrder] = useState<string[]>(parseOrder(initialValues?.singingOrder))
  const [showPreview, setShowPreview] = useState(false)

  const diatonicChords = getDiatonicChords(defaultKey)
  // Sections detected from the current content — drives the order builder.
  const sections = useMemo(() => parseSections(content), [content])

  function addSection(id: string) { setOrder((o) => [...o, id]) }
  function removeSection(i: number) { setOrder((o) => o.filter((_, k) => k !== i)) }
  function resetOrder() { setOrder([]) }
  function moveSection(i: number, dir: -1 | 1) {
    setOrder((o) => {
      const j = i + dir
      if (j < 0 || j >= o.length) return o
      const next = [...o]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  // Close the full-screen preview with Escape
  useEffect(() => {
    if (!showPreview) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowPreview(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [showPreview])

  // Auto-grow the editor so a short song leaves no tall empty box (and the page
  // doesn't scroll for it). Long songs grow up to the CSS max-height, then the
  // textarea scrolls internally.
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${ta.scrollHeight}px`
  }, [content])

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((prev) => prev + text)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.slice(0, start) + text + content.slice(end)
    setContent(newContent)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + text.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }, [content])

  const insertChord = useCallback((chord: string) => {
    insertAtCursor(`[${chord}]`)
  }, [insertAtCursor])

  const insertSection = useCallback((tag: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? content.length
    const before = content.slice(0, start)
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
    insertAtCursor(`${prefix}{${tag}}\n`)
  }, [content, insertAtCursor])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const method = songId ? "PUT" : "POST"
    const url = songId ? `/api/songs/${songId}` : "/api/songs"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category, defaultKey, singingOrder: order.length ? JSON.stringify(order) : null }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "A apărut o eroare.")
      return
    }
    const song = await res.json()
    // replace (not push) so "Înapoi" from the song page returns to where the
    // user came from, not back into the edit/add form.
    router.replace(`/song/${song.id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!songId || !confirm("Ștergi această melodie?")) return
    await fetch(`/api/songs/${songId}`, { method: "DELETE" })
    router.push("/")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="pb-8">

      {/* ── Two-column layout on desktop ─────────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start space-y-4 lg:space-y-0">

        {/* ── Left column — fields ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Titlu */}
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
              Titlu
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Doamne, Te iubesc"
              required
              className={INPUT}
            />
          </div>

          {/* Categorie + Tonalitate */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Categorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={INPUT}
              >
                <option value="">— Alege —</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.value}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Tonalitate
              </label>
              <select
                value={defaultKey}
                onChange={(e) => {
                  const newKey = e.target.value
                  if (newKey && defaultKey && newKey !== defaultKey && content) {
                    const steps = semitonesBetween(defaultKey, newKey)
                    if (steps !== 0) setContent(transposeContent(content, steps))
                  }
                  setDefaultKey(newKey)
                }}
                className={INPUT}
              >
                <option value="">—</option>
                {NOTES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
                {/* All 12 minor keys, sharps only, same root order as major keys */}
                {["Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toolbar scurtături */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Secțiuni */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1 flex-shrink-0">
                Secțiuni
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {SECTIONS.map((s) => (
                  <button
                    key={s.tag}
                    type="button"
                    onClick={() => insertSection(s.tag)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 active:bg-indigo-200 transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acorduri din gamă */}
            <div className="flex items-center gap-1.5 px-3 py-2 min-h-[44px]">
              {diatonicChords.length > 0 ? (
                <>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1 flex-shrink-0">
                    Acorduri
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {diatonicChords.map((chord) => (
                      <button
                        key={chord}
                        type="button"
                        onClick={() => insertChord(chord)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-mono font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 transition"
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600 italic">
                  Alege o tonalitate ca să vezi acordurile gamei
                </span>
              )}
            </div>
          </div>

          {/* Editor */}
          <div>
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
              Conținut (ChordPro)
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={PLACEHOLDER}
              required
              rows={8}
              className="w-full min-h-[8rem] max-h-[60vh] lg:max-h-[calc(100dvh_-_23rem)] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-200 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              Acorduri:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">[C]text</code>
              {" "}&nbsp;|&nbsp;{" "}
              Secțiuni:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">{"{verse}"}</code>
            </p>
          </div>

        </div>

        {/* ── Right column — singing order builder + actions ──────────────── */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* ORDER BUILDER */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/></svg>
                <span className="text-[11px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">Ordinea de cântare</span>
              </div>
              {order.length > 0 && (
                <button type="button" onClick={resetOrder} className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">Resetează</button>
              )}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">Atinge o secțiune ca s-o adaugi în șir. Poți repeta refrenul de câte ori e nevoie.</p>

            {sections.length === 0 ? (
              <p className="text-xs text-gray-300 dark:text-gray-600 italic">
                Adaugă secțiuni în conținut ({"{verse}"}, {"{chorus}"}…) ca să poți construi o ordine.
              </p>
            ) : (
              <>
                <p className="text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500 mb-2">Secțiuni disponibile</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addSection(s.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
                      style={{ backgroundColor: `${s.color}1a`, color: s.color }}
                    >
                      <span className="text-sm leading-none">+</span>{s.label}
                    </button>
                  ))}
                </div>

                {order.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {order.map((id, i) => {
                      const s = sections.find((x) => x.id === id)
                      if (!s) return null
                      return (
                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-2">
                          <span className="w-5 h-5 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{s.label}</span>
                          <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="Mută mai sus" className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-25 transition flex items-center justify-center flex-shrink-0">↑</button>
                          <button type="button" onClick={() => moveSection(i, 1)} disabled={i === order.length - 1} aria-label="Mută mai jos" className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-25 transition flex items-center justify-center flex-shrink-0">↓</button>
                          <button type="button" onClick={() => removeSection(i)} aria-label="Elimină din ordine" className="w-7 h-7 rounded-lg border border-red-200/70 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition flex items-center justify-center flex-shrink-0">✕</button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-3.5 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5 leading-relaxed">Nicio ordine setată — melodia se cântă în ordinea naturală:</p>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {sections.map((s, i) => (
                        <span key={s.id} className="inline-flex items-center gap-1.5">
                          {i > 0 && <span className="text-gray-300 dark:text-gray-600 text-xs">›</span>}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold font-mono" style={{ backgroundColor: `${s.color}1a`, color: s.color }}>{s.abbr}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Full-screen preview button (replaces the old inline preview) */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
            Previzualizare pe tot ecranul
          </button>

          {/* Actions */}
          <div className="space-y-2">
            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-indigo-600 transition disabled:opacity-50"
            >
              {loading ? "Se salvează..." : songId ? "Salvează modificările" : "Adaugă melodia"}
            </button>
            {songId && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full border border-red-100 dark:border-red-900 text-red-500 dark:text-red-400 py-3.5 rounded-xl font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950 transition"
              >
                Șterge melodia
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Full-screen preview overlay — shows the song like the real page ── */}
      {showPreview && (
        <div role="dialog" aria-modal="true" aria-label="Previzualizare melodie" className="fixed inset-0 z-[60] bg-[#f0f2f5] dark:bg-gray-950 flex flex-col">
          <div className="flex items-center justify-between px-4 lg:px-6 pt-safe-bar pb-3 lg:pt-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/></svg>
              <span className="text-[11px] font-bold tracking-widest uppercase">Previzualizare</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              ✕ Închide
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 lg:px-6 py-4">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 lg:px-8 pt-6 pb-4">
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
                  {title.trim() || "Titlul melodiei"}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {category && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${getCategoryColor(category).color}1a`, color: getCategoryColor(category).color }}>
                      {category}
                    </span>
                  )}
                  {defaultKey && <KeyBadge keyName={defaultKey} />}
                </div>
                <OrderBar order={order} sections={sections} className="mt-3" />
              </div>
              <div className="px-5 lg:px-8 pb-8 border-t border-gray-100 dark:border-gray-700 pt-5">
                {content.trim() ? (
                  <ChordProDisplay content={content} />
                ) : (
                  <p className="text-sm text-gray-300 dark:text-gray-600 italic py-6">Niciun conținut de afișat.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
