import { Events } from "../models/events.js";
import ErrorHandler from "../middlewares/error.js";
import { convertToDate } from "../utils/features.js";

export const addEvent = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admin can access", 403));
    }

    // eventDeadline in the format DD-MM-YYYY
    let { eventId, maxMembers, eventDeadline } = req.body;

    if (await Events.findOne({ eventId })) {
      return next(new ErrorHandler("Event already exists", 400));
    }

    eventDeadline = convertToDate(eventDeadline);

    const event = await Events.create({
      eventId,
      maxMembers,
      eventDeadline,
    });
    res.status(201).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};
