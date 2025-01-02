import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addEvent, getEvent, isMember } from "../controllers/events.js";

const router = express.Router();

router.post("/", isAuthenticated, addEvent);
router.get("/is_member/:eventId", isAuthenticated, isMember);
router.get("/:eventId", getEvent);

export default router;
