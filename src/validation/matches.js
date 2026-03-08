import { z } from "zod";

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const MATCH_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
});

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .refine(
    (data) =>
      !isNaN(Date.parse(data.startTime)) && !isNaN(Date.parse(data.endTime)),
    {
      message: "startTime and endTime must be valid ISO date strings",
      path: ["startTime", "endTime"],
    }
  )
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (startDate >= endDate) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be chronologically after startTime",
        path: ["endTime"],
      });
    }
  });

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
