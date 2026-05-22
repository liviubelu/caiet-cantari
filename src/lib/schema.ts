import { pgTable, text, timestamp, uuid, unique } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  passwordHash: text("password_hash"),
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
