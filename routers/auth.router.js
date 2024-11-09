const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const db = require("./../db/conn.js");
router.get("/", (req, res) => {
  res.send("auth");
});

router.post("/login", async (req, res) => {
  const { email } = req.body;
  const collection = await db.collection("users");
  const authToken = jwt.sign(email, process.env.JWT_SECRET);
  const result = await collection.findOne({ email: email });
  res
    .json({ authToken: authToken, newUser: result ? false : true })
    .status(200);
});

module.exports = router;
