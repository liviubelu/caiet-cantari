"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  {
    href: "/",
    label: "Acasă",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} />
      </svg>
    ),
  },
  {
    href: "/favorite",
    label: "Favorite",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.85 : 0}
        />
      </svg>
    ),
  },
  {
    href: "/colectii",
    label: "Colecții",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="3" width="7" height="7" rx="1"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <rect
          x="14" y="3" width="7" height="7" rx="1"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <rect
          x="3" y="14" width="7" height="7" rx="1"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <rect
          x="14" y="14" width="7" height="7" rx="1"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
      </svg>
    ),
  },
  {
    href: "/cont",
    label: "Cont",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12" cy="8" r="4"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.15 : 0}
        />
        <path
          d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.6}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="w-full bg-white border-t border-gray-200 pb-safe pl-safe pr-safe">
        <div className="flex">
          {tabs.map((tab) => {
            const active = pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {tab.icon(active)}
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
