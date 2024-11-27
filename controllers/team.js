import { Team } from "../models/team.js";
import { Members } from "../models/members.js";
import { Events } from "../models/events.js";
import { generateRandomCode } from "../utils/features.js";
import ErrorHandler from "../middlewares/error.js";

export const createTeam = async (req, res, next) => {
  try {
    let { teamName, eventId } = req.body;
    teamName = teamName.trim();

    if (await Team.findOne({ teamName, eventId })) {
      return next(new ErrorHandler("Teamname Already Exists", 400));
    }

    if (await Members.findOne({ user: req.user._id, eventId })) {
      return next(new ErrorHandler("Already Registered", 400));
    }

    const event = await Events.findOne({ eventId });
    const currentDate = new Date();
    const eventDeadline = new Date(event.eventDeadline);
    if (currentDate > eventDeadline) {
      return next(new ErrorHandler("Event Deadline Passed", 400));
    }

    const teamCode = await generateRandomCode();
    const team = await Team.create({
      teamName,
      teamCode,
      eventId,
      teamLeader: req.user._id,
    });

    await Members.create({
      team: team._id,
      user: req.user._id,
      eventId,
    });

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
      return next(new ErrorHandler("Member Not Found", 404));
    }

    team.teamLeader = newLeader;
    await team.save();
    res.status(200).json({
      success: true,
      message: "Leader Changed Successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  try {
    const teams = await Members.find({ user: req.user._id }).populate(
      "team",
      "user"
    );
    res.status(200).json(teams);
  } catch (error) {
    next(error);
  }
};

export const nameAvailable = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (await Team.findOne({ name: name }))
      return res.status(200).json({ status: "failure" });
    else return res.status(200).json({ status: "success" });
  } catch (error) {
    next(error);
  }
};
