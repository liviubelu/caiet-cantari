"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChurchIcon } from "@/components/ChurchIcon"

const QUOTES = [
  { text: "Veniți la Mine toți cei trudiți și împovărați și Eu vă voi da odihnă.", ref: "Matei 11:28" },
  { text: "Cântați Domnului o cântare nouă, cântați Domnului toți locuitorii pământului!", ref: "Ps. 96:1" },
]

export default function LoginPage() {
  const router = useRouter()
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
    setLoading(false)
    if (res?.error) {
      setError("Email sau parolă incorectă.")
    } else {
      router.push("/")
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <ChurchIcon size={22} />
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Biserica Bartolomeu
        </p>
        <h1 className="text-3xl font-display font-bold text-gray-900 text-center">
          Bine ai revenit.
        </h1>
        <p className="mt-4 text-sm text-gray-500 italic text-center leading-relaxed px-4">
          „{quote.text}" — {quote.ref}
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
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase">
              Parolă
            </label>
            <button type="button" className="text-xs text-gray-400 hover:text-gray-600">
              Ai uitat parola?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              {showPass ? "Ascunde" : "Arată"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 active:bg-gray-700 transition disabled:opacity-50"
        >
          {loading ? "Se verifică..." : "Continuă"}
        </button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">SAU</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <Link
          href="/"
          className="block w-full border border-gray-200 bg-white text-gray-700 py-3.5 rounded-xl font-semibold text-sm text-center hover:bg-gray-50 transition"
        >
          Continuă fără cont
        </Link>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Nu ai cont încă?{" "}
        <Link href="/register" className="text-gray-700 font-semibold hover:underline">
          Creează unul
        </Link>
      </p>
    </div>
  )
}
