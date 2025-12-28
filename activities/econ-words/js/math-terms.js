/**
 * Mathematical Economics Terms for Econ Words
 * This file contains mathematical terms extracted from textbook chapters and problem sets
 */

// Define the math terms data - use window.MATH_TERMS to avoid redeclaration
// Check if it's already defined first
if (typeof window.MATH_TERMS === 'undefined') {
    window.MATH_TERMS = [];
}

// Add terms to the global MATH_TERMS array
(function() {
    const mathTermsData = [
    // Week 1 Review Session Terms
    {
        term: 'MPC',
        definition: 'Marginal Propensity to Consume - the proportion of an increase in income that is spent on consumption.',
        source: 'Review Session Week 1',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'MPC = ΔC/ΔY'
    },
    {
        term: 'MPS',
        definition: 'Marginal Propensity to Save - the proportion of an increase in income that is saved rather than consumed.',
        source: 'Review Session Week 1',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'MPS = ΔS/ΔY = 1 - MPC'
    },
    {
        term: 'MULTIPLIER',
        definition: 'The factor by which an initial change in spending creates a larger final change in GDP.',
        source: 'Review Session Week 1',
        page: 4,
        type: 'math',
        difficulty: 2,
        formula: 'Multiplier = 1/(1-MPC) = 1/MPS'
    },

    // Week 2 Review Session Terms
    {
        term: 'IS',
        definition: 'Investment-Saving curve - shows combinations of interest rates and output where the goods market is in equilibrium.',
        source: 'Review Session Week 2',
        page: 2,
        type: 'math',
        difficulty: 3,
        formula: 'Y = C(Y-T) + I(r) + G'
    },
    {
        term: 'LM',
        definition: 'Liquidity preference-Money supply curve - shows combinations of interest rates and output where the money market is in equilibrium.',
        source: 'Review Session Week 2',
        page: 3,
        type: 'math',
        difficulty: 3,
        formula: 'M/P = L(r,Y)'
    },
    {
        term: 'ISLM',
        definition: 'IS-LM model - a macroeconomic tool that shows the relationship between interest rates and real output in the goods and money markets.',
        source: 'Review Session Week 2',
        page: 4,
        type: 'math',
        difficulty: 3,
        formula: 'IS: Y = C(Y-T) + I(r) + G, LM: M/P = L(r,Y)'
    },

    // Week 3 Review Session Terms
    {
        term: 'AD',
        definition: 'Aggregate Demand - the total demand for final goods and services in an economy at a given time and price level.',
        source: 'Review Session Week 3',
        page: 2,
        type: 'math',
        difficulty: 2,
        formula: 'AD: P = f(Y) [downward sloping]'
    },
    {
        term: 'AS',
        definition: 'Aggregate Supply - the total supply of goods and services that firms in an economy plan to sell during a specific time period.',
        source: 'Review Session Week 3',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'AS: P = f(Y) [upward sloping]'
    },
    {
        term: 'PHILLIPS',
        definition: 'Phillips Curve - a curve showing the inverse relationship between the rate of unemployment and the rate of inflation.',
        source: 'Review Session Week 3',
        page: 5,
        type: 'math',
        difficulty: 3,
        formula: 'π = π^e - β(u-u^n)'
    },

    // Week 4 Review Session Terms
    {
        term: 'SOLOW',
        definition: 'Solow Growth Model - a model explaining long-run economic growth through capital accumulation, labor growth, and technological progress.',
        source: 'Review Session Week 4',
        page: 2,
        type: 'math',
        difficulty: 3,
        formula: 'Y = F(K,L,A) = K^α(AL)^(1-α)'
    },
    {
        term: 'GOLDEN',
        definition: 'Golden Rule level of capital - the steady state that maximizes consumption per effective worker.',
        source: 'Review Session Week 4',
        page: 4,
        type: 'math',
        difficulty: 3,
        formula: 'MPK = δ + n + g'
    },
    {
        term: 'TFP',
        definition: 'Total Factor Productivity - a measure of the efficiency with which inputs are used in production.',
        source: 'Review Session Week 4',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'A = Y/(K^α·L^(1-α))'
    },

    // Week 6 Review Session Terms
    {
        term: 'FISHER',
        definition: 'Fisher Equation - the relationship between nominal interest rate, real interest rate, and inflation.',
        source: 'Review Session Week 6',
        page: 2,
        type: 'math',
        difficulty: 2,
        formula: 'i = r + π'
    },
    {
        term: 'QUANTITY',
        definition: 'Quantity Theory of Money - the relationship between money supply, velocity, price level, and output.',
        source: 'Review Session Week 6',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'M·V = P·Y'
    },
    {
        term: 'MONEY',
        definition: 'Money Multiplier - the amount of money the banking system generates with each dollar of reserves.',
        source: 'Review Session Week 6',
        page: 4,
        type: 'math',
        difficulty: 2,
        formula: 'Money Multiplier = 1/RR'
    },

    // Week 7 Review Session Terms
    {
        term: 'TAYLOR',
        definition: 'Taylor Rule - a formula that suggests how central banks should set interest rates based on inflation and output gaps.',
        source: 'Review Session Week 7',
        page: 2,
        type: 'math',
        difficulty: 3,
        formula: 'i = r* + π + a(π-π*) + b(y-y*)'
    },
    {
        term: 'OKUN',
        definition: 'Okun\'s Law - the relationship between unemployment and GDP growth.',
        source: 'Review Session Week 7',
        page: 4,
        type: 'math',
        difficulty: 3,
        formula: 'ΔU = -β(g-g*)'
    },
    {
        term: 'NAIRU',
        definition: 'Non-Accelerating Inflation Rate of Unemployment - the level of unemployment below which inflation rises.',
        source: 'Review Session Week 7',
        page: 5,
        type: 'math',
        difficulty: 3,
        formula: 'π = π^e + α(U* - U)'
    },

    // Week 8 Review Session Terms
    {
        term: 'UIP',
        definition: 'Uncovered Interest Parity - the relationship between interest rates and expected changes in exchange rates.',
        source: 'Review Session Week 8',
        page: 2,
        type: 'math',
        difficulty: 3,
        formula: 'i = i* + (E[e₊₁] - e)/e'
    },
    {
        term: 'PPP',
        definition: 'Purchasing Power Parity - a theory that exchange rates between currencies are in equilibrium when their purchasing power is the same in each country.',
        source: 'Review Session Week 8',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'e = P/P*'
    },
    {
        term: 'MUNDELL',
        definition: 'Mundell-Fleming Model - an economic model that describes the relationship between an economy\'s nominal exchange rate, interest rate, and output.',
        source: 'Review Session Week 8',
        page: 4,
        type: 'math',
        difficulty: 3,
        formula: 'IS: Y = C(Y-T) + I(r) + G + NX(e), LM: M/P = L(r,Y)'
    },

    // Week 9 Review Session Terms
    {
        term: 'GINI',
        definition: 'Gini Coefficient - a measure of statistical dispersion intended to represent the income or wealth inequality within a nation or group.',
        source: 'Week9ReviewSession',
        page: 2,
        type: 'math',
        difficulty: 2,
        formula: 'G = A/(A+B)'
    },
    {
        term: 'LORENZ',
        definition: 'Lorenz Curve - a graphical representation of income or wealth distribution.',
        source: 'Week9ReviewSession',
        page: 2,
        type: 'math',
        difficulty: 2,
        formula: 'L(p) = cumulative income share of bottom p% of population'
    },
    {
        term: 'HDI',
        definition: 'Human Development Index - a statistic composite index of life expectancy, education, and per capita income indicators.',
        source: 'Week9ReviewSession',
        page: 3,
        type: 'math',
        difficulty: 2,
        formula: 'HDI = (L^(1/3) · E^(1/3) · Y^(1/3))'
    },

    // Week 10 Review Session Terms
    {
        term: 'NASH',
        definition: 'Nash Equilibrium - a solution concept in game theory where no player has an incentive to deviate from their chosen strategy.',
        source: 'Week10ReviewSession',
        page: 2,
        type: 'math',
        difficulty: 3,
        formula: 'u_i(s_i*,s_-i*) ≥ u_i(s_i,s_-i*)'
    },
    {
        term: 'PARETO',
        definition: 'Pareto Efficiency - a state of allocation of resources where it is impossible to make any one individual better off without making at least one individual worse off.',
        source: 'Week10ReviewSession',
        page: 3,
        type: 'math',
        difficulty: 3,
        formula: 'No allocation Y exists such that U_i(Y) ≥ U_i(X) for all i with at least one strict inequality'
    },
    {
        term: 'COASE',
        definition: 'Coase Theorem - a legal and economic theory that states that where there are complete competitive markets with no transactions costs, an efficient set of inputs and outputs will be chosen regardless of how property rights are divided.',
        source: 'Week10ReviewSession',
        page: 4,
        type: 'math',
        difficulty: 3,
        formula: 'Social Cost = Private Cost + External Cost'
    }
];

    // Add all terms to the global MATH_TERMS array
    mathTermsData.forEach(term => {
        // Add the correct game type
        const termWithType = {
            ...term,
            type: GAME_TYPES.MATH
        };
        window.MATH_TERMS.push(termWithType);
    });

    // Function to get all math terms
    window.getAllMathTerms = function() {
        return window.MATH_TERMS;
    };

    // Function to get a random math term
    window.getRandomMathTerm = function() {
        const randomIndex = Math.floor(Math.random() * window.MATH_TERMS.length);
        return window.MATH_TERMS[randomIndex];
    };

    // Function to get a daily math term
    window.getDailyMathTerm = function() {
        // Get today's date as a string (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Use the date to deterministically select a term
        const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
        const termIndex = dateHash % window.MATH_TERMS.length;

        return window.MATH_TERMS[termIndex];
    };
})();
