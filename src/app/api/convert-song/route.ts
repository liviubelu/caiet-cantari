import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

export const maxDuration = 120 // seconds — requires Vercel Pro; Hobby is capped at 60s

const FREE_LIMIT = 25 // Gemini 2.5 Pro free tier: 25 RPD

// ─── Prompt ──────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precise ChordPro converter for Romanian church songs.
You analyze song sheet images and output the complete song in ChordPro format.`

const MAIN_PROMPT = `Convert this Romanian church song sheet image to ChordPro format.

━━━ CHORD PLACEMENT — VERTICAL DROP METHOD ━━━
For every chord symbol above a lyric line:
1. Find the CENTER of the chord name horizontally
2. Drop a vertical line straight down to the lyric line
3. The letter that line touches = where you insert [Chord]
4. Place [Chord] immediately BEFORE that letter — no space between ] and the letter

✓ CORRECT: mul[C#m]țumim   (chord lands on ț, inserted before it, no hyphen)
✗ WRONG:   mul-[C#m]țumim  (NEVER add hyphens)
✗ WRONG:   [C#m]mulțumim   (chord not at the right position)

━━━ STRICT RULES ━━━
- NEVER split words with hyphens for chord placement
- Preserve ALL Romanian diacritics exactly: ă â î ș ț Ș Ț Ă Â Î
- If a chord falls between two words, place it at the start of the next word
- Keep all original punctuation and spacing

━━━ LAYOUT HANDLING ━━━
- Single column: process top to bottom
- Two columns: identify left and right column sections, then return them in MUSICAL ORDER
  (e.g. verse 1 left column → chorus right column → verse 2 left column → ...)
  NOT in page order (left column top-to-bottom, then right column top-to-bottom)

━━━ OUTPUT FORMAT ━━━
Use these section markers (no label after the marker, chords start on next line):
  {verse}    — for verses (strofe)
  {chorus}   — for choruses (refrene)
  {bridge}   — for bridges
  {intro}    — for intros
  {coda}     — for codas / outros

Blank line between sections. No markdown, no explanation, no JSON.

After the ChordPro content add two lines:
TITLE: [song title, without any leading number]
KEY: [main key, e.g. D, Am, F#m, Bb]

━━━ EXAMPLE OUTPUT ━━━
{verse}
[D]Nădejdea [G]noastră [D]Cine e?
Doar [Bm]Cristos. Doar [A]Cristos.
[D]Și sin[F#m]gura [Bm]încredere?
Doar [A]El. Doar [D]El.

{chorus}
[G]Slavă [D]Ție, [A]Doamne!
[Bm]Slavă [G]Ție [A]mereu.

TITLE: Nădejdea noastră
KEY: D`

// ─── Helpers ─────────────────────────────────────────────────────────────────
function normalizeKey(key: string): string {
  if (!key) return ""
  if (/^[A-G][b#]?m?$/.test(key)) return key
  if (/^[a-g][b#]?$/.test(key)) return key.toUpperCase() + "m"
  return key
}

function parseResponse(raw: string): { content: string; title: string; key: string } {
  const titleMatch = raw.match(/^TITLE:\s*(.+)$/m)
  const keyMatch = raw.match(/^KEY:\s*(.+)$/m)
  const title = titleMatch?.[1]?.trim() ?? ""
  const key = keyMatch?.[1]?.trim() ?? ""

  // Content = everything before the first TITLE: or KEY: line
  const metaStart = raw.search(/^(TITLE:|KEY:)/m)
  const content = (metaStart > 0 ? raw.slice(0, metaStart) : raw).trim()

  return { content, title, key }
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return Response.json({ error: "Nu ai permisiunea să faci asta." }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_AI_KEY
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_AI_KEY nu este configurat. Adaugă-l în variabilele de mediu Vercel." },
      { status: 500 }
    )
  }

  let formData: FormData
  try { formData = await req.formData() }
  catch { return Response.json({ error: "Eroare la citirea fișierului." }, { status: 400 }) }

  const file = formData.get("file") as File | null
  if (!file) return Response.json({ error: "Niciun fișier primit." }, { status: 400 })

  if (file.size > 10 * 1024 * 1024)
    return Response.json({ error: "Fișierul este prea mare (maxim 10MB)." }, { status: 400 })

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
  const mimeType = file.type === "image/jpg" ? "image/jpeg" : file.type
  if (!allowed.includes(mimeType))
    return Response.json({ error: "Format neacceptat. Folosește JPG, PNG, WebP sau PDF." }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")

  const ai = new GoogleGenAI({ apiKey })
  const imagepart = { inlineData: { data: base64, mimeType } }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 32768 },
        temperature: 0,
      },
      contents: [{ role: "user", parts: [imagepart, { text: MAIN_PROMPT }] }],
    })

    const raw = result.text ?? ""
    const { content, title, key } = parseResponse(raw)

    return Response.json({
      title,
      defaultKey: normalizeKey(key),
      content,
      freeLimit: FREE_LIMIT,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("429") || msg.toLowerCase().includes("quota"))
      return Response.json(
        { error: `⚠️ Limita gratuită Gemini 2.5 Pro a fost atinsă (${FREE_LIMIT}/zi). Încearcă mâine.`, rateLimited: true },
        { status: 429 }
      )
    return Response.json({ error: `Eroare la conversia melodiei: ${msg}` }, { status: 500 })
  }
}
