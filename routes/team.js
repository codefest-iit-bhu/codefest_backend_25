import express from 'express';
import { createTeam, isRegistered } from '../controllers/team.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/create', isAuthenticated, createTeam);
router.get('/isRegistered/:eventId', isAuthenticated, isRegistered);

export default router;
