"use client"

import { useState } from "react"

type User = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  emailVerified: Date | null
  createdAt: Date | null
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin:        { label: "Admin",         color: "bg-indigo-100 text-indigo-700" },
  instrumentist:{ label: "Instrumentist", color: "bg-amber-100 text-amber-700" },
  user:         { label: "Utilizator",    color: "bg-gray-100 text-gray-600" },
}

export function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [userList, setUserList] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)

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
    }
  }

  const verified = userList.filter((u) => u.emailVerified)
  const pending = userList.filter((u) => !u.emailVerified)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",          value: userList.length },
          { label: "Verificați",     value: verified.length },
          { label: "Instrumentiști", value: userList.filter((u) => u.role === "instrumentist").length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Verified users */}
      <div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
          Conturi active
        </p>
        <div className="space-y-2">
          {verified.map((user) => {
            const info = ROLE_LABELS[user.role] ?? ROLE_LABELS.user
            const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "—"
            return (
              <div key={user.id} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {name !== "—" ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${info.color}`}>
                    {info.label}
                  </span>
                  {user.role !== "admin" && (
                    <select
                      value={user.role}
                      disabled={loading === user.id}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-indigo-400 disabled:opacity-50"
                    >
                      <option value="user">Utilizator</option>
                      <option value="instrumentist">Instrumentist</option>
                    </select>
                  )}
                </div>
              </div>
            )
          })}
          {verified.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Niciun utilizator verificat.</p>
          )}
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">
            Verificare în așteptare
          </p>
          <div className="space-y-2">
            {pending.map((user) => (
              <div key={user.id} className="bg-white rounded-xl px-4 py-3 border border-gray-100 flex items-center gap-3 opacity-60">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#9ca3af" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-[10px] text-gray-300">Email neconfirmat</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
