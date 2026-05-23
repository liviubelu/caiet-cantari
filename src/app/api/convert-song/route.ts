import { GoogleGenAI } from "@google/genai"
import { type NextRequest } from "next/server"
import { getSession } from "@/lib/session"
import { canEditSongs } from "@/auth"

export const maxDuration = 120 // seconds — requires Vercel Pro; Hobby is capped at 60s

// Each song = 1 (section detect) + N (sections) calls, typically 5-7 total
const FREE_LIMIT = 200 // conservative: 1500 API calls / ~7 calls per song

// ─── Types ──────────────────────────────────────────────────────────────────
interface SectionInfo {
  type: "verse" | "chorus" | "bridge" | "intro" | "coda" | "pre-chorus" | "outro"
  order: number            // 1, 2, 3 … (which verse/chorus number)
  topPct: number           // 0–100: vertical start % of image
  bottomPct: number        // 0–100: vertical end % of image
  leftPct: number          // 0–100: horizontal start % (for 2-column layouts)
  rightPct: number         // 0–100: horizontal end %
  firstWords: string       // first 3 words of lyrics (anchor)
  lastWords: string        // last 3 words of lyrics (anchor)
}

// ─── Step 1: Section detection ───────────────────────────────────────────────
const STEP1_SYSTEM = `You are a music sheet layout analyzer.
Your only job is to identify the sections of a Romanian church song and their visual positions in the image.`

const STEP1_PROMPT = `Analyze the layout of this song sheet image.

Identify every section: verses (strofe), choruses (refrene), bridges, intros, codas.

For each section return:
- type: "verse" | "chorus" | "bridge" | "intro" | "coda" | "pre-chorus" | "outro"
- order: which number (1st verse = 1, 2nd verse = 2, etc.; all choruses share order 1)
- topPct / bottomPct: vertical position as % of total image height (0 = top, 100 = bottom)
- leftPct / rightPct: horizontal position as % of total image width (0 = left, 100 = right)
  → If the song has a SINGLE COLUMN: leftPct=0, rightPct=100 for all
  → If the song has TWO COLUMNS: left column sections have rightPct≈50, right column sections have leftPct≈50
- firstWords: exact first 3 words of the lyrics in this section
- lastWords: exact last 3 words of the lyrics in this section

Return sections in MUSICAL ORDER (the order a singer would perform them):
  verse 1 → chorus → verse 2 → chorus → verse 3 → chorus → coda, etc.
Do NOT return them in page-layout order (left column top-to-bottom, right column top-to-bottom).

Return ONLY a valid JSON array, no markdown, no explanation:
[{"type":"verse","order":1,"topPct":5,"bottomPct":38,"leftPct":0,"rightPct":50,"firstWords":"Nădejdea noastră Cine","lastWords":"toată dragostea"},...]

Also include outside the array on a new line:
TITLE: [song title without number prefix]
KEY: [main key in standard notation, e.g. D, Am, F#m]`

// ─── Step 2: Per-section chord analysis ──────────────────────────────────────
const STEP2_SYSTEM = `You are a precise ChordPro converter for Romanian church songs.
You analyze ONE specific section of a song sheet and convert it to ChordPro format.`

function buildSectionPrompt(s: SectionInfo): string {
  const sectionName = s.type === "verse" ? `Verse ${s.order}` :
    s.type === "chorus" ? "Chorus" :
    s.type === "bridge" ? "Bridge" :
    s.type === "intro" ? "Intro" :
    s.type === "coda" ? "Coda" : s.type

  return `Focus ONLY on the "${sectionName}" section of this song sheet image.

This section is located at:
  - Vertically: from ${s.topPct}% to ${s.bottomPct}% of image height
  - Horizontally: from ${s.leftPct}% to ${s.rightPct}% of image width
  - It starts with the words: "${s.firstWords}"
  - It ends with the words: "${s.lastWords}"

Ignore everything outside this region completely.

For every chord+lyric pair WITHIN this section, use the VERTICAL DROP METHOD:
  → Drop a vertical line from the CENTER of each chord name straight down to the lyric
  → The letter the line touches = where you insert [Chord]
  → Insert [Chord] immediately BEFORE that letter, no space between ] and the letter

RULES:
- NEVER add hyphens to words. If chord lands mid-word, insert inline without hyphen: mul[C#m]țumim ✓, mul-[C#m]țumim ✗
- Preserve all Romanian diacritics: ă â î ș ț Ș Ț Ă Â Î
- Do NOT include a section marker ({verse}/{chorus}/etc.) — just the lyrics with chords

Return ONLY the ChordPro lines for this section as plain text (no JSON, no markdown).
Example output:
[D]Nădejdea [G]noastră [D]Cine e?
Doar [Bm]Cristos. Doar [A]Cristos.
[D]Și sin[F#m]gura [Bm]încredere?`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sectionMarker(type: SectionInfo["type"]): string {
  const map: Record<SectionInfo["type"], string> = {
    verse: "verse", chorus: "chorus", bridge: "bridge",
    intro: "intro", coda: "coda", "pre-chorus": "bridge", outro: "outro",
  }
  return `{${map[type] ?? type}}`
}

function normalizeKey(key: string): string {
  if (!key) return ""
  if (/^[A-G][b#]?m?$/.test(key)) return key
  if (/^[a-g][b#]?$/.test(key)) return key.toUpperCase() + "m"
  return key
}

function extractSections(text: string): SectionInfo[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []
  return JSON.parse(jsonMatch[0]) as SectionInfo[]
}

function extractMeta(text: string): { title: string; key: string } {
  const titleMatch = text.match(/^TITLE:\s*(.+)$/m)
  const keyMatch = text.match(/^KEY:\s*(.+)$/m)
  return {
    title: titleMatch?.[1]?.trim() ?? "",
    key: keyMatch?.[1]?.trim() ?? "",
  }
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

  // ── Step 1: Detect sections ──────────────────────────────────────────────
  let sections: SectionInfo[]
  let title = ""
  let key = ""

  try {
    const step1 = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: STEP1_SYSTEM,
        thinkingConfig: { thinkingBudget: 8192 },
        temperature: 0,
      },
      contents: [{ role: "user", parts: [imagepart, { text: STEP1_PROMPT }] }],
    })
    const raw = step1.text ?? ""
    sections = extractSections(raw)
    const meta = extractMeta(raw)
    title = meta.title
    key = meta.key

    if (sections.length === 0) {
      // Fallback: treat entire image as one section
      sections = [{
        type: "verse", order: 1,
        topPct: 0, bottomPct: 100, leftPct: 0, rightPct: 100,
        firstWords: "", lastWords: "",
      }]
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("429") || msg.toLowerCase().includes("quota"))
      return Response.json({ error: `⚠️ Limita gratuită Gemini a fost atinsă (${FREE_LIMIT}/zi). Încearcă mâine.`, rateLimited: true }, { status: 429 })
    return Response.json({ error: `Eroare la detectarea secțiunilor: ${msg}` }, { status: 500 })
  }

  // ── Step 2: Analyze each section in parallel ─────────────────────────────
  const sectionChordPros = await Promise.all(
    sections.map(async (section) => {
      try {
        const step2 = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          config: {
            systemInstruction: STEP2_SYSTEM,
            thinkingConfig: { thinkingBudget: 24576 },
            temperature: 0,
          },
          contents: [{
            role: "user",
            parts: [imagepart, { text: buildSectionPrompt(section) }],
          }],
        })
        return { section, content: (step2.text ?? "").trim() }
      } catch {
        return { section, content: `(eroare la secțiunea ${section.type} ${section.order})` }
      }
    })
  )

  // ── Step 3: Assemble ──────────────────────────────────────────────────────
  const chordproLines: string[] = []
  for (const { section, content } of sectionChordPros) {
    if (chordproLines.length > 0) chordproLines.push("")
    chordproLines.push(sectionMarker(section.type))
    chordproLines.push(content)
  }

  return Response.json({
    title,
    defaultKey: normalizeKey(key),
    content: chordproLines.join("\n"),
    freeLimit: FREE_LIMIT,
  })
}
