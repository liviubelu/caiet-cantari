import { Resend } from "resend"
import { ADMIN_EMAIL } from "@/auth"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? "Caiet de Cântări <onboarding@resend.dev>"
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

/** Escape user-supplied text before embedding it in the email HTML. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  )
}

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${APP_URL}/verify?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirmă-ți contul — Caiet de Cântări",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#4338ca;border-radius:12px;padding:12px 16px">
            <span style="color:white;font-size:20px;font-weight:bold">✝</span>
          </div>
          <h1 style="margin:16px 0 4px;font-size:22px;color:#111827">Caiet de Cântări</h1>
          <p style="margin:0;color:#6b7280;font-size:13px">Biserica Bartolomeu</p>
        </div>

        <h2 style="font-size:18px;color:#111827;margin-bottom:8px">Bun venit!</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px">
          Ai solicitat crearea unui cont pentru <strong>${email}</strong>.
          Apasă butonul de mai jos pentru a-ți confirma adresa și a finaliza înregistrarea.
        </p>

        <a href="${url}"
          style="display:block;background:#111827;color:white;text-decoration:none;
                 padding:14px 24px;border-radius:12px;text-align:center;
                 font-weight:600;font-size:14px;margin-bottom:16px">
          Confirmă contul
        </a>

        <p style="color:#9ca3af;font-size:12px;text-align:center">
          Link-ul expiră în <strong>24 de ore</strong>.<br/>
          Dacă nu ai solicitat un cont, ignoră acest email.
        </p>
      </div>
    `,
  })

  if (error) throw new Error(error.message)
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Resetare parolă — Caiet de Cântări",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#4338ca;border-radius:12px;padding:12px 16px">
            <span style="color:white;font-size:20px;font-weight:bold">✝</span>
          </div>
          <h1 style="margin:16px 0 4px;font-size:22px;color:#111827">Caiet de Cântări</h1>
          <p style="margin:0;color:#6b7280;font-size:13px">Biserica Bartolomeu</p>
        </div>

        <h2 style="font-size:18px;color:#111827;margin-bottom:8px">Resetare parolă</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin-bottom:24px">
          Ai solicitat resetarea parolei pentru <strong>${email}</strong>.
          Apasă butonul de mai jos pentru a seta o parolă nouă.
        </p>

        <a href="${url}"
          style="display:block;background:#111827;color:white;text-decoration:none;
                 padding:14px 24px;border-radius:12px;text-align:center;
                 font-weight:600;font-size:14px;margin-bottom:16px">
          Resetează parola
        </a>

        <p style="color:#9ca3af;font-size:12px;text-align:center">
          Link-ul expiră în <strong>1 oră</strong>.<br/>
          Dacă nu ai solicitat resetarea, ignoră acest email.
        </p>
      </div>
    `,
  })

  if (error) throw new Error(error.message)
}

// ── Admin notifications (requests from normal users) ────────────────────────

function adminShell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
      <div style="text-align:center;margin-bottom:28px">
        <div style="display:inline-block;background:#4338ca;border-radius:12px;padding:12px 16px">
          <span style="color:white;font-size:20px;font-weight:bold">✝</span>
        </div>
        <h1 style="margin:16px 0 4px;font-size:22px;color:#111827">Caiet de Cântări</h1>
        <p style="margin:0;color:#6b7280;font-size:13px">Biserica Bartolomeu</p>
      </div>
      <h2 style="font-size:18px;color:#111827;margin-bottom:14px">${heading}</h2>
      ${bodyHtml}
    </div>
  `
}

function rowsTable(rows: Array<[string, string]>): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 10px 6px 0;color:#6b7280;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#111827">${v}</td></tr>`
      )
      .join("")}
  </table>`
}

/** A normal user asks to be upgraded to an "instrumentist" account. */
export async function sendInstrumentistRequestEmail(req: { name: string; email: string }) {
  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: req.email || undefined,
    subject: `Cerere cont instrumentist — ${req.name}`,
    html: adminShell(
      "Cerere cont de instrumentist",
      `<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px">
         Un utilizator a cerut acces de <strong>instrumentist</strong> (poate adăuga și edita melodii).
       </p>
       ${rowsTable([
         ["Nume", esc(req.name)],
         ["Email", esc(req.email)],
       ])}
       <a href="${APP_URL}/admin"
         style="display:inline-block;margin-top:20px;background:#111827;color:white;text-decoration:none;
                padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px">
         Schimbă rolul în Admin
       </a>`
    ),
  })

  if (error) throw new Error(error.message)
}

/** A normal user requests a song that's not yet in the songbook. */
export async function sendSongRequestEmail(req: {
  name: string
  email: string
  title: string
  link?: string
  notes?: string
}) {
  const safeLink =
    req.link && /^https?:\/\//i.test(req.link)
      ? `<a href="${esc(req.link)}" style="color:#4338ca">${esc(req.link)}</a>`
      : req.link
        ? esc(req.link)
        : null

  const rows: Array<[string, string]> = [["Melodie", esc(req.title)]]
  if (safeLink) rows.push(["Link versuri", safeLink])
  if (req.notes) rows.push(["Observații", esc(req.notes).replace(/\n/g, "<br/>")])
  rows.push(["Cerut de", `${esc(req.name)} &lt;${esc(req.email)}&gt;`])

  const { error } = await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: req.email || undefined,
    subject: `Cerere melodie: ${req.title}`,
    html: adminShell(
      "Cerere de adăugare melodie",
      `<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px">
         Un utilizator vrea ca această melodie să fie adăugată în caiet:
       </p>
       ${rowsTable(rows)}`
    ),
  })

  if (error) throw new Error(error.message)
}
