import { Team } from "../models/team.js";
import { Members } from "../models/members.js";
import { Events } from "../models/events.js";
import { generateRandomCode, updateCAPoints } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";
import mongoose from "mongoose";

export const createTeam = async (req, res, next) => {
  try {
    let { teamName, eventId } = req.body;
    const event = await Events.findOne({ eventId });
    teamName = teamName.trim();

    if (await Team.findOne({ teamName, event: event._id })) {
      return next(new ErrorHandler("Teamname Already Exists", 400));
    }

    if (await Members.findOne({ user: req.user._id, event: event._id })) {
      return next(new ErrorHandler("Already Registered", 400));
    }

    const currentDate = new Date();
    const eventDeadline = new Date(event.eventDeadline);
    if (currentDate > eventDeadline) {
      return next(new ErrorHandler("Event Deadline Passed", 400));
    }

    const teamCode = await generateRandomCode();
    const team = await Team.create({
      teamName,
      teamCode,
      event: event._id,
      teamLeader: req.user._id,
    });

    await Members.create({
      team: team._id,
      user: req.user._id,
      event: event._id,
    });

    // try {
    //   if (req.user.referredBy) {
    //     await updateCAPoints(req.user.referredBy, 15);
    //   }
    // } catch (error) {
    //   console.error(error);
    // }

    res.status(201).json({
      success: true,
      message: "Team Created Successfully",
      teamCode,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    const { teamCode } = req.body;
    const team = await Team.findOne({ teamCode });

    if (!team) {
      return next(new ErrorHandler("Team Not Found", 404));
    }

    if (team.teamLeader.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Access Denied", 403));
    }

    const members = await Members.find({ team: team._id }).populate(
      "user",
      "referredBy"
    );
    // for (const member of members) {
    //   try {
    //     if (member.user && member.user.referredBy) {
    //       await updateCAPoints(member.user.referredBy, -15);
    //     }
    //   } catch (error) {
    //     console.error(error);
    //   }
    // }
    await Team.deleteOne({ teamCode });
    await Members.deleteMany({ team: team._id });

    res.status(200).json({
      success: true,
      message: "Team Deleted Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const changeLeader = async (req, res, next) => {
  try {
    const { teamCode, newLeader } = req.body;
    const team = await Team.findOne({ teamCode });

    if (!team) {
      return next(new ErrorHandler("Team Not Found", 404));
    }

    if (team.teamLeader.toString() !== req.user._id.toString()) {
      return next(new ErrorHandler("Access Denied", 403));
    }

    const member = await Members.findOne({
      user: newLeader,
      team: team._id,
    });
    if (!member) {
      return next(new ErrorHandler("Member Not Found in the team", 404));
    }

    team.teamLeader = newLeader;
    await team.save();
    res.status(200).json({
      success: true,
      message: "Leader Changed Successfully",
      team,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTeams = async (req, res, next) => {
  try {
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
          "members.user": req.user._id,
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
                        {
                          $indexOfArray: ["$userDetails._id", "$$member.user"],
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
          event: { $arrayElemAt: ["$eventDetails", 0] }, // Extract only maxMembers
        },
      },
      {
        $unset: ["userDetails", "eventDetails"], // Remove unused fields
      },
    ]);

    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

export const nameAvailable = async (req, res, next) => {
  try {
    const { name, eventId } = req.body;
    const event = await Events.findOne({ eventId });
    const team = await Team.findOne({ teamName: name, event: event._id });
    if (team) return res.status(200).json({ status: "failure" });
    else return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};
