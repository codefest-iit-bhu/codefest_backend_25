const db = require("./../../db/conn.js");

module.exports = async (req, res) => {
  const collection = await db.collection("users");
  result = await collection.findOne(
    { email: res.email },
    { projection: { cart: 1,registered:1 } }
  );
  res.json(result).status(200);
};
