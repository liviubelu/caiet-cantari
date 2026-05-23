"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChordProDisplay } from "./ChordProDisplay"
import { CATEGORIES } from "@/lib/categories"
import { NOTES, transposeContent, semitonesBetween } from "@/lib/transpose"
import { DIATONIC, SECTIONS } from "@/lib/diatonic"

// ── Gemini usage tracking (localStorage, resets daily) ──────────────────────
const USAGE_KEY = "gemini_usage"
const FREE_LIMIT = 1500

interface UsageData { date: string; count: number }

function getToday() { return new Date().toISOString().split("T")[0] }

function readUsage(): UsageData {
  if (typeof window === "undefined") return { date: getToday(), count: 0 }
  try {
    const raw = localStorage.getItem(USAGE_KEY)
    if (!raw) return { date: getToday(), count: 0 }
    const d = JSON.parse(raw) as UsageData
    return d.date === getToday() ? d : { date: getToday(), count: 0 }
  } catch { return { date: getToday(), count: 0 } }
}

function incrementUsage() {
  const d = readUsage()
  const next = { date: getToday(), count: d.count + 1 }
  localStorage.setItem(USAGE_KEY, JSON.stringify(next))
  return next.count
}

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

export function SongForm({ songId, initialValues }: Props) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [content, setContent] = useState(initialValues?.content ?? "")
  const [category, setCategory] = useState(initialValues?.category ?? "")
  const [defaultKey, setDefaultKey] = useState(initialValues?.defaultKey ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Import state
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [importSuccess, setImportSuccess] = useState(false)
  const [usageCount, setUsageCount] = useState(0)

  useEffect(() => {
    setUsageCount(readUsage().count)
  }, [])

  const diatonicChords = DIATONIC[defaultKey] ?? []

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
    const needsNewline = before.length > 0 && !before.endsWith("\n\n") && !before.endsWith("\n")
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n" : ""
    insertAtCursor(`${prefix}{${tag}}\n`)
  }, [content, insertAtCursor])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset file input so same file can be re-selected
    e.target.value = ""

    if (usageCount >= FREE_LIMIT) {
      setImportError(`Limita gratuită de ${FREE_LIMIT} conversii/zi a fost atinsă. Încearcă mâine.`)
      return
    }

    setImporting(true)
    setImportError("")
    setImportSuccess(false)

    const fd = new FormData()
    fd.append("file", file)

    const res = await fetch("/api/convert-song", { method: "POST", body: fd })
    const data = await res.json()
    setImporting(false)

    if (!res.ok) {
      setImportError(data.error ?? "Eroare la conversie.")
      return
    }

    // Fill in the form fields
    if (data.title) setTitle(data.title)
    if (data.defaultKey) setDefaultKey(data.defaultKey)
    if (data.content) setContent(data.content)

    const newCount = incrementUsage()
    setUsageCount(newCount)
    setImportSuccess(true)
    setTimeout(() => setImportSuccess(false), 4000)
  }

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

  // Usage warning level
  const usagePct = usageCount / FREE_LIMIT
  const usageWarning = usagePct >= 0.97 ? "danger" : usagePct >= 0.80 ? "warn" : "ok"

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">

      {/* ── Import din imagine / PDF ── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-indigo-900">Importă din imagine sau PDF</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              Titlul, tonalitatea și versurile se completează automat cu AI
            </p>
          </div>
          <button
            type="button"
            disabled={importing || usageCount >= FREE_LIMIT}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-700 text-white text-xs font-semibold rounded-xl hover:bg-indigo-600 transition disabled:opacity-50 flex-shrink-0"
          >
            {importing ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31 11" />
                </svg>
                Se convertește…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Alege fișier
              </>
            )}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleImport}
        />

        {/* Success */}
        {importSuccess && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Conversie reușită! Verifică și completează câmpurile de mai jos.
          </div>
        )}

        {/* Error */}
        {importError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {importError}
          </div>
        )}

        {/* Usage counter */}
        <div className="mt-3 flex items-center justify-between">
          <span className={`text-[11px] font-medium ${
            usageWarning === "danger" ? "text-red-600" :
            usageWarning === "warn"   ? "text-amber-600" :
                                        "text-indigo-400"
          }`}>
            {usageWarning === "danger" && "🚨 "}
            {usageWarning === "warn"   && "⚠️ "}
            {usageCount}/{FREE_LIMIT} conversii gratuite azi
          </span>
          <span className="text-[10px] text-indigo-300">Resetare la miezul nopții</span>
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 h-1 bg-indigo-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usageWarning === "danger" ? "bg-red-500" :
              usageWarning === "warn"   ? "bg-amber-500" :
                                          "bg-indigo-400"
            }`}
            style={{ width: `${Math.min(100, usagePct * 100)}%` }}
          />
        </div>
      </div>

      {/* Titlu */}
      <div>
        <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
          Titlu
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Doamne, Te iubesc"
          required
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
        />
      </div>

      {/* Categorie + Tonalitate */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
            Categorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="">— Alege —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.value}</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
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
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="">—</option>
            {NOTES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            {["Dm", "Em", "Am", "Bm", "Cm", "Fm", "Gm", "F#m", "C#m"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar scurtături */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Secțiuni */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Secțiuni
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {SECTIONS.map((s) => (
              <button
                key={s.tag}
                type="button"
                onClick={() => insertSection(s.tag)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 active:bg-indigo-200 transition"
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
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex-shrink-0">
                Acorduri
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {diatonicChords.map((chord) => (
                  <button
                    key={chord}
                    type="button"
                    onClick={() => insertChord(chord)}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-mono font-semibold hover:bg-gray-200 active:bg-gray-300 transition"
                  >
                    {chord}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <span className="text-xs text-gray-300 italic">
              Alege o tonalitate ca să vezi acordurile gamei
            </span>
          )}
        </div>
      </div>

      {/* Editor */}
      <div>
        <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
          Conținut (ChordPro)
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={PLACEHOLDER}
          required
          rows={12}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 placeholder-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none leading-relaxed"
        />
        <p className="mt-1.5 text-[11px] text-gray-400">
          Acorduri:{" "}
          <code className="bg-gray-100 px-1 rounded">[C]text</code> &nbsp;|&nbsp; Secțiuni:{" "}
          <code className="bg-gray-100 px-1 rounded">{"{verse}"}</code>
        </p>
      </div>

      {/* Preview */}
      {content.trim() && (
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1.5">
            Preview
          </p>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4">
            <ChordProDisplay content={content} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 active:bg-gray-700 transition disabled:opacity-50"
      >
        {loading ? "Se salvează..." : songId ? "Salvează modificările" : "Adaugă melodia"}
      </button>

      {songId && (
        <button
          type="button"
          onClick={handleDelete}
          className="w-full border border-red-100 text-red-500 py-3.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition"
        >
          Șterge melodia
        </button>
      )}
    </form>
  )
}
