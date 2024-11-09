const db = require("./../../db/conn.js");

module.exports = async (req, res) => {
  const collection = await db.collection("users");
  result = await collection.findOne(
    { email: res.email },
    { projection: { cart: 0 } }
  );
  res.json(result).status(200);
};
