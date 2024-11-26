import jwt from 'jsonwebtoken';

export const saveCookie = (user, res, next, statusCode, message) => {
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
      });
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
