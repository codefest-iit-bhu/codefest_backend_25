import { Events } from '../models/events.js';

export const addEvent = async (req, res, next) => {
  try {
    const { eventId, maxMembers, eventDeadline } = req.body;
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
