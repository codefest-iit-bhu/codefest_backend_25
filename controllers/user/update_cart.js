const db = require("./../../db/conn.js");
const JSON = require("JSON");

module.exports = async (req, res) => {
  const { new_cart } = req.body;
  const collection = await db.collection("users");
  const result = await collection.updateOne(
    { email: res.email },
    { $set: { cart: new_cart } }
  );
  res.json(result).status(200);
};
