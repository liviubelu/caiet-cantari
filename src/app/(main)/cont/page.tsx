export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "./SignOutButton"
import { PwaInstallButton } from "@/components/PwaInstallButton"
import Link from "next/link"

const ROLE_LABELS: Record<string, string> = {
  admin:         "Administrator",
  instrumentist: "Instrumentist",
  user:          "Utilizator",
}

export default async function ContPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = session.user
  const role = user.role ?? "user"
  const initials = user.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="lg:max-w-xl lg:mx-auto">
      <div className="px-4 pt-12 lg:pt-6 pb-4">
        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
          Profil
        </p>
        <h1 className="text-[28px] font-display font-bold text-gray-900">Contul meu</h1>
      </div>

      <div className="px-4 space-y-3">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-700">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-400 truncate">{user.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              role === "admin"         ? "bg-indigo-100 text-indigo-700" :
              role === "instrumentist" ? "bg-amber-100 text-amber-700" :
                                         "bg-gray-100 text-gray-600"
            }`}>
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </div>

        {role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5 hover:bg-indigo-100 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-700 rounded-xl flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Administrare utilizatori</p>
                <p className="text-xs text-indigo-500">Gestionează roluri</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}

        {/* PWA Install */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Instalează aplicația</p>
              <p className="text-xs text-gray-400 mt-0.5">Acces rapid de pe ecranul principal</p>
            </div>
            <PwaInstallButton className="bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-indigo-600 transition" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50">
            <p className="text-xs text-gray-400">Versiune aplicație</p>
            <p className="text-sm text-gray-700">1.0.0</p>
          </div>
          <div className="px-4 py-3.5">
            <p className="text-xs text-gray-400">Biserica</p>
            <p className="text-sm text-gray-700">Bartolomeu</p>
          </div>
        </div>

        <SignOutButton />
      </div>
    </div>
  )
}
