/**
 * One-time role migration for the 6-role overhaul.
 *
 * - Existing "instrumentist" accounts had song-edit rights, so they map to the
 *   new "instrumentist_plus" (song-edit + planning). You can later demote any of
 *   them to plain "instrumentist" (planning only) from the admin page.
 * - Ensures the master account (liviu_belu@yahoo.com) has role "admin" so the
 *   role-based helpers grant it everything (master is also protected by email).
 *
 * No schema change is needed (role is a free-text column). Run once against prod:
 *   node scripts/migrate-roles.mjs
 */

import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"

const MASTER_EMAIL = "liviu_belu@yahoo.com"

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
const dbUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!dbUrl) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const sql = neon(dbUrl)

console.log("Migrating roles…")

const promoted = await sql`
  UPDATE users SET role = 'instrumentist_plus' WHERE role = 'instrumentist'
`
console.log(`instrumentist → instrumentist_plus: ${promoted.count ?? "?"} rows`)

const master = await sql`
  UPDATE users SET role = 'admin' WHERE lower(email) = ${MASTER_EMAIL.toLowerCase()} AND role <> 'admin'
`
console.log(`master set to admin: ${master.count ?? 0} rows`)

const counts = await sql`SELECT role, count(*)::int AS n FROM users GROUP BY role ORDER BY role`
console.log("Role distribution now:")
for (const r of counts) console.log(`  ${r.role}: ${r.n}`)

console.log("Done.")
