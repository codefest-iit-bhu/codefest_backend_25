import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  teamCode: {
    required: true,
    type: String,
  },
  userId: {
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

export const Members = mongoose.model('Members', schema);