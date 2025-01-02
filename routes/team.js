import express from "express";
import {
  createTeam,
  deleteTeam,
  changeLeader,
  nameAvailable,
  getMyTeams,
} from "../controllers/team.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", isAuthenticated, createTeam);
router.delete("/", isAuthenticated, deleteTeam);
router.patch("/changeLeader", isAuthenticated, changeLeader);
router.get("/myTeams", isAuthenticated, getMyTeams);
router.post("/name_available", nameAvailable);

export default router;
