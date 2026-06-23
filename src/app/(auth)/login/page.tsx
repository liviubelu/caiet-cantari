"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"

const QUOTES = [
  { text: "Veniți la Mine toți cei trudiți și împovărați și Eu vă voi da odihnă.", ref: "Matei 11:28" },
  { text: "Cântați Domnului o cântare nouă, cântați Domnului toți locuitorii pământului!", ref: "Ps. 96:1" },
]

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const quote = QUOTES[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    if (res?.error) {
      // Distinguish a brute-force lockout from plain wrong credentials.
      let msg = "Email sau parolă incorectă."
      try {
        const r = await fetch(`/api/auth/throttle?email=${encodeURIComponent(email)}`)
        const data = await r.json()
        if (data?.minutes > 0) {
          msg = `Prea multe încercări greșite. Reîncearcă peste ~${data.minutes} min.`
        }
      } catch {
        /* keep the generic message */
      }
      setError(msg)
      setLoading(false)
    } else {
      // Full page navigation so the server layout picks up the fresh session
      // and BottomNav / Sidebar show the correct role immediately.
      window.location.replace("/")
    }
  }

  return (
    <div>
      {/* Logo + header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <ChurchIcon size={22} />
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">
          Tineri Bartolomeu
        </p>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 text-center">
          Bine ai venit!
        </h1>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic text-center leading-relaxed px-4">
          „{quote.text}” — {quote.ref}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="numele.tau@email.ro"
            required
            className={INPUT}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase">
              Parolă
            </label>
            <Link href="/forgot-password" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              Ai uitat parola?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${INPUT} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPass ? "Ascunde" : "Arată"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 dark:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-indigo-600 active:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? "Se verifică..." : "Continuă"}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500">SAU</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <Link
          href="/"
          className="block w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3.5 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Continuă fără cont
        </Link>
      </form>

      <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
        Nu ai cont încă?{" "}
        <Link href="/register" className="text-gray-700 dark:text-gray-200 font-semibold hover:underline">
          Creează unul
        </Link>
      </p>
    </div>
  )
}
