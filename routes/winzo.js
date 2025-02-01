import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { createReferral, updateReferralName, updateWinzoPoints } from "../controllers/winzo.js";

const router = express.Router();

router.post("/referral", isAuthenticated, createReferral)
router.patch("/referral/:id", isAuthenticated, updateReferralName);
router.patch("/points", isAuthenticated, updateWinzoPoints);

export default router;
