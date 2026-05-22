"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.")
      return
    }
    setLoading(true)
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "A apărut o eroare.")
      setLoading(false)
      return
    }
    await signIn("credentials", { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    router.push("/")
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v18M3 12h18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Cont Nou
        </p>
        <h1 className="text-3xl font-display font-bold text-gray-900 text-center">
          Biserica Bartolomeu.
        </h1>
        <p className="mt-4 text-sm text-gray-500 italic text-center leading-relaxed px-4">
          „Lăudați pe Domnul, chemați Numele Lui." — Psalm 105:1
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
              Prenume
            </label>
            <input
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Anastasia"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
              Nume
            </label>
            <input
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Drăgan"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="numele.tau@email.ro"
            required
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold tracking-widest text-gray-500 uppercase mb-1.5">
            Parolă
          </label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Minim 6 caractere"
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
          {loading ? "Se creează contul..." : "Creează cont"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Ai deja cont?{" "}
        <Link href="/login" className="text-gray-700 font-semibold hover:underline">
          Conectează-te
        </Link>
      </p>
    </div>
  )
}
