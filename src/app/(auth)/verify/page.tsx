"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { ChurchIcon } from "@/components/ChurchIcon"

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

function VerifyForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [form, setForm] = useState({ firstName: "", lastName: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) setError("Link invalid.")
  }, [token])

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
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...form }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? "A apărut o eroare.")
      setLoading(false)
      return
    }
    await signIn("credentials", {
      email: data.email,
      password: form.password,
      redirect: false,
    })
    setLoading(false)
    // replace — the verify page's token is now used; "back" shouldn't return to it
    router.replace("/")
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
          <ChurchIcon size={22} />
        </div>
        <p className="text-[11px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">
          Finalizează înregistrarea
        </p>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 text-center">
          Completează profilul
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="firstName" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
              Prenume
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Anastasia"
              className={INPUT}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="lastName" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
              Nume
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Drăgan"
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
            Parolă
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Minim 6 caractere"
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
          disabled={loading || !token}
          className="w-full bg-gray-900 dark:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? "Se creează contul..." : "Creează cont"}
        </button>
      </form>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-gray-400 dark:text-gray-500">Se încarcă…</div>}>
      <VerifyForm />
    </Suspense>
  )
}
