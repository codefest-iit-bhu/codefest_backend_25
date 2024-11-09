const express = require("express");
const router = express.Router();

const check_user = require("../controllers/auth/check_user.js");
const newController = require("../controllers/auth/new.controller.js");
const login_password = require("../controllers/auth/login_password.js");
router.get("/", (req, res) => {
  res.send("auth");
});

router.post("/login_password", login_password);

router.post("/new", newController);

router.get("/check_user/:username",check_user);

module.exports = router;
