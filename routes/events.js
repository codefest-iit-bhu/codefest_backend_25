import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addEvent, isMember } from "../controllers/events.js";

const router = express.Router();

router.post("/", isAuthenticated, addEvent);
router.get("/:eventId", isAuthenticated, isMember);

export default router;
