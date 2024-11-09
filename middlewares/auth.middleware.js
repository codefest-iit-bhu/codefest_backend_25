const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const token = req.get("Authorization").slice(7);
    const email = jwt.verify(token, process.env.JWT_SECRET);
    res.email = email;
    next();
  } catch (err) {
    res.json({ message: "invalid token" }).status(400);
  }
};
