"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900 text-red-500 dark:text-red-400 rounded-2xl py-4 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950 transition"
    >
      Deconectează-te
    </button>
  )
}
