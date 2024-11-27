import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { deleteUser, getAllUsers, updateUser } from "../controllers/user.js";

const router = express.Router();

router.get("/all", isAuthenticated, getAllUsers);
router
  .route("/")
  .patch(isAuthenticated, updateUser)
  .delete(isAuthenticated, deleteUser);

export default router;
