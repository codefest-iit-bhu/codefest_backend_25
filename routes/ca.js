import express from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { getAllRequests, getMyRequest, register, updateRequest } from '../controllers/ca';

const router = express.Router();

router.route("/").post(isAuthenticated, register).patch(isAuthenticated, updateRequest)
router.get("/my", isAuthenticated, getMyRequest)
router.get("/all", isAuthenticated, getAllRequests)

export default router;
