const db = require("./../../db/conn.js");
const JSON = require("JSON");

const update_events_registered = async (email) => {
  const collection = await db.collection("users");
  const info = await collection.findOne(
    { email: email },
    { projection: { cart: 1, registered: 1 } }
  );
  const registered = JSON.parse("[" + info.registered + "]");
  const cart = JSON.parse("[" + info.cart + "]");
  const result = await collection.updateOne(
    { email: email },
    { $set: { registered: registered.concat(cart), cart: [] } }
  );
  return [cart,result];
};

const upload_payment = async (email,purchased_events,amount_paid,image_url)=>{
  const collection = await db.collection("payments");
  await collection.insertOne({
    email:email,
    purchased_events:purchased_events,
    amount_paid:amount_paid,
    image_url:image_url,
    timestamp:new Date().toLocaleString()
  })
  console.log(new Date().toLocaleString());
}

module.exports = async (req, res) => {
  const { image_url,amount_paid } = req.body;
  const [purchased_events,result] = await update_events_registered(res.email);
  await upload_payment(res.email,purchased_events,amount_paid,image_url)
  res.json({ image_url: image_url }).status(200);
};
