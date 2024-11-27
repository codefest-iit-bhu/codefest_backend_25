import express from 'express';
import { joinTeam, getMembers, deleteMember } from '../controllers/members.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/join', isAuthenticated, joinTeam);
router.get('/getMembers', isAuthenticated, getMembers);
router.delete('/', isAuthenticated, deleteMember);

export default router;
