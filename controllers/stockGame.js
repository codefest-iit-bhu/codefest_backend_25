import { GameConfig, PlayerGame } from "../models/stockGame.js";
import ErrorHandler from "../middlewares/error.js";

// Admin: Create game configuration (won't auto-start)
export const createGameConfig = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admins can create game config", 403));
    }

    const {
      stocks,
      initialBalance,
      roundDuration,
      totalRounds,
      scheduledStartTime,
    } = req.body;

    // Validate stocks
    if (!stocks || stocks.length !== 10) {
      return next(new ErrorHandler("Exactly 10 stocks are required", 400));
    }

    // Validate each stock has 10 percent changes
    for (const stock of stocks) {
      if (stock.percentChanges.length !== 10) {
        return next(
          new ErrorHandler(
            `Stock ${stock.symbol} must have exactly 10 percent changes`,
            400
          )
        );
      }
    }

    // Validate scheduled start time (must be in future)
    let startTime = null;
    if (scheduledStartTime) {
      startTime = new Date(scheduledStartTime);
      if (startTime <= new Date()) {
        return next(
          new ErrorHandler("Scheduled start time must be in the future", 400)
        );
      }
    } else {
      return next(new ErrorHandler("Scheduled start time is required", 400));
    }

    const gameConfig = await GameConfig.create({
      stocks,
      initialBalance: initialBalance || 100000,
      roundDuration: roundDuration || 30,
      totalRounds: totalRounds || 10,
      isActive: false,
      currentRound: 0,
      scheduledStartTime: startTime,
      status: "scheduled", // scheduled, active, finished
    });

    res.status(201).json({
      success: true,
      message: `Game configuration created successfully. Scheduled to start at ${new Date(scheduledStartTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      gameConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Start the game manually
export const startGame = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admins can start the game", 403));
    }

    const { gameId } = req.params;
    const gameConfig = await GameConfig.findById(gameId);

    if (!gameConfig) {
      return next(new ErrorHandler("Game configuration not found", 404));
    }

    if (gameConfig.isActive) {
      return next(new ErrorHandler("Game is already active", 400));
    }

    if (gameConfig.status === "finished") {
      return next(new ErrorHandler("Game has already finished", 400));
    }

    // Check if scheduled start time has passed
    if (gameConfig.scheduledStartTime > new Date()) {
      return next(
        new ErrorHandler(
          `Cannot start game before scheduled time: ${gameConfig.scheduledStartTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
          400
        )
      );
    }

    gameConfig.isActive = true;
    gameConfig.status = "active";
    gameConfig.currentRound = 0;
    gameConfig.roundStartTime = new Date();
    await gameConfig.save();

    res.status(200).json({
      success: true,
      message: "Game started successfully",
      gameConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Advance to next round
export const advanceRound = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admins can advance rounds", 403));
    }

    const { gameId } = req.params;
    const gameConfig = await GameConfig.findById(gameId);

    if (!gameConfig) {
      return next(new ErrorHandler("Game configuration not found", 404));
    }

    if (!gameConfig.isActive) {
      return next(new ErrorHandler("Game is not active", 400));
    }

    // Update all players' current round before advancing
    await PlayerGame.updateMany(
      { gameConfig: gameId, isActive: true },
      { currentRound: gameConfig.currentRound }
    );

    // Calculate current scores for leaderboard
    const players = await PlayerGame.find({
      gameConfig: gameId,
      isActive: true,
    });

    for (const player of players) {
      const currentScore = calculateCurrentScore(player, gameConfig);
      player.finalScore = currentScore;
      await player.save();
    }

    if (gameConfig.currentRound >= gameConfig.totalRounds - 1) {
      // End game
      gameConfig.isActive = false;
      gameConfig.status = "finished";
      await gameConfig.save();

      // Calculate final scores for all players
      for (const player of players) {
        const finalScore = calculateFinalScore(player, gameConfig);
        player.finalScore = finalScore;
        player.isActive = false;
        await player.save();
      }

      return res.status(200).json({
        success: true,
        message: "Game ended successfully",
        gameConfig,
      });
    }

    gameConfig.currentRound += 1;
    gameConfig.roundStartTime = new Date();
    await gameConfig.save();

    res.status(200).json({
      success: true,
      message: `Advanced to round ${gameConfig.currentRound+1}`,
      gameConfig,
    });
  } catch (error) {
    next(error);
  }
};

// User: Join the game (only when scheduled time has passed)
export const joinGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameConfig = await GameConfig.findById(gameId);

    if (!gameConfig) {
      return next(new ErrorHandler("Game configuration not found", 404));
    }

    // Check if scheduled start time has passed
    if (gameConfig.scheduledStartTime > new Date()) {
      return next(
        new ErrorHandler(
          `Game will be available to join at ${gameConfig.scheduledStartTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
          400
        )
      );
    }

    if (!gameConfig.isActive) {
      return next(
        new ErrorHandler(
          "Game is not active yet. Please wait for admin to start the game.",
          400
        )
      );
    }

    if (gameConfig.status === "finished") {
      return next(new ErrorHandler("This game has already finished", 400));
    }

    // Check if user already joined
    const existingPlayer = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
    });

    if (existingPlayer) {
      return next(new ErrorHandler("You already joined this game", 400));
    }

    const playerGame = await PlayerGame.create({
      user: req.user._id,
      gameConfig: gameId,
      balance: gameConfig.initialBalance,
      portfolio: [],
      currentRound: gameConfig.currentRound,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Joined game successfully",
      playerGame,
    });
  } catch (error) {
    next(error);
  }
};

// User: Get current game state
export const getGameState = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameConfig = await GameConfig.findById(gameId);

    if (!gameConfig) {
      return next(new ErrorHandler("Game configuration not found", 404));
    }

    const playerGame = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
    });

    // Calculate current stock prices
    const currentStockPrices = gameConfig.stocks.map((stock) => {
      let currentPrice = stock.initialPrice;
      for (let i = 0; i < gameConfig.currentRound; i++) {
        currentPrice = currentPrice * (1 + stock.percentChanges[i] / 100);
      }
      return {
        name: stock.name,
        symbol: stock.symbol,
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        change:
          gameConfig.currentRound > 0
            ? stock.percentChanges[gameConfig.currentRound - 1]
            : 0,
      };
    });

    // Calculate time remaining in current round
    let timeRemaining = 0;
    if (gameConfig.isActive && gameConfig.roundStartTime) {
      const timeElapsed =
        Date.now() - new Date(gameConfig.roundStartTime).getTime();
      timeRemaining = Math.max(
        0,
        gameConfig.roundDuration * 1000 - timeElapsed
      );
    }

    res.status(200).json({
      success: true,
      gameConfig: {
        _id: gameConfig._id,
        currentRound: gameConfig.currentRound,
        totalRounds: gameConfig.totalRounds,
        isActive: gameConfig.isActive,
        status: gameConfig.status,
        scheduledStartTime: gameConfig.scheduledStartTime,
        timeRemaining: Math.floor(timeRemaining / 1000), // in seconds
      },
      stocks: currentStockPrices,
      playerGame,
    });
  } catch (error) {
    next(error);
  }
};

// User: Buy stocks (only if time remaining > 0)
export const buyStock = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { stockSymbol, units } = req.body;

    if (!units || units <= 0) {
      return next(new ErrorHandler("Invalid number of units", 400));
    }

    const gameConfig = await GameConfig.findById(gameId);
    if (!gameConfig || !gameConfig.isActive) {
      return next(new ErrorHandler("Game is not active", 400));
    }

    // Check if time has expired for current round
    if (gameConfig.roundStartTime) {
      const timeElapsed =
        Date.now() - new Date(gameConfig.roundStartTime).getTime();
      const timeRemaining = gameConfig.roundDuration * 1000 - timeElapsed;

      if (timeRemaining <= 0) {
        return next(
          new ErrorHandler(
            "Time expired for this round. Waiting for admin to advance to next round.",
            400
          )
        );
      }
    }

    const stock = gameConfig.stocks.find((s) => s.symbol === stockSymbol);
    if (!stock) {
      return next(new ErrorHandler("Stock not found", 404));
    }

    const playerGame = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
      isActive: true,
    });

    if (!playerGame) {
      return next(new ErrorHandler("You haven't joined this game", 400));
    }

    const transactionRound = gameConfig.currentRound;

    // Calculate current stock price
    let currentPrice = stock.initialPrice;
    for (let i = 0; i < transactionRound; i++) {
      currentPrice = currentPrice * (1 + stock.percentChanges[i] / 100);
    }

    const totalCost = currentPrice * units;

    if (playerGame.balance < totalCost) {
      return next(new ErrorHandler("Insufficient balance", 400));
    }

    // Update balance
    playerGame.balance -= totalCost;

    // Update portfolio
    const portfolioIndex = playerGame.portfolio.findIndex(
      (p) => p.stock === stockSymbol
    );

    if (portfolioIndex >= 0) {
      const existingUnits = playerGame.portfolio[portfolioIndex].units;
      const existingAvgPrice =
        playerGame.portfolio[portfolioIndex].averagePrice;
      const newTotalUnits = existingUnits + units;
      const newAvgPrice =
        (existingUnits * existingAvgPrice + units * currentPrice) /
        newTotalUnits;

      playerGame.portfolio[portfolioIndex].units = newTotalUnits;
      playerGame.portfolio[portfolioIndex].averagePrice = parseFloat(
        newAvgPrice.toFixed(2)
      );
    } else {
      playerGame.portfolio.push({
        stock: stockSymbol,
        units,
        averagePrice: parseFloat(currentPrice.toFixed(2)),
      });
    }

    // Add to transaction history
    playerGame.transactionHistory.push({
      round: transactionRound,
      type: "buy",
      stock: stockSymbol,
      units,
      price: parseFloat(currentPrice.toFixed(2)),
      timestamp: new Date(),
    });

    await playerGame.save();

    res.status(200).json({
      success: true,
      message: "Stock purchased successfully",
      playerGame,
    });
  } catch (error) {
    next(error);
  }
};

// User: Sell stocks (only if time remaining > 0)
export const sellStock = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const { stockSymbol, units } = req.body;

    if (!units || units <= 0) {
      return next(new ErrorHandler("Invalid number of units", 400));
    }

    const gameConfig = await GameConfig.findById(gameId);
    if (!gameConfig || !gameConfig.isActive) {
      return next(new ErrorHandler("Game is not active", 400));
    }

    // Check if time has expired for current round
    if (gameConfig.roundStartTime) {
      const timeElapsed =
        Date.now() - new Date(gameConfig.roundStartTime).getTime();
      const timeRemaining = gameConfig.roundDuration * 1000 - timeElapsed;

      if (timeRemaining <= 0) {
        return next(
          new ErrorHandler(
            "Time expired for this round. Waiting for admin to advance to next round.",
            400
          )
        );
      }
    }

    const stock = gameConfig.stocks.find((s) => s.symbol === stockSymbol);
    if (!stock) {
      return next(new ErrorHandler("Stock not found", 404));
    }

    const playerGame = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
      isActive: true,
    });

    if (!playerGame) {
      return next(new ErrorHandler("You haven't joined this game", 400));
    }

    // Check if player owns the stock
    const portfolioIndex = playerGame.portfolio.findIndex(
      (p) => p.stock === stockSymbol
    );

    if (
      portfolioIndex < 0 ||
      playerGame.portfolio[portfolioIndex].units < units
    ) {
      return next(new ErrorHandler("Insufficient stock units", 400));
    }

    const transactionRound = gameConfig.currentRound;

    // Calculate current stock price
    let currentPrice = stock.initialPrice;
    for (let i = 0; i < transactionRound; i++) {
      currentPrice = currentPrice * (1 + stock.percentChanges[i] / 100);
    }

    const totalRevenue = currentPrice * units;

    // Update balance
    playerGame.balance += totalRevenue;

    // Update portfolio
    playerGame.portfolio[portfolioIndex].units -= units;

    // Remove from portfolio if units become 0
    if (playerGame.portfolio[portfolioIndex].units === 0) {
      playerGame.portfolio.splice(portfolioIndex, 1);
    }

    // Add to transaction history
    playerGame.transactionHistory.push({
      round: transactionRound,
      type: "sell",
      stock: stockSymbol,
      units,
      price: parseFloat(currentPrice.toFixed(2)),
      timestamp: new Date(),
    });

    await playerGame.save();

    res.status(200).json({
      success: true,
      message: "Stock sold successfully",
      playerGame,
    });
  } catch (error) {
    next(error);
  }
};

// Get leaderboard (accessible throughout the game)
export const getLeaderboard = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const gameConfig = await GameConfig.findById(gameId);
    if (!gameConfig) {
      return next(new ErrorHandler("Game not found", 404));
    }

    const players = await PlayerGame.find({ gameConfig: gameId })
      .populate("user", "name email")
      .sort({ finalScore: -1 })
      .limit(100);

    // Calculate current scores for active games
    if (gameConfig.isActive) {
      for (let player of players) {
        if (player.isActive) {
          player.finalScore = calculateCurrentScore(player, gameConfig);
        }
      }
      // Re-sort by updated scores
      players.sort((a, b) => b.finalScore - a.finalScore);
    }

    res.status(200).json({
      success: true,
      leaderboard: players,
      gameStatus: gameConfig.status,
    });
  } catch (error) {
    next(error);
  }
};

// Get all scheduled/active games
export const getActiveGames = async (req, res, next) => {
  try {
    const games = await GameConfig.find({
      status: { $in: ["scheduled", "active"] },
    }).sort({ scheduledStartTime: 1 });

    res.status(200).json({
      success: true,
      games,
    });
  } catch (error) {
    next(error);
  }
};

// Get all games (for admin)
export const getAllGames = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admins can view all games", 403));
    }

    const games = await GameConfig.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      games,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's game history
export const getMyGames = async (req, res, next) => {
  try {
    const games = await PlayerGame.find({ user: req.user._id })
      .populate("gameConfig")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      games,
    });
  } catch (error) {
    next(error);
  }
};

// Get specific game details
export const getGameDetails = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const gameConfig = await GameConfig.findById(gameId);
    if (!gameConfig) {
      return next(new ErrorHandler("Game not found", 404));
    }

    const playerGame = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
    });

    // Calculate final stock prices
    const finalStockPrices = gameConfig.stocks.map((stock) => {
      let finalPrice = stock.initialPrice;
      const roundsToCalculate = gameConfig.isActive
        ? gameConfig.currentRound
        : gameConfig.totalRounds;

      for (let i = 0; i < roundsToCalculate; i++) {
        finalPrice = finalPrice * (1 + stock.percentChanges[i] / 100);
      }

      return {
        name: stock.name,
        symbol: stock.symbol,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        totalChange: parseFloat(
          (
            ((finalPrice - stock.initialPrice) / stock.initialPrice) *
            100
          ).toFixed(2)
        ),
      };
    });

    res.status(200).json({
      success: true,
      gameConfig,
      playerGame,
      stocks: finalStockPrices,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate current score (during game)
function calculateCurrentScore(playerGame, gameConfig) {
  let portfolioValue = 0;

  for (const holding of playerGame.portfolio) {
    const stock = gameConfig.stocks.find((s) => s.symbol === holding.stock);
    if (stock) {
      let currentPrice = stock.initialPrice;
      for (let i = 0; i < gameConfig.currentRound; i++) {
        currentPrice = currentPrice * (1 + stock.percentChanges[i] / 100);
      }
      portfolioValue += holding.units * currentPrice;
    }
  }

  return parseFloat((playerGame.balance + portfolioValue).toFixed(2));
}

// Helper function to calculate final score (game ended)
function calculateFinalScore(playerGame, gameConfig) {
  let portfolioValue = 0;

  for (const holding of playerGame.portfolio) {
    const stock = gameConfig.stocks.find((s) => s.symbol === holding.stock);
    if (stock) {
      let finalPrice = stock.initialPrice;
      for (let i = 0; i < gameConfig.totalRounds; i++) {
        finalPrice = finalPrice * (1 + stock.percentChanges[i] / 100);
      }
      portfolioValue += holding.units * finalPrice;
    }
  }

  return parseFloat((playerGame.balance + portfolioValue).toFixed(2));
}
