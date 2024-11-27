import express from 'express';
import authRouter from './routes/auth.js';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import { createGoogleUser, googleCallback } from './controllers/auth.js';
import { backendUrl, frontendUrl } from './config/constants.js';
import teamRouter from './routes/team.js';
import memberRouter from './routes/members.js';
import caRouter from './routes/ca.js';
import eventRouter from './routes/events.js';
import userRouter from './routes/user.js';

export const app = express();

config();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.LOCAL_FRONTEND_URL, process.env.FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })
);

app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/Oauth2/google/callback`,
      scope: ['profile', 'email'],
    },
    async function (accessToken, refreshToken, profile, cb) {
      return createGoogleUser(accessToken, refreshToken, profile, cb);
    }
  )
);

app.get(
  '/Oauth2/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/Oauth2/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${frontendUrl}/`,
    session: false,
  }),
  async (req, res, next) => {
    googleCallback(req.user, req, res, next);
  }
);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/team', teamRouter);
app.use('/api/v1/member', memberRouter);
app.use('/api/v1/ca', caRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/event', eventRouter);

app.get('/', (req, res) => {
  res.send('Server is working');
});

app.get('/failure', (req, res) => {
  res.send('Failed to Login');
});

app.use(errorMiddleware);
