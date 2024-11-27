import { Team } from '../models/team.js';
import { Members } from '../models/members.js';
import { Events } from '../models/events.js';
import { generateRandomCode } from '../utils/features.js';

export const createTeam = async (req, res, next) => {
  try {
    let { teamName, eventId } = req.body;
    teamName = teamName.trim();

    if (await Team.findOne({ teamName, eventId })) {
      return res.status(400).json({
        success: false,
        message: 'Team Already Exists',
      });
    }
    const teamCode = await generateRandomCode();
    await Team.create({
      teamName,
      teamCode,
      eventId,
      teamLeader: req.user._id,
    });

    await Members.create({
      teamCode,
      userId: req.user._id,
      eventId,
    });

    await res.status(201).json({
      success: true,
      message: 'Team Created Successfully',
      teamCode,
    });
  } catch (error) {
    next(error);
  }
};

export const isRegistered = async (req, res, next) => {
  const { eventId } = req.params;

  try {
    const member = await Members.findOne({ userId: req.user._id, eventId });
    await Events.create({
      eventId: '1',
      maxMembers: 4,
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team Not Found',
      });
    }
    res.status(200).json({
      success: true,
      userId: member.userId,
      teamCode: member.teamCode,
      event: member.eventId,
    });
  } catch (error) {
    next(error);
  }
};
