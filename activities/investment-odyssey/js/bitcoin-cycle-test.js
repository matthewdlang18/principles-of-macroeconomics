// Bitcoin Cycle Test Script
// This script simulates multiple rounds of the game to verify the 4-year Bitcoin cycle

// Import necessary functions from game-core.js
// Note: This is a standalone test script, so we'll recreate the necessary parts

// Mock game state
let gameState = {
    roundNumber: 0,
    assetPrices: {
        'Bitcoin': 50000
    },
    priceHistory: {
        'Bitcoin': []
    },
    lastBitcoinCrashRound: 0,
    bitcoinShockRange: [-0.5, -0.75] // Initial shock range for Bitcoin crashes
};

// Mock asset returns configuration
const assetReturns = {
    'Bitcoin': {
        mean: 0.50,
        stdDev: 1.00,
        min: -0.73,
        max: 2.50
    }
};

// Simplified function to generate Bitcoin returns
function generateBitcoinReturn() {
    const bitcoinPrice = gameState.assetPrices['Bitcoin'];
    let bitcoinReturn;

    // Bitcoin has special growth patterns based on its price
    if (bitcoinPrice < 10000) {
        // Low price: rapid growth
        bitcoinReturn = 2 + Math.random() * 2; // Return between 200% and 400%
        console.log(`Bitcoin price < 10000: Rapid growth return: ${bitcoinReturn.toFixed(2)}`);
    } else if (bitcoinPrice >= 1000000) {
        // Very high price: crash
        bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
        console.log(`Bitcoin price >= 1000000: Crash return: ${bitcoinReturn.toFixed(2)}`);
    } else {
        // Normal price range: simplified random return
        bitcoinReturn = assetReturns['Bitcoin'].mean + (Math.random() * 2 - 1) * assetReturns['Bitcoin'].stdDev;

        // Adjust Bitcoin's return based on its current price
        const priceThreshold = 100000;
        if (bitcoinPrice > priceThreshold) {
            // Calculate how many increments above threshold
            const incrementsAboveThreshold = Math.max(0, (bitcoinPrice - priceThreshold) / 50000);

            // Reduce volatility as price grows (more mature asset)
            const volatilityReduction = Math.min(0.7, incrementsAboveThreshold * 0.05);
            const oldStdDev = assetReturns['Bitcoin'].stdDev;
            const adjustedStdDev = oldStdDev * (1 - volatilityReduction);

            // Use a skewed distribution to avoid clustering around the mean
            // This creates more varied returns while still respecting the reduced volatility
            const u1 = Math.random();
            const u2 = Math.random();
            const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Adjust the mean based on price to create more varied returns
            const oldReturn = bitcoinReturn;
            const adjustedMean = assetReturns['Bitcoin'].mean * (0.5 + (Math.random() * 0.5));

            // Recalculate return with reduced volatility and varied mean
            bitcoinReturn = adjustedMean + (normalRandom * adjustedStdDev);

            console.log(`Bitcoin price > ${priceThreshold}: Original StdDev: ${oldStdDev.toFixed(2)}, Reduced StdDev: ${adjustedStdDev.toFixed(2)}, Adjusted Mean: ${adjustedMean.toFixed(2)}, Old return: ${oldReturn.toFixed(2)}, New return: ${bitcoinReturn.toFixed(2)}`);
        }

        // Check for Bitcoin crash (4-year cycle)
        console.log(`Checking 4-year cycle: Current round: ${gameState.roundNumber}, Last crash: ${gameState.lastBitcoinCrashRound}, Diff: ${gameState.roundNumber - gameState.lastBitcoinCrashRound}`);
        if (gameState.roundNumber - gameState.lastBitcoinCrashRound >= 4) {
            const crashChance = Math.random();
            console.log(`4-year cycle condition met! Crash chance: ${crashChance.toFixed(2)}`);

            if (crashChance < 0.5) { // 50% chance of crash after 4 rounds
                // Apply shock based on current shock range
                const shockMin = gameState.bitcoinShockRange[0];
                const shockMax = gameState.bitcoinShockRange[1];
                bitcoinReturn = shockMin + Math.random() * (shockMax - shockMin);

                // Update last crash round
                gameState.lastBitcoinCrashRound = gameState.roundNumber;

                // Update shock range for next crash (less severe but still negative)
                gameState.bitcoinShockRange = [
                    Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
                    Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
                ];

                console.log(`BITCOIN CRASH in round ${gameState.roundNumber} with return ${bitcoinReturn.toFixed(2)}`);
                console.log(`New shock range: [${gameState.bitcoinShockRange[0].toFixed(2)}, ${gameState.bitcoinShockRange[1].toFixed(2)}]`);
            }
        }
    }

    // Ensure Bitcoin return is within bounds, but avoid exact min/max values
    const min = assetReturns['Bitcoin'].min;
    const max = assetReturns['Bitcoin'].max;

    // We'll use 5% of the min/max values for randomization

    // Check if return would hit min or max exactly or very close to it
    if (bitcoinReturn <= min + 0.01) {
        // Choose a random value between min-5% and min+5%
        bitcoinReturn = min + (Math.random() * 0.1 - 0.05) * Math.abs(min);
        console.log(`Bitcoin return at minimum threshold, randomizing to: ${bitcoinReturn.toFixed(2)}`);
    } else if (bitcoinReturn >= max - 0.01) {
        // Choose a random value between max-5% and max+5%
        bitcoinReturn = max + (Math.random() * 0.1 - 0.05) * max;
        console.log(`Bitcoin return at maximum threshold, randomizing to: ${bitcoinReturn.toFixed(2)}`);
    } else {
        // Normal case - just ensure it's within bounds
        bitcoinReturn = Math.max(min, Math.min(max, bitcoinReturn));
    }

    return bitcoinReturn;
}

// Simple deterministic random function for testing
let randomSeed = 123456789;
function deterministicRandom() {
    randomSeed = (randomSeed * 9301 + 49297) % 233280;
    return randomSeed / 233280;
}

// Override Math.random for deterministic testing
const originalRandom = Math.random;
function enableDeterministicRandom() {
    Math.random = deterministicRandom;
}
function disableDeterministicRandom() {
    Math.random = originalRandom;
}

// Run simulation for 20 rounds
function runSimulation(rounds = 20, useDeterministicRandom = true) {
    console.log("Starting Bitcoin 4-year cycle simulation");
    console.log("----------------------------------------");

    if (useDeterministicRandom) {
        enableDeterministicRandom();
        console.log("Using deterministic random for consistent testing");
    }

    // Initialize price history with initial price
    gameState.priceHistory['Bitcoin'].push(gameState.assetPrices['Bitcoin']);

    for (let i = 1; i <= rounds; i++) {
        gameState.roundNumber = i;
        console.log(`\nROUND ${i}:`);
        console.log(`Current Bitcoin price: $${gameState.assetPrices['Bitcoin'].toFixed(2)}`);

        // Generate return
        const bitcoinReturn = generateBitcoinReturn();
        console.log(`Bitcoin return: ${(bitcoinReturn * 100).toFixed(2)}%`);

        // Apply return to price
        const newPrice = gameState.assetPrices['Bitcoin'] * (1 + bitcoinReturn);
        gameState.assetPrices['Bitcoin'] = newPrice;
        gameState.priceHistory['Bitcoin'].push(newPrice);

        console.log(`New Bitcoin price: $${newPrice.toFixed(2)}`);
    }

    // Print summary
    console.log("\n----------------------------------------");
    console.log("SIMULATION SUMMARY:");
    console.log("----------------------------------------");
    console.log("Bitcoin Price History:");
    for (let i = 0; i <= rounds; i++) {
        console.log(`Round ${i}: $${gameState.priceHistory['Bitcoin'][i].toFixed(2)}`);
    }

    // Calculate returns
    console.log("\nBitcoin Return History:");
    for (let i = 1; i <= rounds; i++) {
        const prevPrice = gameState.priceHistory['Bitcoin'][i-1];
        const currentPrice = gameState.priceHistory['Bitcoin'][i];
        const returnRate = (currentPrice - prevPrice) / prevPrice;
        console.log(`Round ${i}: ${(returnRate * 100).toFixed(2)}%`);
    }
}

// Run the simulation
runSimulation(20);

// Restore original Math.random
disableDeterministicRandom();
