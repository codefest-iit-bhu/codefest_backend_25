import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { createReferral, getMyReferrals, getWinzoLeaderboard, updateReferralName, updateWinzoPoints } from "../controllers/winzo.js";

const router = express.Router();

router.route("/referrals").post(isAuthenticated, createReferral).get(isAuthenticated, getMyReferrals);
router.patch("/referral/:id", isAuthenticated, updateReferralName);
router.patch("/points", isAuthenticated, updateWinzoPoints);
router.get("/leaderboard", isAuthenticated, getWinzoLeaderboard);

export default router;
