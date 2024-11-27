import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { generateRefreshToken, saveCookie } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import { frontendUrl } from "../config/constants.js";
import { Session } from "../models/session.js";
import jwt from "jsonwebtoken";
import { generateOTP, sendVerification } from "../utils/sendVerification.js";
import { Verification } from "../models/verification.js";
import validator from "validator";

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!validator.isLength(name, { min: 2, max: 50 })) {
      return next(
        new ErrorHandler("Name must be between 2 and 50 characters", 400)
      );
    }

    if (!validator.isEmail(email)) {
      return next(new ErrorHandler("Invalid Email", 400));
    }

    if (!validator.isLength(password, { min: 8 })) {
      return next(
        new ErrorHandler("Password must be minimum 8 characters", 400)
      );
    }

    let user = await User.findOne({ email });
    if (user) {
      return next(new ErrorHandler("User Already Exist", 404));
    }

    const hashedpswd = await bcrypt.hash(password, 10);

    await sendVerification(email, generateOTP(), name, hashedpswd);
    return res.status(200).json({
      status: "success",
      message: "Email sent for verification",
    });
  } catch (error) {
    next(error);
  }
};

export const createGoogleUser = async (
  accessToken,
  refreshToken,
  profile,
  cb
) => {
  let user = await User.findOne({ email: profile.emails[0].value });

  if (!user) {
    user = await User.create({
      name: profile.displayName,
      email: profile.emails[0].value,
      password: null,
    });
  }
  return cb(null, profile);
};

export const googleCallback = async (user, req, res, next) => {
  try {
    const email = user.emails[0].value;
    let googleUser = await User.findOne({ email }).select("+password");

    if (!googleUser.password)
      res.redirect(`${frontendUrl}/setPassword?email=${email}`);
    else res.redirect(`${frontendUrl}/main?email=${email}`);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid Email!", 404));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid Password!", 404));
    }

    const refreshToken = await generateRefreshToken(user);
    saveCookie(
      user,
      res,
      next,
      200,
      `Welcome Back, ${user.name}`,
      refreshToken
    );
  } catch (error) {
    next(error);
  }
};

export const profile = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

export const passwordSetter = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    if (user.password) {
      return next(new ErrorHandler("Password Already Set", 400));
    }

    const hashedpswd = await bcrypt.hash(password, 10);

    user.password = hashedpswd;
    await user.save();

    const refreshToken = await generateRefreshToken(user);
    saveCookie(user, res, next, 201, "User Created Successfully", refreshToken);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.headers["X-Refresh-Token"];
    if (!refreshToken)
      return next(new ErrorHandler("Please provide refresh token", 404));

    await Session.deleteOne({ user: req.user._id, refreshToken });

    res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()),
        sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
        secure: process.env.NODE_ENV === "development" ? false : true,
      })
      .json({
        success: true,
        message: "Logged Out Successfully",
      });
  } catch (error) {
    next(error);
  }
};

export const refreshJwt = async (req, res, next) => {
  try {
    const refreshToken = req.headers["X-Refresh-Token"];
    if (!refreshToken)
      return next(new ErrorHandler("Please provide refresh token", 404));

    const decoded = jwt.decode(refToken, process.env.JWT_SECRET);
    if (!decoded) return next(new ErrorHandler("Invalid refresh token", 404));

    const session = Session.findOne({ user: decoded._id });
    if (!session) return next(new ErrorHandler("No session found", 404));

    saveCookie(
      user,
      res,
      next,
      200,
      "Token refreshed suuccessfully",
      refreshToken
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const verification = await Verification.findOne({ email });
    if (!verification || verification.code != otp)
      return next(new ErrorHandler("OTP Invalid or Expired", 404));
    const user = await User.create({
      name: verification.name,
      email: verification.email,
      password: verification.password,
    });
    const refreshToken = await generateRefreshToken(user);
    await Verification.deleteOne({ email });
    saveCookie(user, res, next, 201, "User Created Successfully", refreshToken);
  } catch (error) {
    next(error);
  }
};
