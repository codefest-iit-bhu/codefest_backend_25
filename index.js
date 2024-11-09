const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);

const corsOptions = {
  // origin: process.env.CLIENT_API, // Specify your frontend's origin
  origin:'*',
  credentials: true, // This allows cookies to be sent
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions)); // Apply CORS middleware
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("server started");
});

const auth_router = require("./routers/auth.router.js");
const user_router = require("./routers/user.router.js");
const events_router = require("./routers/event.router.js");
const payments_router = require("./routers/payment.router.js");

const api = express.Router();
api.use("/auth", auth_router);
api.use("/user", user_router);
api.use("/events", events_router);
api.use("/payments", payments_router);

app.use("/api", api);
app.listen(8080);

module.exports = app;
