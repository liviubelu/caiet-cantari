"use client"

import { useState } from "react"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "A apărut o eroare.")
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">Verifică emailul</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          Am trimis un link de confirmare la
        </p>
        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-6">{email}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Nu l-ai primit? Verifică folderul Spam sau{" "}
          <button onClick={() => setSent(false)} className="underline hover:text-gray-600 dark:hover:text-gray-300">
            încearcă din nou
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <ChurchIcon size={22} />
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">
          Cont Nou
        </p>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 text-center">
          Biserica Bartolomeu.
        </h1>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic text-center leading-relaxed px-4">
          „Lăudați pe Domnul, chemați Numele Lui." — Psalm 105:1
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="numele.tau@email.ro"
            required
            className={INPUT}
          />
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 dark:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? "Se trimite emailul..." : "Trimite link de confirmare"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
        Ai deja cont?{" "}
        <Link href="/login" className="text-gray-700 dark:text-gray-200 font-semibold hover:underline">
          Conectează-te
        </Link>
      </p>
    </div>
  )
}
