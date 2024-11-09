const db = require("./../../db/conn.js");

module.exports = async (req, res) => {
  const collection = await db.collection("users");
  result = await collection.findOne(
    { email: res.email },
    { projection: { registered: 1 } }
  );
  res.json(result.registered).status(200);
};
