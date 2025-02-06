import ErrorHandler from "../middlewares/error.js";
import { CARequest } from "../models/ca_request.js";
import { generateCAReferral, updateCAPoints } from "../utils/features.js";

export const register = async (req, res, next) => {
  try {
    const request = await CARequest.findOne({ user: req.user._id });
    if (request)
      return next(new ErrorHandler("CA Request already exists", 400));
    const {
      institute,
      userDescription,
      ca_brought_by,
      branch,
      graduation_year,
      contact_number,
      whatsapp_number,
    } = req.body;

    const referralCode = await generateCAReferral();
    const newRequest = await CARequest.create({
      user: req.user._id,
      institute,
      userDescription,
      ca_brought_by,
      branch,
      graduation_year,
      contact_number,
      whatsapp_number,
      referralCode,
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
    const {
      status,
      institute,
      userDescription,
      adminMessage,
      ca_brought_by,
      branch,
      graduation_year,
      contact_number,
      whatsapp_number,
    } = req.body;
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

    if (req.user.role !== "admin") {
      if (institute) request.institute = institute;
      if (userDescription) request.userDescription = userDescription;
      if (ca_brought_by) request.ca_brought_by = ca_brought_by;
      if (branch) request.branch = branch;
      if (graduation_year) request.graduation_year = graduation_year;
      if (contact_number) request.contact_number = contact_number;
      if (whatsapp_number) request.whatsapp_number = whatsapp_number;
    } else {
      if (adminMessage) request.adminMessage = adminMessage;
      // try {
      //   if (status) {
      //     if (status === "approved" && request.status !== "approved") {
      //       await updateCAPoints(request.ca_brought_by, 30);
      //     } else if (status !== "approved" && request.status === "approved") {
      //       await updateCAPoints(request.ca_brought_by, -30);
      //     }
      //   }
      // } catch (error) {
      //   console.log(error);
      // }
    }
    if (status) {
      request.status = status;
    }
    const updatedRequest = await CARequest.findByIdAndUpdate(
      request._id,
      request,
      { new: true }
    ).populate("user");
    if (!updatedRequest)
      return next(new ErrorHandler("CA request couldn't be updated", 500));
    res.status(200).json(updatedRequest);
  } catch (error) {
    next(error);
  }
};

export const getCALeaderboard = async (req, res, next) => {
  try {
    const ca_requests = await CARequest.find({
      $or: [
        { status: "approved" },
        { $and: [{ status: { $ne: "approved" } }, { points: { $gt: 0 } }] },
      ],
    })
      .populate("user", "name")
      .sort({ points: -1 });
    const ca_leaderboard = ca_requests.map((request) => {
      return {
        name: request.user.name,
        institute: request.institute,
        points: request.points,
      };
    });
    res.status(200).json(ca_leaderboard);
  } catch (error) {
    next(error);
  }
};
