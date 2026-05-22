export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "./SignOutButton"

export default async function ContPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = session.user
  const initials = user.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div>
      <div className="px-4 pt-12 pb-4">
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
          <div>
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-50">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-0.5">
              Aplicație
            </p>
            <p className="text-sm font-semibold text-gray-900">Caiet de Cântări</p>
          </div>
          <div className="px-4 py-3.5 border-b border-gray-50">
            <p className="text-xs text-gray-400">Versiune</p>
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
