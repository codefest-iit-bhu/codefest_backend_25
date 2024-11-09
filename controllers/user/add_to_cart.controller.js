const db = require("./../../db/conn.js");

module.exports = async (req, res) => {
  const { events } = req.body;
  console.log(events);
  try {
    const collection = await db.collection("users");
    const user = await collection.findOne(
      { email: res.email },
      { projection: { cart: 1 } }
    );

    // Ensure the cart exists and is an array
    const cart = user?.cart || [];

    // Update the user's cart by adding the new events
    const result = await collection.updateOne(
      { email: res.email },
      { $set: { cart: cart.concat(events) } }
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Failed to update cart" });
  }
};
