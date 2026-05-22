"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full bg-white border border-red-100 text-red-500 rounded-2xl py-4 font-semibold text-sm hover:bg-red-50 transition"
    >
      Deconectează-te
    </button>
  )
}
