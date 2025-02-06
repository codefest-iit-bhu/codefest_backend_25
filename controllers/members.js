import { Events } from "../models/events.js";
import { Members } from "../models/members.js";
import ErrorHandler from "../middlewares/error.js";
import { Team } from "../models/team.js";
import { User } from "../models/user.js";
import { updateCAPoints } from "../utils/features.js";

export const joinTeam = async (req, res, next) => {
  try {
    const { teamCode } = req.body;
    const team = await Team.findOne({ teamCode });
    if (!team) return next(new ErrorHandler("Team not found", 404));
    const members = await Members.find({ team: team._id });

    if (!team) {
      return next(new ErrorHandler("Invalid Team Code", 404));
    }

    const eventId = team.event;
    const event = await Events.findById(eventId);
    const maxMembers = event.maxMembers;
    const currentDate = new Date();
    const eventDeadline = new Date(event.eventDeadline);

    if (currentDate > eventDeadline) {
      return next(new ErrorHandler("Event Deadline Passed", 400));
    }
    if (members.length >= maxMembers) {
      return next(new ErrorHandler("Team is Full", 400));
    }

    const checkMember = await Members.findOne({
      user: req.user._id,
      event: eventId,
    });
    if (checkMember) {
      return next(new ErrorHandler("Already Registered", 400));
    }

    await Members.create({
      team: team._id,
      user: req.user._id,
      event: eventId,
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
      message: "Joined Team Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req, res, next) => {
  try {
    const { teamId } = req.params;

    const members = await Members.find({ team: teamId }).populate("user");
    if (members.length === 0) {
      return next(new ErrorHandler("Team Not Found", 404));
    }

    res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    const { userId, teamId } = req.body;
    const member = await Members.findOne({
      user: userId,
      team: teamId,
    }).populate({ path: "team", select: "teamLeader" });

    const teamLeader = member.team.teamLeader.toString();
    if (!member) {
      return next(new ErrorHandler("Member Not Found", 404));
    }
    if (userId === teamLeader) {
      return next(new ErrorHandler("Team Leader Cannot be Deleted", 400));
    }
    if (
      req.user._id.toString() !== teamLeader &&
      req.user._id.toString() !== userId
    ) {
      return next(new ErrorHandler("Unauthorized to delete the user", 401));
    }
    await Members.deleteOne({ user: userId, team: teamId });

    const user = await User.findById(userId);
    // try {
    //   if (user.referredBy) {
    //     await updateCAPoints(req.user.referredBy, -15);
    //   }
    // } catch (error) {
    //   console.error(error);
    // }

    res.status(200).json({
      status: "success",
      message: "Member Deleted Successfully",
    });
  } catch (error) {
    next(error);
  }
};
