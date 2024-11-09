const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();

const newController = require("./../controllers/user/new.controller.js");
const profileController = require("./../controllers/user/profile.controller.js");
const cartController = require("./../controllers/user/cart.controller.js");
const addToCartController = require("./../controllers/user/add_to_cart.controller.js");
const removeFromCartController = require("./../controllers/user/remove_from_cart.controller.js");
const registeredController = require("./../controllers/user/registered.controller.js");
const checkoutController = require("./../controllers/user/checkout.controller.js");
const cartAndRegisteredController = require("../controllers/user/cart_and_registered.controller.js");

router.use(authMiddleware);

router.get("/", (req, res) => {
  res.json({ email: res.email }).status(200);
});

router.post("/new", newController);
router.get("/profile", profileController);
router.get("/cart", cartController);
router.get("/registered", registeredController);
router.get("/cart_and_reg", cartAndRegisteredController);
router.post("/add_to_cart", addToCartController);
router.post("/remove_from_cart", removeFromCartController);
router.post("/checkout", checkoutController);

module.exports = router;
