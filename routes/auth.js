import express from "express";
import {
  logout,
  signup,
  login,
  refreshJwt,
  verifyEmail,
  passwordSetter,
} from "../controllers/auth.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify_email", verifyEmail);
router.post("/login", login);
router.delete("/logout", isAuthenticated, logout);
router.get("/refresh-token", refreshJwt);
router.post("/set-password", passwordSetter);

export default router;
