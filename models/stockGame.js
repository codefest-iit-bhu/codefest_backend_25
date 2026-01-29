import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  initialPrice: {
    type: Number,
    required: true,
  },
  percentChanges: {
    type: [Number], // Array of 10 percent changes for each round
    required: true,
  },
});

const gameConfigSchema = new mongoose.Schema({
  stocks: [stockSchema],
  initialBalance: {
    type: Number,
    default: 100000,
  },
  roundDuration: {
    type: Number,
    default: 30, // 30 seconds for testing, change to 600 (10 minutes) for production
  },
  totalRounds: {
    type: Number,
    default: 10,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["scheduled", "active", "finished"],
    default: "scheduled",
  },
  currentRound: {
    type: Number,
    default: 0,
  },
  roundStartTime: {
    type: Date,
  },
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const playerPortfolioSchema = new mongoose.Schema({
  stock: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
    default: 0,
  },
  averagePrice: {
    type: Number,
    required: true,
    default: 0,
  },
});

const transactionSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
  stock: {
    type: String,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const playerGameSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gameConfig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GameConfig",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
  portfolio: [playerPortfolioSchema],
  currentRound: {
    type: Number,
    default: 0,
  },
  transactionHistory: [transactionSchema],
  finalScore: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const GameConfig = mongoose.model("GameConfig", gameConfigSchema);
export const PlayerGame = mongoose.model("PlayerGame", playerGameSchema);
