import express from 'express';
import {
  passwordSetter,
  logout,
  signup,
  login,
  profile,
  refreshJwt,
  verifyEmail,
} from '../controllers/auth.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', isAuthenticated, profile);
router.post('/set-password', passwordSetter);
router.get('/logout', isAuthenticated, logout);

router.get('/refresh-token', refreshJwt);
router.post('/verify_email', verifyEmail)

export default router;
