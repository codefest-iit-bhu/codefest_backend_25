const db = require("../../db/conn.js");

module.exports = async (req, res) => {
  const { username } = req.params;
  const collection = await db.collection("users");
  result = await collection.findOne({ username: username });
  res.json({ userExists: result != null }).status(200);
};
