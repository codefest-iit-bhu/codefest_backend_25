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
  ca_brought_by: String,
  branch: String,
  graduation_year: String,
  contact_number: String,
  whatsapp_number: String,
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
  referralCode: {
    type: String,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
  },
  winzo_points: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const CARequest = mongoose.model("CARequest", schema);
