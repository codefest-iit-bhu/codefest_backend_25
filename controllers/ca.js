import ErrorHandler from "../middlewares/error.js";
import { CARequest } from "../models/ca_request.js";
import { User } from "../models/user.js";

export const register = async (req, res, next) => {
  try {
    const request = await CARequest.findOne({ user: req.user._id });
    if (request)
      return next(new ErrorHandler("CA Request already exists", 400));
    const { institute, userDescription } = req.body;
    const newRequest = await CARequest.create({
      user: req.user._id,
      institute,
      userDescription,
    });
    res.status(201).json(newRequest);
  } catch (error) {
    next(error);
  }
};

export const getMyRequest = async (req, res, next) => {
  try {
    const request = await CARequest.findOne({ user: req.user._id });
    if (!request) return res.status(200).json({});
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};

export const getAllRequests = async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return next(
        new ErrorHandler("You are not allowed to see the CA requests", 403)
      );
    const requests = await CARequest.find().populate("user", "name");
    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

export const updateRequest = async (req, res, next) => {
  try {
    const { status, institute, userDescription, adminMessage } = req.body
    let request = await CARequest.findOne({ _id: req.params.id });
    if (!request) return next(new ErrorHandler("CA request not found", 404));
    if (req.user.role !== "admin" && status != "pending") {
      return next(
        new ErrorHandler(
          "You are not allowed to approve or reject this request",
          403
        )
      );
    }
    if (status) {
      if (req.user.role === "admin" && status === "approved") {
        await User.findByIdAndUpdate(request.user, { role: "ca" });
      }

      if (req.user.role === "admin" && status !== "approved" && request.status === "approved") {
        await User.findByIdAndUpdate(request.user, { role: "user" });
      }
      request.status = status;
    }

    if (req.user.role !== "admin") {
      if (institute) request.institute = institute;
      if (userDescription)
        request.userDescription = userDescription;
    } else {
      if (adminMessage) request.adminMessage = adminMessage;
    }
    const updatedRequest = await CARequest.findByIdAndUpdate(request._id, request, { new: true })
    if (!updatedRequest)
      return next(new ErrorHandler("CA request couldn't be updated", 500));
    res.status(200).json(updatedRequest);
  } catch (error) {
    next(error);
  }
};
