import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import { generateRefreshToken, sendJwt } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import { Session } from "../models/session.js";
import jwt from "jsonwebtoken";
import { generateOTP, sendVerification } from "../utils/sendVerification.js";
import { Verification } from "../models/verification.js";
import validator from "validator";
import { CARequest } from "../models/ca_request.js";

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, referralCode } = req.body;

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
      return next(new ErrorHandler("User Already Exists", 400));
    }

    const hashedpswd = await bcrypt.hash(password, 10);

    sendVerification(email, generateOTP(), name, hashedpswd, referralCode, res);
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
    const { frontendUrl, referralCode } = req;
    const email = user.emails[0].value;
    let googleUser = await User.findOne({ email }).select("+password");

    if (!googleUser.password) {
      if (referralCode) {
        googleUser.referredBy = referralCode;
        await googleUser.save();
      }
      res.redirect(`${frontendUrl}setPassword?email=${email}`);
    } else {
      const refreshToken = await generateRefreshToken(googleUser);
      const token = jwt.sign({ _id: googleUser._id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
      });
      res.redirect(
        `${frontendUrl}backend_redirect?token=${token}&refreshToken=${refreshToken}`
      );
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 400));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid Password!", 400));
    }

    const refreshToken = await generateRefreshToken(user);
    sendJwt(user, res, next, 200, `Welcome Back, ${user.name}`, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const profile = (req, res) => {
  res.status(200).json(req.user);
};

export const passwordSetter = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!validator.isLength(password, { min: 8 })) {
      return next(
        new ErrorHandler("Password must be minimum 8 characters", 400)
      );
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User Not Found", 404));
    }

    if (user.password) {
      return next(new ErrorHandler("Password Already Set", 400));
    }

    const hashedpswd = await bcrypt.hash(password, 10);

    // const referralCode = user.referredBy;
    // if (referralCode) {
    //   const ca = await CARequest.findOne({ referralCode });
    //   if (ca && ca.status === "approved") {
    //     const points = 10;
    //     ca.points += points;
    //     await ca.save();
    //   }
    // }

    user.password = hashedpswd;
    await user.save();

    const refreshToken = await generateRefreshToken(user);
    sendJwt(user, res, next, 201, "User Created Successfully", refreshToken);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.headers["x-refresh-token"];
    if (!refreshToken)
      return next(new ErrorHandler("Please provide refresh token", 400));

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
    const refreshToken = req.headers["x-refresh-token"];
    if (!refreshToken)
      return next(new ErrorHandler("Invalid Refresh Token", 401));

    const decoded = jwt.decode(refreshToken, process.env.JWT_SECRET);
    if (!decoded) return next(new ErrorHandler("Invalid Refresh Token", 401));

    const session = Session.findOne({ user: decoded._id });
    if (!session) return next(new ErrorHandler("Invalid Refresh Token", 401));

    sendJwt(
      { _id: session.user },
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
      return next(new ErrorHandler("OTP Invalid or Expired", 400));

    // if (verification.referralCode) {
    //   const ca = await CARequest.findOne({
    //     referralCode: verification.referralCode,
    //   });
    //   if (ca && ca.status === "approved") {
    //     const points = 10;
    //     ca.points += points;
    //     await ca.save();
    //   }
    // }
    const user = await User.create({
      name: verification.name,
      email: verification.email,
      password: verification.password,
      referredBy: verification.referralCode,
    });
    const refreshToken = await generateRefreshToken(user);
    await Verification.deleteOne({ email });
    sendJwt(user, res, next, 201, "User Created Successfully", refreshToken);
  } catch (error) {
    next(error);
  }
};
