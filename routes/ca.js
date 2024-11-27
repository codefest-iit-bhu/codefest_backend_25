import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  getAllRequests,
  getMyRequest,
  register,
  updateRequest,
} from "../controllers/ca.js";

const router = express.Router();

router.post("/", isAuthenticated, register);
router.get("/my", isAuthenticated, getMyRequest);
router.patch("/:id", isAuthenticated, updateRequest);
router.get("/all", isAuthenticated, getAllRequests);

export default router;
