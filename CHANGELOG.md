# Caiet de Cântări — Jurnal de modificări

Aplicație web pentru tineretul Bisericii Bartolomeu.  
Stack: Next.js 16, TypeScript, Tailwind CSS v4, Drizzle ORM, Neon DB, NextAuth v5, Resend.

---

## Funcționalități implementate

### 🎵 Core — Melodii
- Bază de date melodii cu format **ChordPro** (`[C]text [G]text`, `{verse}`, `{chorus}` etc.)
- **Transposer** dropdown — schimbă tonalitatea cu orice număr de semitonuri
- **Toggle Acorduri/Versuri** — afișează doar versurile fără acorduri
- **Butoane A− / A+** — mărește/micșorează fontul (range 11–23px, salvat în localStorage)
- **2 coloane pe desktop** — buton toggle pentru afișare în două coloane (ideal la cântat live); split inteligent la granița secțiunilor

### ✏️ Editor melodii
- Formular cu editor ChordPro + **preview live** în timp real
- **Toolbar acorduri diatonice** — după selectarea gamei, apar cele 7 acorduri din acea gamă ca scurtături
- **Scurtături secțiuni**: Strofa, Refren, Prerefren, Coda — inserare la poziția cursorului
- Categorii: Laudă, Cină, Paști, Crăciun, Botez, Nuntă, Înmormântare

### 👤 Autentificare și roluri
- **3 roluri**: `admin`, `instrumentist`, `user`
  - Admin și Instrumentist: pot adăuga și edita melodii
  - User: doar vizualizare și favorite
  - Admin unic: `liviu_belu@yahoo.com`
- **Înregistrare cu email**: token de verificare trimis prin Resend, valabil 24h
- **Login blocat** dacă emailul nu este verificat
- **Resetare parolă**: link prin email, valabil 1 oră (`/forgot-password` → `/reset-password`)

### 🛡️ Panou Admin (`/admin`)
- Listă utilizatori (activi + în așteptare)
- Schimbare rol per utilizator (dropdown)
- **Creare cont direct** — admin poate adăuga utilizatori fără email de verificare (cu parolă temporară)

### 💌 Email (Resend)
- Domeniu verificat: `tineri-bartolomeu.com`
- Sender: `noreply@tineri-bartolomeu.com`
- Template HTML pentru: confirmare cont, resetare parolă

### ❤️ Favorite
- Adaugă/elimină melodii din favorite (autentificat)
- Pagina `/favorite` — melodii grupate pe categorii, statistici

### 📚 Colecții (`/colectii`)
- Melodii grupate după categorie
- Ordine definită (nu alfabetică)

### 🖥️ Responsive design
- **Mobile**: bottom navigation (Acasă, Favorite, Colecții, Cont)
- **Desktop**: sidebar fix stânga cu logo, navigare, buton adaugă melodie, link admin, user info
- Fiecare pagină are propria lățime maximă:
  - Melodie (single col): `max-w-3xl` centrat
  - Melodie (2 col): full width disponibil
  - Liste: `max-w-2xl` centrat
  - Formulare: `max-w-2xl` centrat
  - Cont: `max-w-xl` centrat

### 🌐 Deployment
- **GitHub**: `github.com/liviubelu/caiet-cantari`
- **Vercel**: `caiet-cantari.vercel.app` + domeniu custom
- **Domeniu**: `tineri-bartolomeu.com` (Cloudflare)
- **Bază de date**: Neon PostgreSQL (serverless)

---

## Variabile de mediu necesare

```env
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
AUTH_SECRET=...
NEXTAUTH_URL=https://tineri-bartolomeu.com
RESEND_API_KEY=re_...
RESEND_FROM=Caiet de Cântări <noreply@tineri-bartolomeu.com>
```

---

## Structura bazei de date

| Tabel | Descriere |
|---|---|
| `users` | id, email, first_name, last_name, password_hash, role, email_verified |
| `songs` | id, title, first_line, content (ChordPro), category, default_key |
| `favorites` | user_id → song_id (unique pair) |
| `verification_tokens` | token (PK), email, expires_at (24h) |
| `password_reset_tokens` | token (PK), email, expires_at (1h) |

---

## Rute principale

| Rută | Descriere |
|---|---|
| `/` | Lista tuturor melodiilor + căutare |
| `/song/[id]` | Detaliu melodie cu transposer, A±, 2 coloane |
| `/song/[id]/edit` | Editare melodie (admin/instrumentist) |
| `/adauga` | Adăugare melodie nouă (admin/instrumentist) |
| `/favorite` | Melodiile favorite ale utilizatorului |
| `/colectii` | Melodii grupate pe categorii |
| `/cont` | Profil utilizator + deconectare |
| `/admin` | Administrare utilizatori (admin) |
| `/login` | Autentificare |
| `/register` | Înregistrare (trimite email verificare) |
| `/verify?token=` | Finalizare creare cont |
| `/forgot-password` | Solicitare resetare parolă |
| `/reset-password?token=` | Setare parolă nouă |
