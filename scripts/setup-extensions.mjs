/**
 * One-time setup: enable the unaccent PostgreSQL extension on Neon.
 * unaccent() normalises diacritics so that searches like "si" match "și".
 *
 * Run once:  node scripts/setup-extensions.mjs
 */
import { readFileSync } from "fs"
import { neon } from "@neondatabase/serverless"

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
const dbUrl = env.match(/^DATABASE_URL=(.+)$/m)?.[1]?.trim()
if (!dbUrl) { console.error("DATABASE_URL not found"); process.exit(1) }

const sql = neon(dbUrl)
await sql`CREATE EXTENSION IF NOT EXISTS unaccent`
console.log("✓ unaccent extension enabled")
