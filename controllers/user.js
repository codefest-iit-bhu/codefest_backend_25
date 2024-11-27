import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';

export const getAllUsers = async (req, res, next) => {
  if (request.user.role !== 'admin')
    return next(new ErrorHandler('You are not allowed to access users', 403));

  const users = await User.find();
  return res.status(200).json(users);
};

export const updateUser = async (req, res, next) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user._id != id)
    return next(
      new ErrorHandler(
        "You are not allowed to change another user's details",
        403
      )
    );
  const { role, institute, phone_num } = req.body;
  if (role && role !== 'user' && role !== 'ca' && role !== 'admin')
    return next(new ErrorHandler('Invalid role', 400));
  req.user.role = role;
  if (role !== 'admin') {
    if (institute) req.user.institute = institute;
    if (phone_num) {
      if (phone_num.length !== 10)
        return next(
          new ErrorHandler('Phone number must be exactly 10 characters')
        );
      req.user.phone_num = phone_num;
    }
  }
  await req.user.save();
  return res.status(200).json(req.user);
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user._id != id)
    return next(
      new ErrorHandler('You are not allowed to delete another user', 403)
    );
  await User.findByIdAndDelete(id);
  return res.status(200).json({ message: 'User deleted successfully' });
};