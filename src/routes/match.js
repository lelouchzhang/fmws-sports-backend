import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();
const MAX_LIMIT_QUERY = 100;

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Query",
      details: parsed.error.issues,
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT_QUERY);
  try {
    const data = await db
      .select()
      .from(matches)
      .limit(limit)
      .orderBy(desc(matches.createdAt));
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error When Listing Matches",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload",
      details: parsed.error.issues,
    });
  }
  try {
    const status = getMatchStatus(parsed.data.startTime, parsed.data.endTime);
    if (!status) {
      return res.status(400).json({
        error: "Invalid date values",
        details: "Could not determine match status from provided dates",
      });
    }

    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(parsed.data.startTime),
        endTime: new Date(parsed.data.endTime),
        homeScore: parsed.data.homeScore ?? 0,
        awayScore: parsed.data.awayScore ?? 0,
        status,
      })
      .returning();
    res.status(201).json({ data: event });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error When Creating Match",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
