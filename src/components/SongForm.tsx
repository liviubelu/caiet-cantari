"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChordProDisplay } from "./ChordProDisplay"
import { CATEGORIES } from "@/lib/categories"
import { NOTES } from "@/lib/transpose"

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
  const [title, setTitle] = useState(initialValues?.title ?? "")
  const [content, setContent] = useState(initialValues?.content ?? "")
  const [category, setCategory] = useState(initialValues?.category ?? "")
  const [defaultKey, setDefaultKey] = useState(initialValues?.defaultKey ?? "")
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
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
            onChange={(e) => setDefaultKey(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="">—</option>
            {NOTES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            {["Dm", "Em", "Am", "Bm", "Cm", "Fm", "Gm"].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
            Conținut (ChordPro)
          </label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            {preview ? "Editor" : "Preview"}
          </button>
        </div>

        {preview ? (
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-4 min-h-48">
            {content ? (
              <ChordProDisplay content={content} />
            ) : (
              <p className="text-sm text-gray-300">Scrie conținutul mai întâi…</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={PLACEHOLDER}
            required
            rows={14}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-900 placeholder-gray-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none leading-relaxed"
          />
        )}

        <p className="mt-2 text-[11px] text-gray-400">
          Acordurile se scriu între paranteze drepte:{" "}
          <code className="bg-gray-100 px-1 rounded">[C]text [G]text</code>. Secțiunile:{" "}
          <code className="bg-gray-100 px-1 rounded">{"{verse}"}</code>,{" "}
          <code className="bg-gray-100 px-1 rounded">{"{chorus}"}</code>
        </p>
      </div>

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
