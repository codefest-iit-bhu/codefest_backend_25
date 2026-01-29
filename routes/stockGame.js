import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createGameConfig,
  startGame,
  advanceRound,
  joinGame,
  getGameState,
  buyStock,
  sellStock,
  getLeaderboard,
  getActiveGames,
  getMyGames,
} from "../controllers/stockGame.js";

const router = express.Router();

// Admin routes
router.post("/config", isAuthenticated, createGameConfig);
router.post("/start/:gameId", isAuthenticated, startGame);
router.post("/advance/:gameId", isAuthenticated, advanceRound);

// User routes
router.get("/active", isAuthenticated, getActiveGames);
router.get("/my-games", isAuthenticated, getMyGames);
router.post("/join/:gameId", isAuthenticated, joinGame);
router.get("/state/:gameId", isAuthenticated, getGameState);
router.post("/buy/:gameId", isAuthenticated, buyStock);
router.post("/sell/:gameId", isAuthenticated, sellStock);
router.get("/leaderboard/:gameId", isAuthenticated, getLeaderboard);

export default router;
