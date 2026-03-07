CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TABLE "commentary" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"minute" integer NOT NULL,
	"sequence" integer NOT NULL,
	"period" text NOT NULL,
	"event_type" text NOT NULL,
	"actor" text,
	"team" text,
	"message" text NOT NULL,
	"metadata" jsonb,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"sport" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"home_score" integer DEFAULT 0 NOT NULL,
	"away_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "commentary" ADD CONSTRAINT "commentary_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "commentary_match_id_idx" ON "commentary" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "commentary_minute_idx" ON "commentary" USING btree ("minute");--> statement-breakpoint
CREATE INDEX "commentary_sequence_idx" ON "commentary" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_sport_idx" ON "matches" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "matches_start_time_idx" ON "matches" USING btree ("start_time");