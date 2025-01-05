import mongoose from "mongoose";
import { User } from "../models/user.js"; // Adjust the path based on your project structure


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
