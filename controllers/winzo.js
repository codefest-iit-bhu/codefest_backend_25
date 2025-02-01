import ErrorHandler from "../middlewares/error.js";
import { CARequest } from "../models/ca_request.js";
import { Referral } from "../models/ca_winzo_referrals.js";
import { generateWinzoUsername } from "../utils/features.js";

export const createReferral = async (req, res, next) => {
    try {
        const { name } = req.body;
        const ca_request = await CARequest.findOne({ user: req.user._id });
        if (!ca_request) {
            return next(new ErrorHandler("Non CAs are not allowed to access", 403));
        } else if (ca_request.status !== "approved") {
            return next(new ErrorHandler("Your CA request is not approved yet", 403));
        }

        const username = await generateWinzoUsername();
        const referral = await Referral.create({
            referredBy: ca_request.referralCode,
            username,
            name
        });
        return res.status(201).json(referral);
    } catch (error) {
        next(error);
    }
}

export const updateReferralName = async (req, res, next) => {
    try {
        const ca_request = await CARequest.findOne({ user: req.user._id });
        if (!ca_request) {
            return next(new ErrorHandler("Non CAs are not allowed to access", 403));
        } else if (ca_request.status !== "approved") {
            return next(new ErrorHandler("Your CA request is not approved yet", 403));
        }
        const { name } = req.body;
        const referral = await Referral.findById(req.params.id);
        if (!referral) {
            return next(new ErrorHandler("Referral Not found", 400));
        }

        const updatedReferral = await Referral.findOneAndUpdate(
            { referredBy: referral.referredBy },
            { name },
            { new: true }
        )
        return res.status(200).json(updatedReferral);
    } catch (error) {
        next(error)
    }
}

export const updateWinzoPoints = async (req, res, next) => {
    try {
        let { text } = req.body;
        if (req.user.role !== "admin") {
            return next(new ErrorHandler("You're not allowed to update usernames", 403));
        }

        let tokens = text.split("\n");
        const rupee = "₹";
        let newTokens = []
        const n = tokens.length;
        for (let i = 0; i < n; ++i) {
            if (tokens[i][0] === rupee) {
                newTokens.push(tokens[i - 5].toLowerCase());
            }
        }

        const ca_requests = await CARequest.find();
        const referrals_verified = await Referral.find({ username: { $in: newTokens } });
        let updates = []
        for (const ca_request of ca_requests) {
            const num_verified = referrals_verified.filter(referral => referral.referredBy === ca_request.referralCode).length;
            updates.push({
                updateOne: {
                    filter: { referralCode: ca_request.referralCode },
                    update: { $set: { winzo_points: num_verified * 10 } }
                }
            })
        }

        await CARequest.bulkWrite(updates);

        const allReferrals = await Referral.find({}, 'username');
        const bulkOps = allReferrals.map(referral => ({
            updateOne: {
                filter: { username: referral.username },
                update: { $set: { isVerified: newTokens.includes(referral.username) } }
            }
        }));

        if (bulkOps.length > 0) {
            await Referral.bulkWrite(bulkOps);
        } else {
            console.log('No referrals found to update.');
        }
        return res.status(200).json({ status: true })
    } catch (error) {
        next(error);
    }
}
