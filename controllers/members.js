import { Events } from '../models/events.js';
import { Members } from '../models/members.js';

export const joinTeam = async (req, res, next) => {
  try {
    const { teamCode } = req.body;
    const members = await Members.find({ teamCode });

    if (!members) {
      return next(new ErrorHandler('Invalid Team Code', 404));
    }

    const eventId = members[0].eventId;
    const event = await Events.findOne({ eventId });
    const maxMembers = event.maxMembers;

    if (members.length == maxMembers) {
      return next(new ErrorHandler('Team is Full', 400));
    }

    await Members.create({
      teamCode,
      userId: req.user._id,
      eventId,
    });
  } catch (error) {
    next(error);
  }
};
