"use client"

import { useState } from "react"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      let data: { error?: string } = {}
      try { data = await res.json() } catch { /* ignore */ }
      if (!res.ok) {
        setError(data.error ?? "A apărut o eroare.")
      } else {
        setSent(true)
      }
    } catch {
      setError("A apărut o eroare de rețea.")
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Verifică emailul</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-1">
          Am trimis un link de resetare la
        </p>
        <p className="font-semibold text-gray-800 text-sm mb-6">{email}</p>
        <p className="text-xs text-gray-400 mb-6">
          Link-ul este valabil <strong>1 oră</strong>. Verifică și folderul Spam.
        </p>
        <Link href="/login" className="text-sm font-semibold text-indigo-700 hover:underline">
          Înapoi la login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <ChurchIcon size={22} />
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Resetare parolă
        </p>
        <h1 className="text-2xl font-display font-bold text-gray-900 text-center">
          Ai uitat parola?
        </h1>
        <p className="mt-3 text-sm text-gray-500 text-center leading-relaxed">
          Introdu emailul contului tău și îți trimitem un link de resetare.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="numele.tau@email.ro"
            required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? "Se trimite..." : "Trimite link de resetare"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        <Link href="/login" className="text-gray-700 font-semibold hover:underline">
          ← Înapoi la login
        </Link>
      </p>
    </div>
  )
}
