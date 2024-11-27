import mongoose from "mongoose";

const schema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
  },
  maxMembers: {
    type: Number,
    required: true,
  },
  eventDeadline: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Events = mongoose.model("Events", schema);
