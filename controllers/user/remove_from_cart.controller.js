const db = require("../../db/conn.js");

module.exports = async (req, res) => {
  const { events } = req.body; // Get the events/workshops to remove from the cart
  try {
    const collection = await db.collection("users");

    // Fetch the user's cart from the database
    const user = await collection.findOne(
      { email: res.email },
      { projection: { cart: 1 } }
    );

    // If the user has no cart, return an error
    if (!user || !user.cart) {
      return res.status(400).json({ error: "Cart is empty or not found." });
    }

    // Filter the cart to remove items that match the events
    const updatedCart = user.cart.filter(
      (item) => !events.some((eventId) => item.id === eventId)
    );

    // Update the user's cart in the database
    const result = await collection.updateOne(
      { email: res.email },
      { $set: { cart: updatedCart } }
    );

    res
      .status(200)
      .json({ message: "Items removed from cart successfully", result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while removing items from the cart." });
  }
};
