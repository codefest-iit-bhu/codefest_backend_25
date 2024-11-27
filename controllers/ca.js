import ErrorHandler from '../middlewares/error.js';
import { CARequest } from '../models/ca_request.js';

export const register = async (req, res, next) => {
  const request = CARequest.find({ user: req.user._id });
  if (request) return next(new ErrorHandler('CA Request already exists', 404));
  const { institute, userDescription } = req.body;
  await CARequest.create({
    user: req.user._id,
    institute,
    userDescription,
  });
  res.status(201).json({
    message: 'CA request sent successfully',
  });
};

export const getMyRequest = async (req, res) => {
  const request = await CARequest.findOne({ user: req.user._id });
  if (!request) return next(new ErrorHandler('CA request not found', 404));
  res.status(200).json(request);
};

export const getAllRequests = async (req, res, next) => {
  if (req.user.role !== 'admin')
    return next(
      new ErrorHandler('You are not allowed to see the CA requests', 403)
    );
  const requests = await CARequest.find();
  res.status(200).json(requests);
};

export const updateRequest = async (req, res) => {
  let request = await CARequest.find({ _id: req.params.id });
  if (!request) return next(new ErrorHandler('CA request not found', 404));
  if (req.body.status) request.status = req.body.status;
  if (req.user.role !== 'admin') {
    if (req.body.institute) request.institute = req.body.institute;
    if (req.body.userDescription)
      request.userDescription = req.body.userDescription;
  } else {
    if (req.body.adminMessage) request.adminMessage = req.body.adminMessage;
  }
  const updatedRequest = await request.save();
  if (!updatedRequest)
    return next(new ErrorHandler("CA request couldn't be updated", 404));
  res.status(200).json(updatedRequest);
};
