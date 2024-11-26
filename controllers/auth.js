import { User } from '../models/user.js';
import bcrypt from 'bcrypt';
import { saveCookie } from '../utils/features.js';
import ErrorHandler from '../middlewares/error.js';
import { frontendUrl } from '../config/constants.js';

export const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return next(new ErrorHandler('User Already Exist', 404));
    }

    const hashedpswd = await bcrypt.hash(password, 5);

    user = await User.create({ name, email, password: hashedpswd });

    saveCookie(user, res, next, 201, 'User Created Successfully');
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
    let googleUser = await User.findOne({ email }).select(
      '+password'
    );

    if (googleUser.password === null) {
      console.log(`${frontendUrl}/setPassword?email=${email}`);
      res.redirect(`${frontendUrl}/setPassword?email=${email}`);
    } else {
      res.redirect(`${frontendUrl}/main?email=${email}`);
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler('Invalid Email!', 404));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler('Invalid Password!', 404));
    }

    saveCookie(user, res, next, 200, `Welcome Back, ${user.name}`);
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
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorHandler('User Not Found', 404));
    }

    if (user.password) {
      return next(new ErrorHandler('Password Already Set', 400));
    }

    const hashedpswd = await bcrypt.hash(password, 10);

    user.password = hashedpswd;
    await user.save();

    saveCookie(user, res, next, 201, 'User Created Successfully');
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    res
      .status(200)
      .cookie('token', '', {
        expires: new Date(Date.now()),
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
        secure: process.env.NODE_ENV === 'development' ? false : true,
      })
      .json({
        success: true,
        message: 'Logged Out Successfully',
      });
  } catch (error) {
    next(error);
  }
};
