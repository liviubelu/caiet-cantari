"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { ChurchIcon } from "@/components/ChurchIcon"

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

function ResetForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") ?? ""

  const [form, setForm] = useState({ password: "", confirm: "" })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) setError("Link invalid sau expirat.")
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.password.length < 6) {
      setError("Parola trebuie să aibă minim 6 caractere.")
      return
    }
    if (form.password !== form.confirm) {
      setError("Parolele nu coincid.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      })
      let data: { ok?: boolean; email?: string; error?: string } = {}
      try { data = await res.json() } catch { /* ignore */ }
      if (!res.ok) {
        setError(data.error ?? "A apărut o eroare.")
        setLoading(false)
        return
      }
      // Auto sign in with new password
      if (data.email) {
        await signIn("credentials", {
          email: data.email,
          password: form.password,
          redirect: false,
        })
      }
      setSuccess(true)
      setTimeout(() => router.push("/"), 2000)
    } catch {
      setError("A apărut o eroare de rețea.")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">Parolă schimbată!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Te redirecționăm acum…</p>
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
          Parolă nouă
        </p>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 text-center">
          Setează parola
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
            Parolă nouă
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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

        <div>
          <label htmlFor="confirm" className="block text-[11px] font-semibold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-1.5">
            Confirmă parola
          </label>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Repetă parola"
            required
            className={INPUT}
          />
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-gray-900 dark:bg-indigo-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-indigo-600 transition disabled:opacity-50"
        >
          {loading ? "Se salvează..." : "Salvează parola nouă"}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-gray-400 dark:text-gray-500">Se încarcă…</div>}>
      <ResetForm />
    </Suspense>
  )
}
