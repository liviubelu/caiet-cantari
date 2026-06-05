import { NextResponse } from "next/server"
import { auth, canEditSongs } from "@/auth"
import { db } from "@/lib/db"
import { servicePlans, servicePlanSongs, servicePlanPeople, songs } from "@/lib/schema"
import { eq, and, gte, lte, asc } from "drizzle-orm"

// ── GET /api/services?month=YYYY-MM ──────────────────────────────────────────

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month") // "YYYY-MM"
  if (!month) return NextResponse.json([], { status: 200 })

  const [year, mon] = month.split("-")
  const startDate = `${year}-${mon}-01`
  const endDate = `${year}-${mon}-31`

  const plans = await db
    .select()
    .from(servicePlans)
    .where(and(gte(servicePlans.date, startDate), lte(servicePlans.date, endDate)))
    .orderBy(asc(servicePlans.date))

  if (plans.length === 0) return NextResponse.json([])

  const planIds = plans.map((p) => p.id)

  // Fetch songs for all plans in one query
  const songRows = await Promise.all(
    planIds.map((planId) =>
      db
        .select({
          id: servicePlanSongs.id,
          planId: servicePlanSongs.planId,
          songId: servicePlanSongs.songId,
          period: servicePlanSongs.period,
          position: servicePlanSongs.position,
          key: servicePlanSongs.key,
          title: songs.title,
          defaultKey: songs.defaultKey,
        })
        .from(servicePlanSongs)
        .innerJoin(songs, eq(servicePlanSongs.songId, songs.id))
        .where(eq(servicePlanSongs.planId, planId))
        .orderBy(asc(servicePlanSongs.position))
    )
  )

  // Fetch people for all plans
  const peopleRows = await Promise.all(
    planIds.map((planId) =>
      db
        .select()
        .from(servicePlanPeople)
        .where(eq(servicePlanPeople.planId, planId))
        .orderBy(asc(servicePlanPeople.position))
    )
  )

  const result = plans.map((plan, i) => ({
    ...plan,
    songs: songRows[i],
    people: peopleRows[i],
  }))

  return NextResponse.json(result)
}

// ── POST /api/services  { date: "YYYY-MM-DD" } ────────────────────────────────
// Creates a service plan for the given date if it doesn't exist, then returns it.

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || !canEditSongs(session.user.role)) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 })
  }

  const { date } = await req.json()
  if (!date) return NextResponse.json({ error: "Data este obligatorie." }, { status: 400 })

  // Upsert: find existing or create new
  let [plan] = await db
    .select()
    .from(servicePlans)
    .where(eq(servicePlans.date, date))
    .limit(1)

  if (!plan) {
    ;[plan] = await db
      .insert(servicePlans)
      .values({ date, createdBy: session.user.id })
      .returning()
  }

  // Return full service with songs + people
  const [songRows, peopleRows] = await Promise.all([
    db
      .select({
        id: servicePlanSongs.id,
        planId: servicePlanSongs.planId,
        songId: servicePlanSongs.songId,
        period: servicePlanSongs.period,
        position: servicePlanSongs.position,
        key: servicePlanSongs.key,
        title: songs.title,
        defaultKey: songs.defaultKey,
      })
      .from(servicePlanSongs)
      .innerJoin(songs, eq(servicePlanSongs.songId, songs.id))
      .where(eq(servicePlanSongs.planId, plan.id))
      .orderBy(asc(servicePlanSongs.position)),
    db
      .select()
      .from(servicePlanPeople)
      .where(eq(servicePlanPeople.planId, plan.id))
      .orderBy(asc(servicePlanPeople.position)),
  ])

  return NextResponse.json({ ...plan, songs: songRows, people: peopleRows })
}
