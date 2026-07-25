import { NextResponse } from "next/server"
import { auth, canPlan } from "@/auth"
import { db } from "@/lib/db"
import { servicePlans, servicePlanSongs, servicePlanPeople, songs } from "@/lib/schema"
import { eq, and, gte, lte, asc, inArray } from "drizzle-orm"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) {
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

  if (plans.length === 0) return NextResponse.json([])

  // Fetch ALL songs + people for the whole month in two batched queries instead
  // of two-per-plan (the old N+1, which was slow over Neon's per-query latency).
  // Constant 3 round-trips regardless of how many events the month has.
  const planIds = plans.map((p) => p.id)
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
    .where(inArray(servicePlanSongs.planId, planIds))
    .orderBy(asc(servicePlanSongs.position)),
    db.select().from(servicePlanPeople)
      .where(inArray(servicePlanPeople.planId, planIds))
      .orderBy(asc(servicePlanPeople.position)),
  ])

  // Group rows by plan (preserves the position ordering above).
  const songsByPlan = new Map<string, typeof songRows>()
  for (const row of songRows) {
    const list = songsByPlan.get(row.planId)
    if (list) list.push(row); else songsByPlan.set(row.planId, [row])
  }
  const peopleByPlan = new Map<string, typeof peopleRows>()
  for (const row of peopleRows) {
    const list = peopleByPlan.get(row.planId)
    if (list) list.push(row); else peopleByPlan.set(row.planId, [row])
  }

  const enriched = plans.map((plan) => ({
    ...plan,
    songs: songsByPlan.get(plan.id) ?? [],
    people: peopleByPlan.get(plan.id) ?? [],
  }))
  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canPlan(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }
  const { date, eventType = "slujba" } = await req.json()
  if (!date) return NextResponse.json({ error: "Data este obligatorie." }, { status: 400 })
  const [plan] = await db.insert(servicePlans)
    .values({ date, eventType, createdBy: session.user.id })
    .returning()
  return NextResponse.json({ ...plan, songs: [], people: [] }, { status: 201 })
}
