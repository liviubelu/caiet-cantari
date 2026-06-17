"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { ChurchIcon } from "@/components/ChurchIcon"
import { PwaInstallButton } from "@/components/PwaInstallButton"

export type SidebarUser = {
  name?: string | null
  role?: string | null
}

function canEdit(role?: string | null) {
  return role === "admin" || role === "instrumentist"
}

const navItems = [
  {
    href: "/",
    label: "Acasă",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
      </svg>
    ),
  },
  {
    href: "/favorite",
    label: "Favorite",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.85 : 0} />
      </svg>
    ),
  },
  {
    href: "/colectii",
    label: "Colecții",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      </svg>
    ),
  },
  {
    href: "/planificare",
    label: "Planificare",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    instrumentistOnly: true,
  },
  {
    href: "/statistici",
    label: "Statistici",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 3v16a2 2 0 002 2h16" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" />
        <rect x="7" y="11" width="3" height="6" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <rect x="12.5" y="7" width="3" height="10" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <rect x="18" y="9" width="3" height="8" rx="1" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
      </svg>
    ),
    instrumentistOnly: true,
  },
  {
    href: "/cont",
    label: "Cont",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.12 : 0} />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
]

export function Sidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname()
  // Live client-side session so role changes (login / admin promote) reflect
  // immediately without a full page reload.
  const { data: session } = useSession()
  const liveRole = (session?.user as { role?: string } | undefined)?.role ?? user?.role

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : null

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white dark:lg:bg-gray-900 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-gray-700">
        <div className="w-9 h-9 bg-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <ChurchIcon size={16} />
        </div>
        <div>
          <p className="text-[9px] font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase leading-none">
            Biserica
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">Bartolomeu</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems
          .filter((item) => !("instrumentistOnly" in item) || canEdit(liveRole))
          .map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            )
          })}

        <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />

        {canEdit(liveRole) && (
          <Link
            href="/adauga"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/adauga"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Adaugă melodie
          </Link>
        )}

        {user?.role === "admin" && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname === "/admin"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            Admin
          </Link>
        )}
      </nav>

      {/* Install button */}
      <div className="px-4 pb-3">
        <PwaInstallButton className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition" />
      </div>

      {/* User section */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700">
        {user ? (
          <Link
            href="/cont"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 flex-shrink-0">
              {initials ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{user.name ?? "Cont"}</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize leading-tight mt-0.5">
                {user.role === "admin" ? "Administrator" : user.role === "instrumentist" ? "Instrumentist" : "Utilizator"}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-300 group-hover:text-gray-500 flex-shrink-0">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Conectează-te
          </Link>
        )}
      </div>
    </aside>
  )
}
