require("dotenv").config();
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGODB_URI)
const db=client.db('fmcw')
module.exports=db;
