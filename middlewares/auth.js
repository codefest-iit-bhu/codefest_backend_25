import { User } from "../models/user.js";
import jwt from "jsonwebtoken";
import ErrorHandler from "./error.js";

const isAuthenticated = async (req,_,next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ErrorHandler("Authorization header missing or invalid"));
    }    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded);
    next();
}

export default isAuthenticated;