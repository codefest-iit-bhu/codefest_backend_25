import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
  },
  teamCode: {
    required: true,
    type: String,
    unique: true,
  },
  teamLeader: {
    type: String,
    required: true,
  },
  eventId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Team = mongoose.model('Team', schema);