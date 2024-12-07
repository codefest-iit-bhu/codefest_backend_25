import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import ErrorHandler from "./error.js";

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
