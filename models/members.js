import mongoose from "mongoose";

const schema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Events",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Members = mongoose.model("Members", schema);
