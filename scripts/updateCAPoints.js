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
        const ca_requests = await CARequest.find({ status: "approved" })
        const members = await Members.find().populate("user", "_id, referredBy");
        for (const ca_request of ca_requests) {
            const users = await User.find({ referredBy: ca_request.referralCode })
            const cas_referred = await CARequest.find({referredBy: ca_request.referralCode, status: "approved"})
            const numMembersReferred = members.filter(member => {
                if (member.user && member.user.referredBy) {
                    return member.user.referredBy === ca_request.referralCode
                }
                return false
            }).length
            // if (ca_request.user.toString() === "") {
            //     console.log(numMembersReferred, users.length)
            // }
            await CARequest.findOneAndUpdate(
                { referralCode: ca_request.referralCode },
                { points: numMembersReferred * 10 + users.length * 10 + cas_referred.length * 30 },
            );
        }
        console.log("Done")
    }).catch(err => console.log(err))