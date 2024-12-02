import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { deleteUser, getAllUsers, updateUser } from "../controllers/user.js";
import { profile } from "../controllers/auth.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllUsers);
router
  .route("/:id")
  .patch(isAuthenticated, updateUser)
  .delete(isAuthenticated, deleteUser);
router.get("/me", isAuthenticated, profile);

export default router;
