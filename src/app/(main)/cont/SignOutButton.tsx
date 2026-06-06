"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  async function handleSignOut() {
    // redirect: false prevents NextAuth from doing a server-side HTTP redirect,
    // which on iOS PWA would open Safari instead of staying in the app shell.
    await signOut({ redirect: false })
    // window.location.replace keeps us inside the PWA (no new browser tab/window).
    window.location.replace("/login")
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900 text-red-500 dark:text-red-400 rounded-2xl py-4 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-950 transition"
    >
      Deconectează-te
    </button>
  )
}
