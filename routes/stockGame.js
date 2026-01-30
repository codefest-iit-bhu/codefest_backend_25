import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  createGameConfig,
  startGame,
  advanceRound, // Deprecated but kept for backward compatibility
  endRound,
  startNextRound,
  joinGame,
  getGameState,
  buyStock,
  sellStock,
  getLeaderboard,
  getActiveGames,
  getMyGames,
  getAllGames,
  getGameDetails,
} from "../controllers/stockGame.js";

const router = express.Router();

// Admin routes
router.post("/config", isAuthenticated, createGameConfig);
router.post("/start/:gameId", isAuthenticated, startGame);
router.post("/end-round/:gameId", isAuthenticated, endRound); // NEW: End current round
router.post("/start-next-round/:gameId", isAuthenticated, startNextRound); // NEW: Start next round
router.post("/advance/:gameId", isAuthenticated, advanceRound); // DEPRECATED: Kept for backward compatibility
router.get("/all", isAuthenticated, getAllGames);

// User routes
router.get("/active", isAuthenticated, getActiveGames);
router.get("/my-games", isAuthenticated, getMyGames);
router.get("/details/:gameId", isAuthenticated, getGameDetails);
router.post("/join/:gameId", isAuthenticated, joinGame);
router.get("/state/:gameId", isAuthenticated, getGameState);
router.post("/buy/:gameId", isAuthenticated, buyStock);
router.post("/sell/:gameId", isAuthenticated, sellStock);
router.get("/leaderboard/:gameId", isAuthenticated, getLeaderboard);

export default router;
