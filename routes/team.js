import express from "express";
import {
  createTeam,
  deleteTeam,
  changeLeader,
  getTeams,
  nameAvailable,
} from "../controllers/team.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create", isAuthenticated, createTeam);
router.delete("/delete", isAuthenticated, deleteTeam);
router.post("/changeLeader", isAuthenticated, changeLeader);
router.get("/myTeams", isAuthenticated, getTeams);
router.get("/name_available", nameAvailable);

export default router;
