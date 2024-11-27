import jwt from 'jsonwebtoken';
import { Session } from '../models/session.js';

export const saveCookie = async (user, res, next, statusCode, message, refreshToken) => {
  try {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res
      .status(statusCode)
      .cookie('token', token, {
        httpOnly: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        secure: process.env.NODE_ENV === 'development' ? false : true,
      })
      .json({
        success: true,
        message: message,
        refreshToken
      });
  } catch (error) {
    next(error);
  }
};

export const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_REFRESH, { expiresIn: '30d' });

  await Session.create({
    user: user._id,
    token: refreshToken,
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  })

  return refreshToken
}
