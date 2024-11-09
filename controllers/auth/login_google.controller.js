const db = require("../../db/conn.js");
const bcrypt = require("bcrypt");

module.exports = async (req, res) => {
  const body = req.body;
  if (body.login_type=="google"){
      const collection = await db.collection("users");
      const authToken = jwt.sign(email, process.env.JWT_SECRET);
      const result = await collection.findOne({ email: email });
      res
        .json({ authToken: authToken, newUser: result ? false : true })
        .status(200);
  }
};