import mongoose from "mongoose";
import { mongoUri } from "./constants.js";

export const connectDB = () => {
  mongoose
    .connect(mongoUri, { dbName: "codefest" })
    .then((c) => {
      console.log(`Database connected with ${c.connection.host}`);
    })
    .catch((err) => console.log(err));
};
