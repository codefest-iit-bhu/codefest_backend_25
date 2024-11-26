import express from 'express';
import {
  passwordSetter,
  logout,
  signup,
  login,
  profile,
} from '../controllers/auth.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { cookieRefresher } from '../utils/features.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', isAuthenticated, profile);
router.post('/set-password', passwordSetter);
router.get('/logout', logout);

export default router;
