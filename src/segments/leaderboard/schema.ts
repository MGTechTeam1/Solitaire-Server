import {z} from "zod";

export const leaderboardReset = z.object({
    statistics: z.array(z.string())
})

export const leaderboardUpdateEntity = z.object({
    point: z.number().positive()
})