import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Define the match_status enum
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

// Define the 'matches' table
export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("matches_status_idx").on(table.status),
    sportIdx: index("matches_sport_idx").on(table.sport),
    startTimeIdx: index("matches_start_time_idx").on(table.startTime),
  })
);

// Define the 'commentary' table
export const commentary = pgTable(
  "commentary",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    minute: integer("minute").notNull(),
    sequence: integer("sequence").notNull(),
    period: text("period").notNull(),
    eventType: text("event_type").notNull(),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    matchIdIdx: index("commentary_match_id_idx").on(table.matchId),
    minuteIdx: index("commentary_minute_idx").on(table.minute),
    sequenceIdx: index("commentary_sequence_idx").on(table.sequence),
  })
);

// Export types for type-safe queries
export const Match = matches.$inferSelect;
export const NewMatch = matches.$inferInsert;
export const Commentary = commentary.$inferSelect;
export const NewCommentary = commentary.$inferInsert;

// Todo: 考虑替换索引为符合索引，具体看实际的业务需求。
