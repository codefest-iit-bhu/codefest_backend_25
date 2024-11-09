const { jsonString } = require("../db/events");
const express = require("express");
const router = express.Router();

const getPriceById = (id) => {
  for (const category in data) {
    for (const event in data[category]) {
      if (data[category][event].id === id) {
        return data[category][event].price;
      }
    }
  }
  return null;
};

const data = JSON.parse(jsonString);

router.get("/", async (req, res) => {
  return res.json(data).status(200);
});

router.get("/:name", async (req, res) => {
  const { name } = req.params;
  if (data[name]) {
    return res.json(data[name]).status(200);
  } else {
    return res.json({ message: "Invalid Search Token" }).status(400);
  }
});

router.post("/price", async (req, res) => {
  const { events } = req.body;

  let totalPrice = 0;
  let invalidIds = [];

  events.forEach((id) => {
    const price = getPriceById(id);
    if (price !== null) {
      totalPrice += price;
    } else {
      invalidIds.push(id);
    }
  });

  if (invalidIds.length > 0) {
    return res.status(404).json({
      totalPrice,
      message: "Some IDs were not found",
      invalidIds,
    });
  }

  return res.status(200).json({ totalPrice });
});

router.post("/cartEvents", async (req, res) => {
  const { events } = req.body;

  let names = [];
  let invalidIds = 0;

  for (id in events) {
    let found = false;
    for (const category in data) {
      for (const event in data[category]) {
        if (data[category][event].id === events[id]) {
          names.push(data[category][event].name);
          found = true;
        }
      }
    }
    if (!found) invalidIds++;
  }

  if (invalidIds > 0) {
    return res.status(404).json({
      names,
      message: "Some IDs were not found",
      invalidIds,
    });
  }

  return res.status(200).json({ names });
});

module.exports = router;
