import express from "express";
import {middleware} from "../../middleware";
import {resetLeaderboard, updateLeaderboard} from "./controller";

const router = express.Router();

router.patch("/update-point-statistics/:id", middleware, updateLeaderboard)
router.post("/reset-leaderboard", middleware, resetLeaderboard);

export default router;