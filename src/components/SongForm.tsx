"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ChordProDisplay } from "./ChordProDisplay"
import { CATEGORIES } from "@/lib/categories"
import { NOTES, transposeContent, semitonesBetween } from "@/lib/transpose"
import { getDiatonicChords, SECTIONS } from "@/lib/diatonic"

interface Props {
  songId?: string
  initialValues?: {
    title: string
    content: string
    category: string
    defaultKey: string
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

  const diatonicChords = getDiatonicChords(defaultKey)

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
      body: JSON.stringify({ title, content, category, defaultKey }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "A apărut o eroare.")
      return
    }
    const song = await res.json()
    router.push(`/song/${song.id}`)
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
                {["Dm", "Em", "Am", "Bm", "Cm", "Fm", "Gm", "F#m", "C#m", "G#m", "Bbm"].map((n) => (
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
              rows={14}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 placeholder-gray-200 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition resize-none leading-relaxed"
            />
            <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
              Acorduri:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">[C]text</code>
              {" "}&nbsp;|&nbsp;{" "}
              Secțiuni:{" "}
              <code className="bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">{"{verse}"}</code>
            </p>
          </div>

          {/* Butoane — vizibile și pe mobile sub textarea */}
          <div className="space-y-2 lg:hidden">
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

        {/* ── Right column — preview + buttons (desktop) ───────────────── */}
        <div className="space-y-4 lg:sticky lg:top-24">

          {/* Preview */}
          {content.trim() ? (
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1.5">
                Preview
              </p>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 max-h-[60vh] overflow-y-auto">
                <ChordProDisplay content={content} />
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center h-40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-300 dark:text-gray-600 italic">Preview-ul apare când scrii conținut</p>
            </div>
          )}

          {/* Butoane — desktop only in right column */}
          <div className="hidden lg:block space-y-2">
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
    </form>
  )
}
