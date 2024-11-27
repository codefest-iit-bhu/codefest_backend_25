import express from 'express';
import { joinTeam } from '../controllers/members.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/join', isAuthenticated, joinTeam);

export default router;
