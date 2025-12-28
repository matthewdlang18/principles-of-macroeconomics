/**
 * Advanced Mathematical Economics Terms for Econ Words
 * This file contains advanced mathematical terms extracted from Excel spreadsheets and problem sets
 */

// Define the advanced math terms data - use window.ADVANCED_MATH_TERMS to avoid redeclaration
// Check if it's already defined first
if (typeof window.ADVANCED_MATH_TERMS === 'undefined') {
    window.ADVANCED_MATH_TERMS = [];
}

// Add terms to the global ADVANCED_MATH_TERMS array
(function() {
    const advancedMathTermsData = [
    // Midterm 1 Spreadsheet Terms
    {
        term: 'GDPGROWTH',
        definition: 'The annual percentage change in real GDP, measuring the rate of economic expansion or contraction.',
        source: 'Midterm1Spreadsheet',
        page: 1,
        type: 'math',
        difficulty: 4,
        formula: 'GDP Growth = [(GDP_t - GDP_{t-1}) / GDP_{t-1}] × 100%'
    },
    {
        term: 'INFLATION',
        definition: 'The rate at which the general level of prices for goods and services is rising, eroding purchasing power.',
        source: 'Midterm1Spreadsheet',
        page: 1,
        type: 'math',
        difficulty: 4,
        formula: 'Inflation Rate = [(CPI_t - CPI_{t-1}) / CPI_{t-1}] × 100%'
    },
    {
        term: 'REALWAGE',
        definition: 'Wages adjusted for inflation, representing the purchasing power of income in terms of goods and services.',
        source: 'Midterm1Spreadsheet',
        page: 1,
        type: 'math',
        difficulty: 4,
        formula: 'Real Wage = Nominal Wage / Price Level'
    },
    {
        term: 'OUTPUTGAP',
        definition: 'The difference between actual GDP and potential GDP, expressed as a percentage of potential GDP.',
        source: 'Midterm1Spreadsheet',
        page: 2,
        type: 'math',
        difficulty: 5,
        formula: 'Output Gap = [(Actual GDP - Potential GDP) / Potential GDP] × 100%'
    },
    {
        term: 'SACRIFICE',
        definition: 'The sacrifice ratio measures the cumulative percentage loss in output that occurs when the inflation rate is reduced by one percentage point.',
        source: 'Midterm1Spreadsheet',
        page: 2,
        type: 'math',
        difficulty: 5,
        formula: 'Sacrifice Ratio = ∑(Output Gap) / ∆Inflation'
    },
    {
        term: 'VELOCITY',
        definition: 'The rate at which money changes hands in an economy, measuring the number of times a unit of currency is used in transactions over a specific period.',
        source: 'Midterm1Spreadsheet',
        page: 2,
        type: 'math',
        difficulty: 4,
        formula: 'V = (P × Y) / M'
    },

    // Final Algorithm Terms
    {
        term: 'EULER',
        definition: 'The Euler equation in macroeconomics relates the marginal utility of consumption across time periods, forming the basis for intertemporal optimization.',
        source: 'FinalAlgorithm',
        page: 1,
        type: 'math',
        difficulty: 5,
        formula: 'u\'(c_t) = β(1+r)u\'(c_{t+1})'
    },
    {
        term: 'RAMSEY',
        definition: 'The Ramsey model is a neoclassical growth model that determines the optimal savings rate by maximizing the discounted utility of consumption over an infinite horizon.',
        source: 'FinalAlgorithm',
        page: 1,
        type: 'math',
        difficulty: 5,
        formula: 'max ∫_{0}^{∞} e^{-ρt}u(c_t)dt subject to k̇ = f(k) - c - (n+δ)k'
    },
    {
        term: 'RICARDIAN',
        definition: 'Ricardian Equivalence suggests that government deficit spending will be offset by increased private saving, leaving total demand unchanged.',
        source: 'FinalAlgorithm',
        page: 2,
        type: 'math',
        difficulty: 5,
        formula: '∑_{t=0}^{∞} G_t(1+r)^{-t} = ∑_{t=0}^{∞} T_t(1+r)^{-t}'
    },
    {
        term: 'DSGE',
        definition: 'Dynamic Stochastic General Equilibrium models are used to explain aggregate economic phenomena based on macroeconomic models derived from microeconomic principles.',
        source: 'FinalAlgorithm',
        page: 2,
        type: 'math',
        difficulty: 5,
        formula: 'E_t[∑_{j=0}^{∞} β^j U(c_{t+j}, l_{t+j})]'
    },
    {
        term: 'CALVO',
        definition: 'The Calvo pricing model assumes that in each period, a random fraction of firms can reset their prices while others keep prices unchanged, creating price stickiness.',
        source: 'FinalAlgorithm',
        page: 3,
        type: 'math',
        difficulty: 5,
        formula: 'P_t = θP_{t-1} + (1-θ)P_t*'
    },
    {
        term: 'ROMER',
        definition: 'The Romer model of endogenous growth incorporates technological progress as an endogenous outcome of economic activities, particularly R&D investment.',
        source: 'FinalAlgorithm',
        page: 3,
        type: 'math',
        difficulty: 5,
        formula: 'Y = A × K^α × H^β × L^γ'
    },
    {
        term: 'OVERLAPPING',
        definition: 'Overlapping Generations (OLG) models analyze how different generations interact in an economy, particularly focusing on saving and consumption decisions across lifetimes.',
        source: 'FinalAlgorithm',
        page: 4,
        type: 'math',
        difficulty: 5,
        formula: 'max U(c_t^y, c_{t+1}^o) subject to c_t^y + s_t = w_t and c_{t+1}^o = (1+r_{t+1})s_t'
    },
    {
        term: 'BELLMAN',
        definition: 'The Bellman equation is a functional equation that describes the optimal value of a dynamic programming problem as a function of the state variables.',
        source: 'FinalAlgorithm',
        page: 4,
        type: 'math',
        difficulty: 5,
        formula: 'V(x) = max_{a∈A(x)} {F(x,a) + βV(T(x,a))}'
    },
    {
        term: 'RATIONAL',
        definition: 'Rational Expectations theory assumes that economic agents make decisions based on all available information and their understanding of how the economy works.',
        source: 'FinalAlgorithm',
        page: 5,
        type: 'math',
        difficulty: 4,
        formula: 'E[P_{t+1}|I_t] = P_{t+1}^e'
    },
    {
        term: 'KALDOR',
        definition: 'Kaldor facts are six empirical regularities of economic growth that models should be able to explain, including constant capital-output ratio and labor share.',
        source: 'FinalAlgorithm',
        page: 5,
        type: 'math',
        difficulty: 4,
        formula: 'K/Y ≈ constant, rK/Y ≈ constant'
    },
    {
        term: 'DIAMOND',
        definition: 'The Diamond-Mortensen-Pissarides model explains unemployment as the result of search frictions in the labor market.',
        source: 'FinalAlgorithm',
        page: 6,
        type: 'math',
        difficulty: 5,
        formula: 'u = s/(s+f)'
    },
    {
        term: 'PERMANENT',
        definition: 'The Permanent Income Hypothesis states that people base consumption on what they consider their "normal" income, smoothing consumption over their lifetime.',
        source: 'FinalAlgorithm',
        page: 6,
        type: 'math',
        difficulty: 4,
        formula: 'C_t = r/(1+r) × [A_t + ∑_{i=0}^{∞} Y_{t+i}^e/(1+r)^i]'
    }
];

    // Add all terms to the global ADVANCED_MATH_TERMS array
    advancedMathTermsData.forEach(term => {
        // Add the correct game type
        const termWithType = {
            ...term,
            type: GAME_TYPES.MATH
        };
        window.ADVANCED_MATH_TERMS.push(termWithType);
    });

    // Function to get all advanced math terms
    window.getAllAdvancedMathTerms = function() {
        return window.ADVANCED_MATH_TERMS;
    };

    // Function to get a random advanced math term
    window.getRandomAdvancedMathTerm = function() {
        const randomIndex = Math.floor(Math.random() * window.ADVANCED_MATH_TERMS.length);
        return window.ADVANCED_MATH_TERMS[randomIndex];
    };

    // Function to get a daily advanced math term
    window.getDailyAdvancedMathTerm = function() {
        // Get today's date as a string (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Use the date to deterministically select a term
        const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
        const termIndex = dateHash % window.ADVANCED_MATH_TERMS.length;

        return window.ADVANCED_MATH_TERMS[termIndex];
    };
})();
