import { Events } from "../models/events.js";
import ErrorHandler from "../middlewares/error.js";
import { convertToDate } from "../utils/features.js";
import { Members } from "../models/members.js";
import { Team } from "../models/team.js";

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

export const getTeams = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admin can access", 403));
    }
    const { eventId } = req.params;
    const event = await Events.findOne({ eventId });
    const teams = await Team.aggregate([
      {
        $lookup: {
          from: "members",
          localField: "_id",
          foreignField: "team",
          as: "members",
        },
      },
      {
        $match: {
          "members.event": event._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "members.user",
          foreignField: "_id",
          as: "userDetails",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "event",
          foreignField: "_id",
          as: "eventDetails",
        },
      },
      {
        $addFields: {
          members: {
            $map: {
              input: "$members",
              as: "member",
              in: {
                $mergeObjects: [
                  "$$member",
                  {
                    user: {
                      $arrayElemAt: [
                        "$userDetails",
                        { $indexOfArray: ["$userDetails._id", "$$member.user"] },
                      ],
                    },
                  },
                ],
              },
            },
          },
          event: { $arrayElemAt: ["$eventDetails", 0] },
        },
      },
      {
        $unset: ["userDetails", "eventDetails"],
      },
    ]);


    res.status(200).json(teams);
  } catch (error) {
    next(error)
  }
}
