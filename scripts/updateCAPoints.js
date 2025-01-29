import mongoose from "mongoose";
import { config } from "dotenv";
import { CARequest } from "../models/ca_request.js";
import { Members } from "../models/members.js";
import { User } from "../models/user.js";
config({ path: "../.env" });

mongoose
    .connect(process.env.MONGO_SCRIPT_URI, { dbName: "codefest" })
    .then(async (c) => {
        console.log(`Database connected with ${c.connection.host}`);
        const ca_requests = await CARequest.find()
        const members = await Members.find().populate("user", "_id, referredBy");
        const users = await User.find();
        const cas = await CARequest.find({ status: "approved" })
        let i = 1;
        console.log("Total requests: ", ca_requests.length);
        let pointUpdateDate = new Date("2025-01-29T15:00:00"); // Set time to 3 PM UTC
        pointUpdateDate = new Date(pointUpdateDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        for (const ca_request of ca_requests) {
            console.log("Request ", i);
            const users_referred_before = users.filter(user => user.referredBy === ca_request.referralCode && user.createdAt < pointUpdateDate);
            const users_referred_after = users.filter(user => user.referredBy === ca_request.referralCode && user.createdAt >= pointUpdateDate);
            const cas_referred_before = cas.filter(ca => ca.ca_brought_by === ca_request.referralCode && (!ca.createdAt || ca.createdAt < pointUpdateDate));
            const cas_referred_after = cas.filter(ca => ca.ca_brought_by === ca_request.referralCode && (ca.createdAt && ca.createdAt >= pointUpdateDate));
            const numMembersReferred_before = members.filter(member => {
                if (member.user && member.user.referredBy && member.createdAt < pointUpdateDate) {
                    return member.user.referredBy === ca_request.referralCode
                }
                return false
            }).length
            const numMembersReferred_after = members.filter(member => {
                if (member.user && member.user.referredBy && member.createdAt >= pointUpdateDate) {
                    return member.user.referredBy === ca_request.referralCode
                }
                return false
            }).length
            await CARequest.findOneAndUpdate(
                { referralCode: ca_request.referralCode },
                { points: (numMembersReferred_before * 10 + users_referred_before.length * 10 + cas_referred_before.length * 30) + (numMembersReferred_after * 15 + users_referred_after.length * 10 + cas_referred_after.length * 30) },
            );
            i += 1;
        }
        console.log("Done")
    }).catch(err => console.log(err))