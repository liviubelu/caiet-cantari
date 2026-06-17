import { pgTable, text, timestamp, uuid, unique, boolean, integer } from "drizzle-orm/pg-core"

export type UserRole = "admin" | "instrumentist" | "user"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").defaultNow(),
})

export const verificationTokens = pgTable("verification_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const songs = pgTable("songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  firstLine: text("first_line"),
  content: text("content").notNull(),
  category: text("category"),
  defaultKey: text("default_key"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  hasChords: boolean("has_chords").notNull().default(false),
  // JSON array of section ids (e.g. ["verse-1","chorus-1","verse-2"]) describing
  // the custom singing order. null/empty = natural order (sections as written).
  singingOrder: text("singing_order"),
})

// Per-user cooldown timestamps for self-service requests (anti-spam).
export const requestCooldowns = pgTable("request_cooldowns", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  instrumentistAt: timestamp("instrumentist_at"),
})

export const passwordResetTokens = pgTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
})

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  songId: uuid("song_id")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [unique().on(t.userId, t.songId)])

// ── Service planning ──────────────────────────────────────────────────────────

/** One record per event (multiple events per day allowed). */
export const servicePlans = pgTable("service_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: text("date").notNull(), // "YYYY-MM-DD" — no longer unique (multiple events/day)
  eventType: text("event_type").notNull().default("slujba"), // slujba|nunta|binecuvantare|priveghi|inmormantare
  notesMorning: text("notes_morning").default(""),
  notesEvening: text("notes_evening").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
})

/** Song linked to a service plan (morning or evening slot). */
export const servicePlanSongs = pgTable("service_plan_songs", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => servicePlans.id, { onDelete: "cascade" }),
  songId: uuid("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // "morning" | "evening"
  position: integer("position").notNull().default(0),
  key: text("key"), // auto-filled from song.defaultKey
  sung: boolean("sung").notNull().default(false), // marked as sung during service
})

/** Person serving at a service (free text name or from user list). */
export const servicePlanPeople = pgTable("service_plan_people", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => servicePlans.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
})
