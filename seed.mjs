import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

const songs = [
  {
    title: "Doamne, Te iubesc",
    firstLine: "Doamne, Te iubesc cu toată inima",
    category: "Închinare",
    defaultKey: "C",
    content: `{verse}
[C]Doamne, Te iu[G]besc cu toată [Am]inima
[C]Doamne, Te iu[G]besc cu tot su[F]fletul
[C]Doamne, Te iu[G]besc cu tot cu[Am]getul
[F]Tu ești viața [G]mea, Tu ești [C]totul

{chorus}
[F]Te laud, [C]Te ador
[G]Tu ești Dom[Am]nul meu
[F]Te laud, [C]Te ador
[G]Isuse, [C]Dumnezeul meu`
  },
  {
    title: "Cât de mare ești",
    firstLine: "Cât de mare ești, Doamne al meu",
    category: "Laudă",
    defaultKey: "G",
    content: `{verse}
[G]Când privesc cerurile, lu[D]crarea mâinilor Tale
[Em]Luna și stelele pe [C]care le-ai întemeiat
[G]Mă-ntreb uimit: ce este [D]omul ca să-l privești
[Em]Și fiul omului [C]ca să-l cer[G]cetezi

{chorus}
[C]Cât de mare ești, [G]Doamne al meu
[D]Cât de mare ești, [Em]cât de sfânt
[C]Cât de mare ești, [G]Te ador
[D]Cât de mare [G]ești`
  },
  {
    title: "Tot ce am aduc",
    firstLine: "Tot ce am aduc acum 'naintea Ta",
    category: "Închinare",
    defaultKey: "D",
    content: `{verse}
[D]Tot ce am aduc a[A]cum 'naintea [Bm]Ta
[G]Inima mea, [D]viața [A]mea
[D]Tot ce sunt și [A]tot ce am să [Bm]fiu
[G]Îți dau Ție, [A]Doamne al [D]meu

{chorus}
[G]Primește-mă a[D]cum
[A]Cum sunt, la pi[Bm]cioarele Tale
[G]Primește-mă a[D]cum
[A]Cu tot ce am și [D]sunt`
  },
  {
    title: "Isuse, dulce nume",
    firstLine: "Isuse, dulce nume, ce-mi luminează calea",
    category: "Închinare",
    defaultKey: "F",
    content: `{verse}
[F]Isuse, dulce [Bb]nume
Ce-mi lumi[C]nează calea
[F]În tine am [Bb]putere
Să merg în [C]fiecare [F]zi

{chorus}
[Bb]Isuse, [F]Isuse
[C]Cel mai dulce [Am]nume
[Bb]Isuse, [F]Isuse
[C]Mântuito[F]rul meu`
  },
  {
    title: "Slăvit să fie Numele",
    firstLine: "Slăvit să fie Numele Tău, Doamne",
    category: "Laudă",
    defaultKey: "D",
    content: `{verse}
[D]Slăvit să fie [A]Numele Tău, [G]Doamne
[D]Slăvit în veci să [A]fie
[G]Pentru tot ce [D]faci, pentru [A]cine ești
[G]Slăvit să fie [D]Numele Tău

{chorus}
[G]Aleluia, [D]aleluia
[A]Slavă Ție, [G]Doamne
[G]Aleluia, [D]aleluia
[A]Slavă Ție în [D]veci`
  },
  {
    title: "Mai sus, mai sus",
    firstLine: "Mai sus, mai sus, tot mai aproape",
    category: "Imnuri",
    defaultKey: "E",
    content: `{verse}
[E]Mai sus, mai sus, tot mai a[A]proape
De Tine, [B]Doamne, vreau să [E]fiu
[E]Mai sus, mai sus, pe ca[A]lea sfântă
Pe care [B]Tu mi-ai dăruit-[E]o

{chorus}
[A]Mai sus, mai sus
[E]Spre Tine, Dum[B]nezeul meu
[A]Mai sus, mai sus
Pe aripile [B]credinței [E]mele`
  },
  {
    title: "Vin la Tine",
    firstLine: "Vin la Tine, Doamne, vin",
    category: "Pocăință",
    defaultKey: "A",
    content: `{verse}
[Am]Vin la Tine, [Em]Doamne, vin
Cu su[F]fletul zdro[C]bit
[Am]Vin cu lacrimi, [Em]vin smerit
Căci [F]mult am gre[E]șit

{chorus}
[Am]Primește-mă, [G]Doamne
Cum [F]sunt, cu tot ce [E]am
[Am]Iartă-mă, [G]Doamne
Și [F]dă-mi un [E]nou în[Am]ceput`
  },
  {
    title: "La cruce",
    firstLine: "La cruce mă plec smerit",
    category: "Pocăință",
    defaultKey: "Em",
    content: `{verse}
[Em]La cruce mă plec sme[D]rit
[C]Doamne, Tu m-ai iu[G]bit
[Em]Sângele Tău vărsat
[C]Păcatul meu a [D]spălat

{chorus}
[G]Sus la cer pri[D]virea
[Em]Văd crucea Ta
[C]Acolo e[G]liberarea
[D]Mântuirea [G]mea`
  },
]

const { pgTable, text, timestamp, uuid } = await import("drizzle-orm/pg-core")

const songsTable = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  firstLine: text("first_line"),
  content: text("content").notNull(),
  category: text("category"),
  defaultKey: text("default_key"),
  createdAt: timestamp("created_at").defaultNow(),
})

async function seed() {
  console.log("Seeding database...")
  for (const song of songs) {
    await db.insert(songsTable).values({
      title: song.title,
      firstLine: song.firstLine,
      content: song.content,
      category: song.category,
      defaultKey: song.defaultKey,
    }).onConflictDoNothing()
    console.log(`✓ ${song.title}`)
  }
  console.log("Done!")
}

seed().catch(console.error)
