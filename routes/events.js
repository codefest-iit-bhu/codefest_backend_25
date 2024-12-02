import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addEvent } from "../controllers/events.js";

const router = express.Router();

router.post("/", isAuthenticated, addEvent);

export default router;
