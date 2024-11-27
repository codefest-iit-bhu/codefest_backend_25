import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import {
  getAllRequests,
  getMyRequest,
  register,
  updateRequest,
} from '../controllers/ca.js';

const router = express.Router();

router
  .route('/')
  .post(isAuthenticated, register)
  .patch(isAuthenticated, updateRequest);
router.get('/my', isAuthenticated, getMyRequest);
router.get('/all', isAuthenticated, getAllRequests);

export default router;
