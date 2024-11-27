import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  expiry: {
    type: Date,
    required: true,
  },
});

schema.index({ expiry: 1 }, { expireAfterSeconds: 0 });

export const Verification = mongoose.model("Verification", schema);
