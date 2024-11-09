const db = require("../../db/conn.js");
const bcrypt = require("bcrypt")

module.exports = async (req, res) => {
  const { name, age, email,phone,username,password } = req.body;
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const collection = await db.collection("users");
  const new_user = {
    name: name,
    age: age,
    phone: phone,
    email: email,
    username:username,
    password:hashedPassword,
    cart: [],
    registered: [],
    verified:false
  };
  try{
    result = await collection.insertOne(new_user);
    console.log(new_user);
    res.json(new_user).status(201);
  }catch(e){
    console.log(e);
    res.json({"error":e}).status(400)
  }
};
