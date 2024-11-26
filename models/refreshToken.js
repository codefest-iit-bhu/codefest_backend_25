import mongoose from 'mongoose';

const schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    }
});

export const RefreshToken = mongoose.model('RefreshToken', schema);
