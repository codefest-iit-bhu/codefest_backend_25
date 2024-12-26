import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import ErrorHandler from "./error.js";
import passport from "passport";
import { frontendUrl } from "../config/constants.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Invalid JWT Token",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findOne({ _id: decoded._id });
    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid JWT Token", 401));
  }
};

export const cbMiddleware = (req, res, next) => {
  const state = JSON.parse(req.query.state || "{}");
  const frontend = state.frontendUrl || frontendUrl;
  const referralCode = state.referralCode || "";
  const callBack = passport.authenticate("google", {
    failureRedirect: `${frontend}backend_redirect?error=unknown`,
    session: false,
  });
  req.frontendUrl = frontend;
  req.referralCode = referralCode;
  callBack(req, res, next);
}
