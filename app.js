import express from "express";
import authRouter from "./routes/auth.js";
import { config } from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import cors from "cors";
import { createGoogleUser, googleCallback } from "./controllers/auth.js";
import { backendUrl, frontendUrl } from "./config/constants.js";
import teamRouter from "./routes/team.js";
import memberRouter from "./routes/members.js";
import caRouter from "./routes/ca.js";
import eventRouter from "./routes/events.js";
import userRouter from "./routes/user.js";
import winzoRouter from "./routes/winzo.js";
import swaggerUi from "swagger-ui-express";
import { loadSwaggerWithDynamicUrl } from "./utils/features.js";
import { cbMiddleware } from "./middlewares/auth.js";

export const app = express();
app.use(cors());

config();

app.use(express.json());

const swaggerDocument = loadSwaggerWithDynamicUrl("./docs/swagger.yaml")

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(passport.initialize());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/v1/Oauth2/google/callback`,
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, cb) {
      return createGoogleUser(accessToken, refreshToken, profile, cb);
    }
  )
);

app.get(
  "/api/v1/Oauth2/google",
  (req, res, next) => {
    const { referralCode } = req.query;
    const frontendUrl = req.headers.referer;
    const state = JSON.stringify({ frontendUrl, referralCode });
    const authUrl = passport.authenticate("google", {
      scope: ["profile", "email"],
      state,
    });

    authUrl(req, res, next);
  }
);

app.get(
  "/api/v1/Oauth2/google/callback",
  cbMiddleware,
  async (req, res, next) => {
    googleCallback(req.user, req, res, next);
  }
);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/team", teamRouter);
app.use("/api/v1/member", memberRouter);
app.use("/api/v1/ca", caRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/event", eventRouter);
app.use("/api/v1/winzo", winzoRouter);

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.get("/failure", (req, res) => {
  res.send("Failed to Login");
});

app.use(errorMiddleware);
