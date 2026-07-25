// Single source of truth for the role vocabulary + permission checks.
// This module is pure (no server-only imports) so BOTH client components and
// server code can import it. The master account is identified by EMAIL
// (see `isMaster` in src/auth.ts) and is stored with role "admin", so the
// role-based helpers below already grant it everything an admin can do.

export type UserRole =
  | "admin"
  | "instrumentist_plus"
  | "instrumentist"
  | "user_plus"
  | "user"

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  instrumentist_plus: "Instrumentist+",
  instrumentist: "Instrumentist",
  user_plus: "Utilizator+",
  user: "Utilizator",
}

// Roles shown (highest → lowest) in the user-management dropdown.
export const ASSIGNABLE_ROLES: UserRole[] = [
  "admin",
  "instrumentist_plus",
  "instrumentist",
  "user_plus",
  "user",
]

export function roleLabel(role?: string | null): string {
  return (role && ROLE_LABELS[role]) || "Utilizator"
}

// Badge tint per role (used on the account page + user-management list).
export const ROLE_BADGE_CLASS: Record<string, string> = {
  admin: "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400",
  instrumentist_plus: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  instrumentist: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  user_plus: "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400",
  user: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
}

export function roleBadgeClass(role?: string | null): string {
  return (role && ROLE_BADGE_CLASS[role]) || ROLE_BADGE_CLASS.user
}

// The master account (by email) is shown distinctly.
export const MASTER_LABEL = "Master"
export const MASTER_BADGE_CLASS = "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400"

/** Add / edit songs in the library. */
export function canEditSongs(role?: string | null): boolean {
  return role === "admin" || role === "instrumentist_plus"
}

/** View AND edit the planning (programs, teams) + see statistics. */
export function canPlan(role?: string | null): boolean {
  return role === "admin" || role === "instrumentist_plus" || role === "instrumentist"
}

/** Post announcements (which fan out as push notifications to everyone). */
export function canPostAnnouncements(role?: string | null): boolean {
  return role === "admin" || role === "user_plus"
}

/** Open the user-management area. Admins manage everyone below admin; only the
 *  master (checked separately by email) may promote/demote admins. */
export function canManageUsers(role?: string | null): boolean {
  return role === "admin"
}
