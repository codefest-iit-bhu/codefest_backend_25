import express from 'express';
import { User } from '../models/user.js';
import {
  createNewUser,
  userLogin,
  userProfile,
  passwordSetter,
  logout,
} from '../controllers/user.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { cookieRefresher } from '../utils/features.js';

const router = express.Router();

router.post('/new', createNewUser);
router.post('/login', userLogin);
router.get('/me', isAuthenticated, cookieRefresher, userProfile);
router.post('/set-password', isAuthenticated, passwordSetter);
router.get('/logout', logout);

export default router;
