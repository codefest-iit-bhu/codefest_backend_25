import mongoose from "mongoose";

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

export const Team = mongoose.model("Team", schema);
