const express = require("express");
const getEventsById = require("./../utils/events/events.js");
const router = express.Router();
const db = require("./../db/conn.js");

router.get("/", async (req, res) => {
  const collection = await db.collection("payments");
  const result = await collection.find().toArray();
  const userCollection = await db.collection("users");
  await Promise.all(
    result.map(async (e) => {
      const result = await userCollection.findOne(
        { email: e.email },
        { projection: { name: 1,phone:1 } }
      );
      // console.log(result.name);
      e["name"] = result.name;
      e["phone"]=result.phone;
    })
  );
  result.map((e) => {
    e["purchased_events"] = getEventsById(e["purchased_events"]);
  });
  res.json(result).status(200);
});

module.exports = router;
