import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  institute: {
    type: String,
    required: true,
  },
  userDescription: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  adminMessage: {
    type: String,
  },
});

export const CARequest = mongoose.model("CARequest", schema);
