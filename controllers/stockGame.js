import { GameConfig, PlayerGame } from "../models/stockGame.js";
import ErrorHandler from "../middlewares/error.js";

// Admin: Create/Update game configuration
export const createGameConfig = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return next(new ErrorHandler("Only admins can create game config", 403));
    }

    const { stocks, initialBalance, roundDuration, totalRounds } = req.body;

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

    const gameConfig = await GameConfig.create({
      stocks,
      initialBalance: initialBalance || 100000,
      roundDuration: roundDuration || 30,
      totalRounds: totalRounds || 10,
      isActive: false,
      currentRound: 0,
    });

    res.status(201).json({
      success: true,
      message: "Game configuration created successfully",
      gameConfig,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Start the game
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

    gameConfig.isActive = true;
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

    if (gameConfig.currentRound >= gameConfig.totalRounds - 1) {
      // End game
      gameConfig.isActive = false;
      await gameConfig.save();

      // Calculate final scores for all players
      const players = await PlayerGame.find({
        gameConfig: gameId,
        isActive: true,
      });

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

    // Update all active players' current round
    await PlayerGame.updateMany(
      { gameConfig: gameId, isActive: true },
      { currentRound: gameConfig.currentRound }
    );

    res.status(200).json({
      success: true,
      message: `Advanced to round ${gameConfig.currentRound}`,
      gameConfig,
    });
  } catch (error) {
    next(error);
  }
};

// User: Join the game
export const joinGame = async (req, res, next) => {
  try {
    const { gameId } = req.params;
    const gameConfig = await GameConfig.findById(gameId);

    if (!gameConfig) {
      return next(new ErrorHandler("Game configuration not found", 404));
    }

    if (!gameConfig.isActive) {
      return next(new ErrorHandler("Game is not active", 400));
    }

    // Check if user already joined
    const existingPlayer = await PlayerGame.findOne({
      user: req.user._id,
      gameConfig: gameId,
      isActive: true,
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
      isActive: true,
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
    const timeElapsed =
      Date.now() - new Date(gameConfig.roundStartTime).getTime();
    const timeRemaining = Math.max(
      0,
      gameConfig.roundDuration * 1000 - timeElapsed
    );

    res.status(200).json({
      success: true,
      gameConfig: {
        currentRound: gameConfig.currentRound,
        totalRounds: gameConfig.totalRounds,
        isActive: gameConfig.isActive,
        timeRemaining: Math.floor(timeRemaining / 1000), // in seconds
      },
      stocks: currentStockPrices,
      playerGame,
    });
  } catch (error) {
    next(error);
  }
};

// User: Buy stocks
export const buyStock = async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.params.gameId);
    const { gameId } = req.params;
    const { stockSymbol, units } = req.body;

    if (!units || units <= 0) {
      return next(new ErrorHandler("Invalid number of units", 400));
    }

    const gameConfig = await GameConfig.findById(gameId);
    if (!gameConfig || !gameConfig.isActive) {
      return next(new ErrorHandler("Game is not active", 400));
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

    // Calculate current stock price
    let currentPrice = stock.initialPrice;
    for (let i = 0; i < gameConfig.currentRound; i++) {
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
      round: gameConfig.currentRound,
      type: "buy",
      stock: stockSymbol,
      units,
      price: parseFloat(currentPrice.toFixed(2)),
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

// User: Sell stocks
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

    // Calculate current stock price
    let currentPrice = stock.initialPrice;
    for (let i = 0; i < gameConfig.currentRound; i++) {
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
      round: gameConfig.currentRound,
      type: "sell",
      stock: stockSymbol,
      units,
      price: parseFloat(currentPrice.toFixed(2)),
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

// Get leaderboard
export const getLeaderboard = async (req, res, next) => {
  try {
    const { gameId } = req.params;

    const players = await PlayerGame.find({ gameConfig: gameId })
      .populate("user", "name email")
      .sort({ finalScore: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      leaderboard: players,
    });
  } catch (error) {
    next(error);
  }
};

// Get all active games
export const getActiveGames = async (req, res, next) => {
  try {
    const games = await GameConfig.find({ isActive: true });

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

// Helper function to calculate final score
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
