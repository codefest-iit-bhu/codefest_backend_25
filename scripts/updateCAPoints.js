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
        for (const ca_request of ca_requests) {
            console.log("Request ", i);
            const users_referred = users.filter(user => user.referredBy === ca_request.referralCode);
            const cas_referred = cas.filter(ca => ca.ca_brought_by === ca_request.referralCode);
            const numMembersReferred = members.filter(member => {
                if (member.user && member.user.referredBy) {
                    return member.user.referredBy === ca_request.referralCode
                }
                return false
            }).length
            await CARequest.findOneAndUpdate(
                { referralCode: ca_request.referralCode },
                { points: numMembersReferred * 10 + users_referred.length * 10 + cas_referred.length * 30 },
            );
            i += 1;
        }
        console.log("Done")
    }).catch(err => console.log(err))