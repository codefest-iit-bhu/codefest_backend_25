import mongoose from "mongoose";

const schema = new mongoose.Schema({
    referredBy: {
        required: true,
        type: String
    },
    username: {
        required: true,
        type: String
    },
    name: {
        required: true,
        type: String
    },
    isVerified: {
        required: true,
        type: Boolean,
        default: false
    }
});

export const Referral = mongoose.model("Referral", schema);