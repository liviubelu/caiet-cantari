"use client"

import { useState } from "react"
import {
  ASSIGNABLE_ROLES,
  roleLabel,
  roleBadgeClass,
  MASTER_LABEL,
  MASTER_BADGE_CLASS,
} from "@/lib/roles"

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date | null
  isMaster?: boolean
}

const EMPTY_FORM = { email: "", firstName: "", lastName: "", password: "", role: "user" }

const INPUT = "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition"

export function AdminUsersClient({
  initialUsers,
  currentIsMaster,
}: {
  initialUsers: User[]
  currentIsMaster: boolean
}) {
  const [userList, setUserList] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Admins can assign every role except "admin"; only the master may grant admin.
  const roleOptions = ASSIGNABLE_ROLES.filter((r) => r !== "admin" || currentIsMaster)

  async function changeRole(userId: string, role: string) {
    setLoading(userId)
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    })
    setLoading(null)
    if (res.ok) {
      const updated = await res.json()
      setUserList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)))
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.error ?? "Nu s-a putut schimba rolul.")
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError("")
    setFormLoading(true)
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    let data: User & { error?: string }
    try { data = await res.json() } catch { data = { error: "Eroare necunoscută." } as User & { error: string } }
    setFormLoading(false)
    if (!res.ok) {
      setFormError(data.error ?? "A apărut o eroare.")
      return
    }
    setUserList((prev) => [...prev, data])
    setForm(EMPTY_FORM)
    setShowAddForm(false)
  }

  const verified = userList.filter((u) => u.emailVerified)
  const pending = userList.filter((u) => !u.emailVerified)
  const instrumCount = userList.filter((u) => u.role === "instrumentist" || u.role === "instrumentist_plus").length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",      value: userList.length },
          { label: "Verificați", value: verified.length },
          { label: "Instrum.",   value: instrumCount },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add user button */}
      <button
        onClick={() => { setShowAddForm((v) => !v); setFormError("") }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        {showAddForm ? "Anulează" : "Adaugă utilizator"}
      </button>

      {/* Add user form */}
      {showAddForm && (
        <form onSubmit={addUser} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-1">Cont nou</p>
          <div className="flex gap-2">
            <input
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="Prenume"
              className={INPUT}
            />
            <input
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Nume"
              className={INPUT}
            />
          </div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@exemplu.com"
            required
            className={INPUT}
          />
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Parolă temporară (min. 6 caractere)"
              required
              className={`${INPUT} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPass ? "Ascunde" : "Arată"}
            </button>
          </div>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className={INPUT}
          >
            {roleOptions.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
          {formError && <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>}
          <button
            type="submit"
            disabled={formLoading}
            className="w-full bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-600 transition disabled:opacity-50"
          >
            {formLoading ? "Se creează..." : "Creează cont"}
          </button>
        </form>
      )}

      {/* Verified users */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-2">
          Conturi active
        </p>
        <div className="space-y-2">
          {verified.map((user) => {
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—"
            // Master row is never editable; admin rows only by the master.
            const editable = !user.isMaster && (currentIsMaster || user.role !== "admin")
            return (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 flex-shrink-0">
                  {name !== "—" ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${user.isMaster ? MASTER_BADGE_CLASS : roleBadgeClass(user.role)}`}>
                    {user.isMaster ? MASTER_LABEL : roleLabel(user.role)}
                  </span>
                  {editable && (
                    <select
                      value={user.role}
                      disabled={loading === user.id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-400 disabled:opacity-50"
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
          {verified.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Niciun utilizator verificat.</p>
          )}
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase mb-2">
            Verificare în așteptare
          </p>
          <div className="space-y-2">
            {pending.map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700 flex items-center gap-3 opacity-60">
                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#9ca3af" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                  <p className="text-[10px] text-gray-300 dark:text-gray-600">Email neconfirmat</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
