import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import { frontendUrl } from '../app.js';

export const saveCookie = (user, res, next, statusCode, message) => {
  try {
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);

    res
      .status(statusCode)
      .cookie('token', token, {
        httpOnly: true,
        maxAge: 31 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        secure: process.env.NODE_ENV === 'development' ? false : true,
      })
      .json({
        success: true,
        message: message,
      });
  } catch (error) {
    next(error);
  }
};

export const saveGoogleCookie = async (user, res, next, statusCode) => {
  try {
    let findUser = await User.findOne({ email: user.emails[0].value }).select(
      '+password'
    );
    const token = jwt.sign({ _id: findUser._id }, process.env.JWT_SECRET);

    res.status(statusCode).cookie('token', token, {
      httpOnly: true,
      maxAge: 31 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      secure: process.env.NODE_ENV === 'development' ? false : true,
    });

    if (findUser.password === null) {
      console.log(`${frontendUrl}/setPassword`);
      res.redirect(`${frontendUrl}/setPassword`);
    } else {
      res.redirect(`${frontendUrl}/main`);
    }
  } catch (error) {
    next(error);
  }
};
export const cookieRefresher = (req, res, next) => {
  const { token } = req.cookies;

  res.status(200).cookie('token', token, {
    httpOnly: true,
    maxAge: 31 * 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  next();
};
