const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const db = require("./../db/conn.js");
const check_user = require("../controllers/auth/check_user.js");
const newController = require("../controllers/auth/new.controller.js");
const loginController = require("../controllers/auth/login.controller.js");
router.get("/", (req, res) => {
  res.send("auth");
});

router.post("/login", loginController);

router.post("/new", newController);

router.get("/check_user/:username",check_user);

module.exports = router;
