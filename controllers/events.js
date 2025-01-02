import { Events } from "../models/events.js";
import ErrorHandler from "../middlewares/error.js";
import { convertToDate } from "../utils/features.js";
import { Members } from "../models/members.js";

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

export const isMember = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Events.findOne({ eventId })
    const memberDoc = await Members.findOne({ user: req.user._id, event: event._id }).populate("team", "teamName")
    if (memberDoc) {
      res.json({
        isMember: true,
        teamName: memberDoc.team.teamName,
      })
    } else {
      res.json({
        isMember: false,
      })
    }
  } catch (error) {
    next(error)
  }
}

export const getEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Events.findOne({ eventId })
    return res.status(200).json(event)
  } catch (error) {
    next(error)
  }
}
