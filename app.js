import express from "express";
import { config } from "dotenv";
import userRouter from "./routes/user.js"
import {errorMiddleware} from "./middlewares/error.js";
import cors from "cors"

export const app = express();
config();

//Using middlewares
app.use(express.json());
app.use(
    cors({
        origin: ["*"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
    }));

//using routes
app.use("/api/v1/users", userRouter );

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use(errorMiddleware);