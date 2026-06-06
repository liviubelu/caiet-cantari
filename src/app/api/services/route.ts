import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlans, servicePlanSongs, servicePlanPeople, songs } from "@/lib/schema"
import { eq, and, gte, lte, asc } from "drizzle-orm"

async function enrichPlan(plan: typeof servicePlans.$inferSelect) {
  const [songRows, peopleRows] = await Promise.all([
    db.select({
      id: servicePlanSongs.id,
      planId: servicePlanSongs.planId,
      songId: servicePlanSongs.songId,
      period: servicePlanSongs.period,
      position: servicePlanSongs.position,
      key: servicePlanSongs.key,
      sung: servicePlanSongs.sung,
      title: songs.title,
      defaultKey: songs.defaultKey,
    })
    .from(servicePlanSongs)
    .innerJoin(songs, eq(servicePlanSongs.songId, songs.id))
    .where(eq(servicePlanSongs.planId, plan.id))
    .orderBy(asc(servicePlanSongs.position)),
    db.select().from(servicePlanPeople)
      .where(eq(servicePlanPeople.planId, plan.id))
      .orderBy(asc(servicePlanPeople.position)),
  ])
  return { ...plan, songs: songRows, people: peopleRows }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  if (!month) return NextResponse.json([])
  const [year, mon] = month.split("-")
  const startDate = `${year}-${mon}-01`
  const endDate   = `${year}-${mon}-31`
  const plans = await db.select().from(servicePlans)
    .where(and(gte(servicePlans.date, startDate), lte(servicePlans.date, endDate)))
    .orderBy(asc(servicePlans.date))
  const enriched = await Promise.all(plans.map(enrichPlan))
  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { date, eventType = "slujba" } = await req.json()
  if (!date) return NextResponse.json({ error: "Data este obligatorie." }, { status: 400 })
  const [plan] = await db.insert(servicePlans)
    .values({ date, eventType, createdBy: session.user.id })
    .returning()
  return NextResponse.json({ ...plan, songs: [], people: [] }, { status: 201 })
}
