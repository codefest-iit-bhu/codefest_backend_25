const db = require("../../db/conn.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  const { username, password } = req.body;
  const collection = await db.collection("users");
  const result = await collection.findOne({ username: username });
  if (result === null) {
    res.json({ error: "user not found" }).status(404);
    return;
  } else {
    if (!(await bcrypt.compare(password, result.password))) {
      res.json({ error: "invalid password" }).status(400);
      return;
    }
  }
  const authToken = jwt.sign(result.email, process.env.JWT_SECRET);
  res
    .json({ authToken: authToken,isVerified:result.verified })
    .status(200);
};
