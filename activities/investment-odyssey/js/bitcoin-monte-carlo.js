// Bitcoin Monte Carlo Simulation
// This script runs multiple simulations of Bitcoin returns over 20 years (80 quarters)
// and analyzes the distribution of returns and final values

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
    } else if (bitcoinPrice >= 1000000) {
        // Very high price: crash
        bitcoinReturn = -0.3 - Math.random() * 0.2; // Return between -30% and -50%
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
            const adjustedStdDev = assetReturns['Bitcoin'].stdDev * (1 - volatilityReduction);

            // Use a skewed distribution to avoid clustering around the mean
            // This creates more varied returns while still respecting the reduced volatility
            const u1 = Math.random();
            const u2 = Math.random();
            const normalRandom = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            // Adjust the mean based on price to create more varied returns
            const adjustedMean = assetReturns['Bitcoin'].mean * (0.5 + (Math.random() * 0.5));

            // Recalculate return with reduced volatility and varied mean
            bitcoinReturn = adjustedMean + (normalRandom * adjustedStdDev);
        }

        // Check for Bitcoin crash (4-year cycle)
        if (gameState.roundNumber - gameState.lastBitcoinCrashRound >= 4) {
            if (Math.random() < 0.5) { // 50% chance of crash after 4 rounds
                // Apply shock based on current shock range
                bitcoinReturn = gameState.bitcoinShockRange[0] + Math.random() * (gameState.bitcoinShockRange[1] - gameState.bitcoinShockRange[0]);

                // Update last crash round
                gameState.lastBitcoinCrashRound = gameState.roundNumber;

                // Update shock range for next crash (less severe but still negative)
                gameState.bitcoinShockRange = [
                    Math.min(Math.max(gameState.bitcoinShockRange[0] + 0.1, -0.5), -0.05),
                    Math.min(Math.max(gameState.bitcoinShockRange[1] + 0.1, -0.75), -0.15)
                ];
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
        // This will give a value between approximately -0.68 and -0.78 for min = -0.73
    } else if (bitcoinReturn >= max - 0.01) {
        // Choose a random value between max-5% and max+5%
        bitcoinReturn = max + (Math.random() * 0.1 - 0.05) * max;
        // This will give a value between approximately 2.4 and 2.6 for max = 2.5
    } else {
        // Normal case - just ensure it's within bounds
        bitcoinReturn = Math.max(min, Math.min(max, bitcoinReturn));
    }

    return bitcoinReturn;
}

// Run a single simulation for specified number of rounds
function runSingleSimulation(rounds = 80) {
    // Reset game state
    gameState = {
        roundNumber: 0,
        assetPrices: {
            'Bitcoin': 50000
        },
        priceHistory: {
            'Bitcoin': []
        },
        lastBitcoinCrashRound: 0,
        bitcoinShockRange: [-0.5, -0.75]
    };

    // Initialize price history with initial price
    gameState.priceHistory['Bitcoin'].push(gameState.assetPrices['Bitcoin']);

    // Track returns for each round
    const returns = [];

    for (let i = 1; i <= rounds; i++) {
        gameState.roundNumber = i;

        // Generate return
        const bitcoinReturn = generateBitcoinReturn();
        returns.push(bitcoinReturn);

        // Apply return to price
        const newPrice = gameState.assetPrices['Bitcoin'] * (1 + bitcoinReturn);
        gameState.assetPrices['Bitcoin'] = newPrice;
        gameState.priceHistory['Bitcoin'].push(newPrice);
    }

    // Calculate final value and total return
    const initialPrice = gameState.priceHistory['Bitcoin'][0];
    const finalPrice = gameState.priceHistory['Bitcoin'][rounds];
    const totalReturn = (finalPrice - initialPrice) / initialPrice;

    // Calculate compound annual growth rate (CAGR)
    // 80 quarters = 20 years
    const years = rounds / 4;
    const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;

    return {
        initialPrice,
        finalPrice,
        totalReturn,
        cagr,
        returns,
        priceHistory: [...gameState.priceHistory['Bitcoin']]
    };
}

// Run multiple simulations and analyze results
function runMonteCarloSimulation(numSimulations = 1000, rounds = 80) {
    console.log(`Running ${numSimulations} Monte Carlo simulations of Bitcoin over ${rounds} quarters (${rounds/4} years)...`);

    const results = [];
    const finalPrices = [];
    const totalReturns = [];
    const cagrs = [];
    const allReturns = [];

    // Track best and worst cases
    let bestCase = { totalReturn: -1 };
    let worstCase = { totalReturn: Number.MAX_VALUE };

    for (let i = 0; i < numSimulations; i++) {
        const result = runSingleSimulation(rounds);
        results.push(result);

        finalPrices.push(result.finalPrice);
        totalReturns.push(result.totalReturn);
        cagrs.push(result.cagr);
        allReturns.push(...result.returns);

        // Update best and worst cases
        if (result.totalReturn > bestCase.totalReturn) {
            bestCase = result;
        }
        if (result.totalReturn < worstCase.totalReturn) {
            worstCase = result;
        }

        // Show progress
        if ((i + 1) % 100 === 0) {
            console.log(`Completed ${i + 1} simulations...`);
        }
    }

    // Calculate statistics
    const stats = {
        finalPrices: calculateStats(finalPrices),
        totalReturns: calculateStats(totalReturns),
        cagrs: calculateStats(cagrs),
        quarterlyReturns: calculateStats(allReturns)
    };

    // Print results
    console.log("\n----------------------------------------");
    console.log("MONTE CARLO SIMULATION RESULTS");
    console.log("----------------------------------------");

    console.log("\nFinal Bitcoin Price Statistics (after 20 years):");
    console.log(`Minimum: $${stats.finalPrices.min.toFixed(2)}`);
    console.log(`Maximum: $${stats.finalPrices.max.toFixed(2)}`);
    console.log(`Mean: $${stats.finalPrices.mean.toFixed(2)}`);
    console.log(`Median: $${stats.finalPrices.median.toFixed(2)}`);
    console.log(`Standard Deviation: $${stats.finalPrices.stdDev.toFixed(2)}`);

    console.log("\nTotal Return Statistics (over 20 years):");
    console.log(`Minimum: ${(stats.totalReturns.min * 100).toFixed(2)}%`);
    console.log(`Maximum: ${(stats.totalReturns.max * 100).toFixed(2)}%`);
    console.log(`Mean: ${(stats.totalReturns.mean * 100).toFixed(2)}%`);
    console.log(`Median: ${(stats.totalReturns.median * 100).toFixed(2)}%`);
    console.log(`Standard Deviation: ${(stats.totalReturns.stdDev * 100).toFixed(2)}%`);

    console.log("\nCompound Annual Growth Rate (CAGR) Statistics:");
    console.log(`Minimum: ${(stats.cagrs.min * 100).toFixed(2)}%`);
    console.log(`Maximum: ${(stats.cagrs.max * 100).toFixed(2)}%`);
    console.log(`Mean: ${(stats.cagrs.mean * 100).toFixed(2)}%`);
    console.log(`Median: ${(stats.cagrs.median * 100).toFixed(2)}%`);
    console.log(`Standard Deviation: ${(stats.cagrs.stdDev * 100).toFixed(2)}%`);

    console.log("\nQuarterly Return Statistics:");
    console.log(`Minimum: ${(stats.quarterlyReturns.min * 100).toFixed(2)}%`);
    console.log(`Maximum: ${(stats.quarterlyReturns.max * 100).toFixed(2)}%`);
    console.log(`Mean: ${(stats.quarterlyReturns.mean * 100).toFixed(2)}%`);
    console.log(`Median: ${(stats.quarterlyReturns.median * 100).toFixed(2)}%`);
    console.log(`Standard Deviation: ${(stats.quarterlyReturns.stdDev * 100).toFixed(2)}%`);

    console.log("\nDistribution of Final Prices:");
    printDistribution(finalPrices, 10, true);

    console.log("\nDistribution of Total Returns:");
    printDistribution(totalReturns, 10, false, true);

    console.log("\nDistribution of CAGRs:");
    printDistribution(cagrs, 10, false, true);

    console.log("\nDistribution of Quarterly Returns:");
    printDistribution(allReturns, 10, false, true);

    console.log("\nBest Case Scenario:");
    console.log(`Initial Price: $${bestCase.initialPrice.toFixed(2)}`);
    console.log(`Final Price: $${bestCase.finalPrice.toFixed(2)}`);
    console.log(`Total Return: ${(bestCase.totalReturn * 100).toFixed(2)}%`);
    console.log(`CAGR: ${(bestCase.cagr * 100).toFixed(2)}%`);

    console.log("\nWorst Case Scenario:");
    console.log(`Initial Price: $${worstCase.initialPrice.toFixed(2)}`);
    console.log(`Final Price: $${worstCase.finalPrice.toFixed(2)}`);
    console.log(`Total Return: ${(worstCase.totalReturn * 100).toFixed(2)}%`);
    console.log(`CAGR: ${(worstCase.cagr * 100).toFixed(2)}%`);

    return {
        results,
        stats,
        bestCase,
        worstCase
    };
}

// Calculate statistics for an array of values
function calculateStats(values) {
    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);

    // Calculate mean
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / sortedValues.length;

    // Calculate median (50th percentile)
    const median = calculatePercentile(sortedValues, 0.5);

    // Calculate standard deviation
    const squaredDiffs = sortedValues.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sortedValues.length;
    const stdDev = Math.sqrt(variance);

    // Calculate min and max
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];

    // Calculate percentiles
    const percentiles = {
        p10: calculatePercentile(sortedValues, 0.1),
        p25: calculatePercentile(sortedValues, 0.25),
        p75: calculatePercentile(sortedValues, 0.75),
        p90: calculatePercentile(sortedValues, 0.9)
    };

    return {
        mean,
        median,
        stdDev,
        min,
        max,
        percentiles
    };
}

// Calculate a specific percentile from sorted values
function calculatePercentile(sortedValues, percentile) {
    const index = Math.floor(percentile * sortedValues.length);
    return sortedValues[index];
}

// Print distribution of values in a histogram
function printDistribution(values, numBins = 10, isDollar = false, isPercent = false) {
    // Find min and max
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate bin width
    const binWidth = (max - min) / numBins;

    // Initialize bins
    const bins = Array(numBins).fill(0);

    // Count values in each bin
    for (const value of values) {
        const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
        bins[binIndex]++;
    }

    // Find the maximum bin count for scaling
    const maxCount = Math.max(...bins);
    const scale = 50; // Maximum number of characters for the bar

    // Print histogram
    for (let i = 0; i < numBins; i++) {
        const lowerBound = min + (i * binWidth);
        const upperBound = min + ((i + 1) * binWidth);

        let lowerBoundStr, upperBoundStr;

        if (isDollar) {
            lowerBoundStr = `$${lowerBound.toFixed(0)}`;
            upperBoundStr = `$${upperBound.toFixed(0)}`;
        } else if (isPercent) {
            lowerBoundStr = `${(lowerBound * 100).toFixed(1)}%`;
            upperBoundStr = `${(upperBound * 100).toFixed(1)}%`;
        } else {
            lowerBoundStr = lowerBound.toFixed(2);
            upperBoundStr = upperBound.toFixed(2);
        }

        const count = bins[i];
        const percentage = (count / values.length) * 100;
        const barLength = Math.round((count / maxCount) * scale);
        const bar = '█'.repeat(barLength);

        console.log(`${lowerBoundStr.padStart(10)} - ${upperBoundStr.padStart(10)}: ${count.toString().padStart(5)} (${percentage.toFixed(1)}%) ${bar}`);
    }
}

// Run the Monte Carlo simulation with 1000 simulations over 80 quarters (20 years)
runMonteCarloSimulation(1000, 80);
