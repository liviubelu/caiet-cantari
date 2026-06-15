"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"

interface Props {
  songId: string
  initialFavorited: boolean
  onToggle?: (favorited: boolean) => void
}

export function FavoriteButton({ songId, initialFavorited, onToggle }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited)
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const method = favorited ? "DELETE" : "POST"
      const res = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId }),
      })
      if (res.ok) {
        setFavorited(!favorited)
        onToggle?.(!favorited)
        // On the favorites page, drop the card immediately so the list and
        // its stats stay in sync (otherwise an unfavorited song lingers).
        if (pathname === "/favorite") router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="p-1 transition-transform active:scale-90"
      aria-label={favorited ? "Elimină din favorite" : "Adaugă la favorite"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
          stroke={favorited ? "#d97706" : "#9ca3af"}
          strokeWidth="1.8"
          fill={favorited ? "#d97706" : "none"}
        />
      </svg>
    </button>
  )
}
