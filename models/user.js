import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        select: false,
    },
    google_oauth_id: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export const User = mongoose.model("User", userSchema);