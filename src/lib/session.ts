import { cache } from "react"
import { auth } from "@/auth"

/**
 * Cached version of auth() — deduplicates JWT decoding within the same
 * React render tree (layout + page share one call per request).
 */
export const getSession = cache(auth)
