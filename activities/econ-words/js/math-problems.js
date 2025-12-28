/**
 * Mathematical Economics Problems for Econ Words
 * This file contains problem templates with randomly generated values
 */

// Helper function to generate random integer between min and max (inclusive)
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to round to specified decimal places
function roundToDecimal(num, decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
}

// Helper function to generate a random price
function generateRandomPrice(min, max) {
    return getRandomInt(min, max);
}

// Helper function to generate a random quantity
function generateRandomQuantity(min, max) {
    return getRandomInt(min, max);
}

// Define the math problem templates
const MATH_PROBLEM_TEMPLATES = [
    // GDP Calculation Problems
    {
        id: "gdp-1",
        title: "Nominal GDP Calculation",
        generateProblem: function() {
            // Generate random quantities and prices
            const cellPhoneQty = generateRandomQuantity(150, 300);
            const cellPhonePrice = generateRandomPrice(15, 30);
            const homesQty = generateRandomQuantity(30, 70);
            const homesPrice = generateRandomPrice(800, 1200);
            const coffeeQty = generateRandomQuantity(200, 400);
            const coffeePrice = generateRandomPrice(5, 15);

            // Calculate the answer
            const cellPhoneValue = cellPhoneQty * cellPhonePrice;
            const homesValue = homesQty * homesPrice;
            const coffeeValue = coffeeQty * coffeePrice;
            const nominalGDP = cellPhoneValue + homesValue + coffeeValue;

            return {
                question: `A simple economy produces only four goods: cell phones, homes, coffee drinks, and coffee beans. In Year 1, the quantities and prices are: ${cellPhoneQty} cell phones at $${cellPhonePrice} each, ${homesQty} homes at $${homesPrice} each, ${coffeeQty} coffee drinks at $${coffeePrice} each, and some coffee beans (intermediate goods). What is the nominal GDP in Year 1?`,
                parameters: {
                    "Cell Phones": `${cellPhoneQty} units at $${cellPhonePrice} each`,
                    "Homes": `${homesQty} units at $${homesPrice} each`,
                    "Coffee Drinks": `${coffeeQty} units at $${coffeePrice} each`
                },
                answer: nominalGDP,
                solution: `Nominal GDP = Sum of (Price × Quantity) for all final goods and services\nCell Phones: ${cellPhoneQty} × $${cellPhonePrice} = $${cellPhoneValue}\nHomes: ${homesQty} × $${homesPrice} = $${homesValue}\nCoffee Drinks: ${coffeeQty} × $${coffeePrice} = $${coffeeValue}\nNominal GDP = $${cellPhoneValue} + $${homesValue} + $${coffeeValue} = $${nominalGDP}`,
                explanation: "Nominal GDP is the value of all final goods and services produced in an economy during a specific period, valued at current market prices. Intermediate goods (like coffee beans used to make coffee drinks) are not counted to avoid double-counting.",
                hint: "Add up the value of all final goods and services. Remember that intermediate goods (used to produce other goods) are not counted in GDP.",
                difficulty: 2,
                unit: "dollars",
                tolerance: 0, // Exact answer required
                source: "GDP Calculation"
            };
        }
    },

    // GDP Year 1 and Year 2 Problems
    {
        id: "gdp-year1-year2",
        title: "Nominal GDP Comparison",
        generateProblem: function() {
            // Generate random quantities and prices for Year 1
            const carsQty1 = generateRandomQuantity(40, 70);
            const carsPrice1 = generateRandomPrice(20, 30);
            const homesQty1 = generateRandomQuantity(15, 30);
            const homesPrice1 = generateRandomPrice(25, 40);
            const foodQty1 = generateRandomQuantity(80, 120);
            const foodPrice1 = generateRandomPrice(3, 6);

            // Generate random quantities and prices for Year 2 (with some growth)
            const carsQty2 = Math.round(carsQty1 * (1 + Math.random() * 0.5 + 0.5)); // 50-100% increase
            const carsPrice2 = Math.round(carsPrice1 * (1 + Math.random() * 0.3)); // 0-30% increase
            const homesQty2 = Math.round(homesQty1 * (1 + Math.random() * 0.4)); // 0-40% increase
            const homesPrice2 = Math.round(homesPrice1 * (1 + Math.random() * 0.5 + 0.2)); // 20-70% increase
            const foodQty2 = Math.round(foodQty1 * (1 + Math.random() * 0.3 + 0.2)); // 20-50% increase
            const foodPrice2 = Math.round(foodPrice1 * (1 + Math.random() * 0.3)); // 0-30% increase

            // Calculate nominal GDP for Year 1
            const carsValue1 = carsQty1 * carsPrice1;
            const homesValue1 = homesQty1 * homesPrice1;
            const foodValue1 = foodQty1 * foodPrice1;
            const nominalGDP1 = carsValue1 + homesValue1 + foodValue1;

            // Calculate nominal GDP for Year 2
            const carsValue2 = carsQty2 * carsPrice2;
            const homesValue2 = homesQty2 * homesPrice2;
            const foodValue2 = foodQty2 * foodPrice2;
            const nominalGDP2 = carsValue2 + homesValue2 + foodValue2;

            // Calculate real GDP for Year 2 (using Year 1 prices)
            const realCarsValue2 = carsQty2 * carsPrice1;
            const realHomesValue2 = homesQty2 * homesPrice1;
            const realFoodValue2 = foodQty2 * foodPrice1;
            const realGDP2 = realCarsValue2 + realHomesValue2 + realFoodValue2;

            // Calculate GDP deflator for Year 2
            const gdpDeflator2 = roundToDecimal((nominalGDP2 / realGDP2) * 100, 2);

            // Randomly select which value to ask for
            const questionType = getRandomInt(1, 3);
            let question, parameters, answer, solution, explanation, hint;

            if (questionType === 1) {
                // Ask for nominal GDP in Year 1
                question = `A simple economy produces only three goods: cars, homes, and food. In Year 1, the quantities and prices are: ${carsQty1} cars at $${carsPrice1} each, ${homesQty1} homes at $${homesPrice1} each, and ${foodQty1} units of food at $${foodPrice1} each. What is the nominal GDP in Year 1?`;
                parameters = {
                    "Cars": `${carsQty1} units at $${carsPrice1} each`,
                    "Homes": `${homesQty1} units at $${homesPrice1} each`,
                    "Food": `${foodQty1} units at $${foodPrice1} each`
                };
                answer = nominalGDP1;
                solution = `Nominal GDP = Sum of (Price × Quantity) for all final goods and services\nCars: ${carsQty1} × $${carsPrice1} = $${carsValue1}\nHomes: ${homesQty1} × $${homesPrice1} = $${homesValue1}\nFood: ${foodQty1} × $${foodPrice1} = $${foodValue1}\nNominal GDP = $${carsValue1} + $${homesValue1} + $${foodValue1} = $${nominalGDP1}`;
                explanation = "Nominal GDP is the value of all final goods and services produced in an economy during a specific period, valued at current market prices.";
                hint = "Add up the value of all final goods and services.";
            } else if (questionType === 2) {
                // Ask for real GDP in Year 2
                question = `A simple economy produces cars, homes, and food. In Year 2, the quantities are: ${carsQty2} cars, ${homesQty2} homes, and ${foodQty2} units of food. Using Year 1 prices (cars: $${carsPrice1}, homes: $${homesPrice1}, food: $${foodPrice1}), what is the real GDP in Year 2?`;
                parameters = {
                    "Year 2 Quantities": `${carsQty2} cars, ${homesQty2} homes, ${foodQty2} units of food`,
                    "Year 1 Prices": `Cars: $${carsPrice1}, Homes: $${homesPrice1}, Food: $${foodPrice1}`
                };
                answer = realGDP2;
                solution = `Real GDP = Sum of (Base Year Price × Current Year Quantity) for all final goods and services\nCars: ${carsQty2} × $${carsPrice1} = $${realCarsValue2}\nHomes: ${homesQty2} × $${homesPrice1} = $${realHomesValue2}\nFood: ${foodQty2} × $${foodPrice1} = $${realFoodValue2}\nReal GDP = $${realCarsValue2} + $${realHomesValue2} + $${realFoodValue2} = $${realGDP2}`;
                explanation = "Real GDP measures the value of all final goods and services produced in an economy during a specific period, valued at constant base-year prices. This removes the effect of price changes and shows the actual change in production.";
                hint = "Multiply the Year 2 quantities by the Year 1 prices for each good.";
            } else {
                // Ask for GDP deflator in Year 2
                question = `A simple economy has a nominal GDP of $${nominalGDP2} in Year 2 and a real GDP of $${realGDP2} (using Year 1 as the base year). What is the GDP deflator for Year 2?`;
                parameters = {
                    "Nominal GDP Year 2": `$${nominalGDP2}`,
                    "Real GDP Year 2": `$${realGDP2}`
                };
                answer = gdpDeflator2;
                solution = `GDP Deflator = (Nominal GDP / Real GDP) × 100\nGDP Deflator = ($${nominalGDP2} / $${realGDP2}) × 100\nGDP Deflator = ${roundToDecimal(nominalGDP2 / realGDP2, 4)} × 100\nGDP Deflator = ${gdpDeflator2}`;
                explanation = "The GDP deflator is a measure of the overall level of prices in the economy. It is calculated as the ratio of nominal GDP to real GDP, multiplied by 100.";
                hint = "Use the formula: GDP Deflator = (Nominal GDP / Real GDP) × 100";
            }

            return {
                question: question,
                parameters: parameters,
                answer: answer,
                solution: solution,
                explanation: explanation,
                hint: hint,
                difficulty: questionType === 3 ? 3 : 2,
                unit: questionType === 3 ? "" : "dollars",
                tolerance: questionType === 3 ? 0.1 : 0, // Allow some tolerance for deflator calculations
                source: "GDP Calculation"
            };
        }
    },

    // CPI and Inflation Problems
    {
        id: "cpi-inflation",
        title: "Consumer Price Index and Inflation",
        generateProblem: function() {
            // Generate random quantities and prices for base year
            const product1Qty = generateRandomQuantity(50, 150);
            const product1PriceBase = generateRandomPrice(10, 30);
            const product2Qty = generateRandomQuantity(20, 50);
            const product2PriceBase = generateRandomPrice(40, 80);

            // Generate random prices for current year (with some inflation)
            const inflationFactor1 = 1 + Math.random() * 0.5; // 0-50% inflation
            const inflationFactor2 = 1 + Math.random() * 0.3 - 0.2; // -20% to +30% price change
            const product1PriceCurrent = Math.round(product1PriceBase * inflationFactor1);
            const product2PriceCurrent = Math.round(product2PriceBase * inflationFactor2);

            // Calculate CPI
            const baseYearCost = (product1Qty * product1PriceBase) + (product2Qty * product2PriceBase);
            const currentYearCost = (product1Qty * product1PriceCurrent) + (product2Qty * product2PriceCurrent);
            const cpi = roundToDecimal((currentYearCost / baseYearCost) * 100, 2);

            // Generate a random CPI for next year
            const nextYearCPI = roundToDecimal(cpi * (1 + Math.random() * 0.3 - 0.05), 2); // -5% to +25% change
            const inflationRate = roundToDecimal(((nextYearCPI - cpi) / cpi) * 100, 2);

            // Randomly select which value to ask for
            const questionType = getRandomInt(1, 2);
            let question, parameters, answer, solution, explanation, hint;

            if (questionType === 1) {
                // Ask for CPI
                question = `A market basket contains two products: Product A and Product B. In the base year, the quantities and prices are: ${product1Qty} units of Product A at $${product1PriceBase} each and ${product2Qty} units of Product B at $${product2PriceBase} each. In the current year, the prices change to: Product A $${product1PriceCurrent} and Product B $${product2PriceCurrent}. What is the Consumer Price Index (CPI) for the current year?`;
                parameters = {
                    "Base Year Quantities": `${product1Qty} units of Product A, ${product2Qty} units of Product B`,
                    "Base Year Prices": `Product A: $${product1PriceBase}, Product B: $${product2PriceBase}`,
                    "Current Year Prices": `Product A: $${product1PriceCurrent}, Product B: $${product2PriceCurrent}`
                };
                answer = cpi;
                solution = `CPI = (Cost of Market Basket in Current Year / Cost of Market Basket in Base Year) × 100\n\nBase Year Cost = (${product1Qty} × $${product1PriceBase}) + (${product2Qty} × $${product2PriceBase})\nBase Year Cost = $${product1Qty * product1PriceBase} + $${product2Qty * product2PriceBase} = $${baseYearCost}\n\nCurrent Year Cost = (${product1Qty} × $${product1PriceCurrent}) + (${product2Qty} × $${product2PriceCurrent})\nCurrent Year Cost = $${product1Qty * product1PriceCurrent} + $${product2Qty * product2PriceCurrent} = $${currentYearCost}\n\nCPI = ($${currentYearCost} / $${baseYearCost}) × 100 = ${roundToDecimal(currentYearCost / baseYearCost, 4)} × 100 = ${cpi}`;
                explanation = "The Consumer Price Index (CPI) measures the average change in prices paid by consumers for a basket of goods and services over time. It is calculated by comparing the cost of a fixed basket of goods and services in the current year to the cost of the same basket in the base year.";
                hint = "Calculate the cost of the market basket in both years, then divide the current year cost by the base year cost and multiply by 100.";
            } else {
                // Ask for inflation rate
                question = `If the Consumer Price Index (CPI) was ${cpi} in the current year and ${nextYearCPI} in the next year, what was the inflation rate between these years?`;
                parameters = {
                    "CPI in Current Year": cpi,
                    "CPI in Next Year": nextYearCPI
                };
                answer = inflationRate;
                solution = `Inflation Rate = ((CPI₂ - CPI₁) / CPI₁) × 100%\nInflation Rate = ((${nextYearCPI} - ${cpi}) / ${cpi}) × 100%\nInflation Rate = (${roundToDecimal(nextYearCPI - cpi, 2)} / ${cpi}) × 100%\nInflation Rate = ${roundToDecimal((nextYearCPI - cpi) / cpi, 4)} × 100%\nInflation Rate = ${inflationRate}%`;
                explanation = "The inflation rate is calculated as the percentage change in the Consumer Price Index (CPI) from one period to the next. Using the formula ((CPI₂ - CPI₁) / CPI₁) × 100%, we can determine how much prices have changed over time.";
                hint = "Use the formula: Inflation Rate = ((CPI₂ - CPI₁) / CPI₁) × 100%";
            }

            return {
                question: question,
                parameters: parameters,
                answer: answer,
                solution: solution,
                explanation: explanation,
                hint: hint,
                difficulty: 2,
                unit: questionType === 1 ? "" : "%",
                tolerance: 0.1, // Allow some tolerance for rounding
                source: "CPI and Inflation"
            };
        }
    },

    // Unemployment Rate Problems
    {
        id: "unemployment",
        title: "Unemployment Rate Calculation",
        generateProblem: function() {
            // Generate random population values
            const totalPopulation = generateRandomQuantity(150000, 250000);
            const workingAgePct = 0.7 + Math.random() * 0.1; // 70-80% of population is working age
            const workingAgePop = Math.round(totalPopulation * workingAgePct);

            const laborForcePct = 0.6 + Math.random() * 0.15; // 60-75% of working age population is in labor force
            const laborForce = Math.round(workingAgePop * laborForcePct);

            const unemploymentRate = 0.05 + Math.random() * 0.15; // 5-20% unemployment rate
            const unemployed = Math.round(laborForce * unemploymentRate);
            const employed = laborForce - unemployed;

            // Generate values for alternative measures
            const discouragedWorkers = Math.round(workingAgePop * 0.03 + Math.random() * 0.05); // 3-8% of working age population are discouraged
            const involuntaryPartTime = Math.round(employed * (0.05 + Math.random() * 0.1)); // 5-15% of employed are involuntary part-time

            // Calculate adjusted unemployment rates
            const adjustedUnemployedDisc = unemployed + discouragedWorkers;
            const adjustedLaborForceDisc = laborForce + discouragedWorkers;
            const adjustedUnemploymentRateDisc = roundToDecimal((adjustedUnemployedDisc / adjustedLaborForceDisc) * 100, 2);

            const adjustedUnemployedPart = unemployed + (involuntaryPartTime * 0.5); // Count part-time as half-unemployed
            const adjustedUnemploymentRatePart = roundToDecimal((adjustedUnemployedPart / laborForce) * 100, 2);

            // Randomly select which value to ask for
            const questionType = getRandomInt(1, 3);
            let question, parameters, answer, solution, explanation, hint;

            if (questionType === 1) {
                // Ask for standard unemployment rate - more challenging version
                question = `In an economy with a working-age population of ${workingAgePop}, the number of unemployed workers is ${unemployed}, and the labor force participation rate is ${roundToDecimal(laborForcePct * 100, 1)}%. What is the unemployment rate?`;
                parameters = {
                    "Working-Age Population": workingAgePop,
                    "Unemployed": unemployed,
                    "Labor Force Participation Rate": `${roundToDecimal(laborForcePct * 100, 1)}%`
                };
                answer = roundToDecimal(unemploymentRate * 100, 2);
                solution = `Labor Force = Working-Age Population × Labor Force Participation Rate\nLabor Force = ${workingAgePop} × ${roundToDecimal(laborForcePct, 4)} = ${laborForce}\n\nUnemployment Rate = (Unemployed / Labor Force) × 100%\nUnemployment Rate = (${unemployed} / ${laborForce}) × 100%\nUnemployment Rate = ${roundToDecimal(unemploymentRate, 4)} × 100%\nUnemployment Rate = ${roundToDecimal(unemploymentRate * 100, 2)}%`;
                explanation = "The unemployment rate is calculated as the percentage of the labor force that is unemployed. First, you need to calculate the labor force using the working-age population and the labor force participation rate. Then, divide the number of unemployed by the labor force and multiply by 100%.";
                hint = "First calculate the labor force (Working-Age Population × Labor Force Participation Rate), then divide the number of unemployed by the labor force and multiply by 100%.";
            } else if (questionType === 2) {
                // Ask for unemployment rate adjusted for discouraged workers - more challenging version
                question = `In an economy with a working-age population of ${workingAgePop}, the labor force is ${laborForce}, the number of unemployed workers is ${unemployed}, and there are ${discouragedWorkers} discouraged workers (who want work but have stopped looking). What is the unemployment rate adjusted for discouraged workers?`;
                parameters = {
                    "Working-Age Population": workingAgePop,
                    "Labor Force": laborForce,
                    "Unemployed": unemployed,
                    "Discouraged Workers": discouragedWorkers
                };
                answer = adjustedUnemploymentRateDisc;
                solution = `Adjusted Labor Force = Labor Force + Discouraged Workers\nAdjusted Labor Force = ${laborForce} + ${discouragedWorkers} = ${adjustedLaborForceDisc}\n\nAdjusted Unemployed = Unemployed + Discouraged Workers\nAdjusted Unemployed = ${unemployed} + ${discouragedWorkers} = ${adjustedUnemployedDisc}\n\nAdjusted Unemployment Rate = (Adjusted Unemployed / Adjusted Labor Force) × 100%\nAdjusted Unemployment Rate = (${adjustedUnemployedDisc} / ${adjustedLaborForceDisc}) × 100%\nAdjusted Unemployment Rate = ${roundToDecimal(adjustedUnemployedDisc / adjustedLaborForceDisc, 4)} × 100%\nAdjusted Unemployment Rate = ${adjustedUnemploymentRateDisc}%`;
                explanation = "The adjusted unemployment rate for discouraged workers includes not only the officially unemployed but also those who want work but have stopped looking (discouraged workers). These workers are added to both the numerator (unemployed) and the denominator (labor force).";
                hint = "Add the discouraged workers to both the unemployed and the labor force, then calculate the unemployment rate.";
            } else {
                // Ask for unemployment rate adjusted for involuntary part-time workers - more challenging version
                question = `In an economy with ${unemployed} unemployed workers and a labor force of ${laborForce}, ${involuntaryPartTime} workers are involuntary part-time workers. If we consider these workers half-unemployed, what is the adjusted unemployment rate?`;
                parameters = {
                    "Labor Force": laborForce,
                    "Unemployed": unemployed,
                    "Involuntary Part-Time": involuntaryPartTime
                };
                answer = adjustedUnemploymentRatePart;
                solution = `Adjusted Unemployed = Unemployed + (Involuntary Part-Time Workers × 0.5)\nAdjusted Unemployed = ${unemployed} + (${involuntaryPartTime} × 0.5) = ${unemployed} + ${involuntaryPartTime * 0.5} = ${adjustedUnemployedPart}\n\nAdjusted Unemployment Rate = (Adjusted Unemployed / Labor Force) × 100%\nAdjusted Unemployment Rate = (${adjustedUnemployedPart} / ${laborForce}) × 100%\nAdjusted Unemployment Rate = ${roundToDecimal(adjustedUnemployedPart / laborForce, 4)} × 100%\nAdjusted Unemployment Rate = ${adjustedUnemploymentRatePart}%`;
                explanation = "The adjusted unemployment rate for involuntary part-time workers considers these workers as partially unemployed. In this case, they are counted as half-unemployed, so we add half of their number to the unemployed count.";
                hint = "Add half of the involuntary part-time workers to the unemployed, then calculate the unemployment rate.";
            }

            return {
                question: question,
                parameters: parameters,
                answer: answer,
                solution: solution,
                explanation: explanation,
                hint: hint,
                difficulty: questionType === 1 ? 3 : 4, // Increased difficulty
                unit: "%",
                tolerance: 0.1, // Allow some tolerance for rounding
                source: "Unemployment Rate"
            };
        }
    },

    // Fiscal Policy Problems
    {
        id: "fiscal-policy",
        title: "Fiscal Policy and Multipliers",
        generateProblem: function() {
            // Generate random MPC between 0.6 and 0.9
            const mpc = roundToDecimal(0.6 + Math.random() * 0.3, 2);

            // Calculate multipliers
            const govtMultiplier = roundToDecimal(1 / (1 - mpc), 2);
            const taxMultiplier = roundToDecimal(-mpc / (1 - mpc), 2);

            // Generate random output gap
            const outputGap = getRandomInt(500, 3000) * (Math.random() > 0.5 ? 1 : -1); // Positive or negative gap

            // Calculate required policy changes
            const govtSpendingChange = roundToDecimal(outputGap / govtMultiplier, 0);
            const taxChange = roundToDecimal(outputGap / taxMultiplier, 0);

            // Randomly select which value to ask for
            const questionType = getRandomInt(1, 3);
            let question, parameters, answer, solution, explanation, hint;

            if (questionType === 1) {
                // Ask for government spending multiplier
                question = `In an economy with a marginal propensity to consume (MPC) of ${mpc}, what is the government spending multiplier?`;
                parameters = {
                    "Marginal Propensity to Consume (MPC)": mpc
                };
                answer = govtMultiplier;
                solution = `Government Spending Multiplier = 1 / (1 - MPC)\nGovernment Spending Multiplier = 1 / (1 - ${mpc})\nGovernment Spending Multiplier = 1 / ${roundToDecimal(1 - mpc, 2)}\nGovernment Spending Multiplier = ${govtMultiplier}`;
                explanation = "The government spending multiplier shows how much total income increases when government spending increases by $1. It is calculated as 1/(1-MPC), where MPC is the marginal propensity to consume.";
                hint = "Use the formula: Government Spending Multiplier = 1 / (1 - MPC)";
            } else if (questionType === 2) {
                // Ask for required government spending change
                const gapDirection = outputGap > 0 ? "below" : "above";
                question = `In an economy with a marginal propensity to consume of ${mpc}, the full-employment level of output is ${Math.abs(outputGap)} ${gapDirection} the current level of output. How much should the government change government expenditures to reach full employment?`;
                parameters = {
                    "Marginal Propensity to Consume (MPC)": mpc,
                    "Output Gap": `${Math.abs(outputGap)} ${gapDirection} current output`
                };
                answer = govtSpendingChange;
                solution = `Government Spending Multiplier = 1 / (1 - MPC)\nGovernment Spending Multiplier = 1 / (1 - ${mpc})\nGovernment Spending Multiplier = 1 / ${roundToDecimal(1 - mpc, 2)}\nGovernment Spending Multiplier = ${govtMultiplier}\n\nRequired Change in Output = ${outputGap}\n\nRequired Change in Government Spending = Required Change in Output / Government Spending Multiplier\nRequired Change in Government Spending = ${outputGap} / ${govtMultiplier} = ${govtSpendingChange}`;
                explanation = outputGap > 0 ?
                    "When the current output is below the full-employment level, the government needs to increase spending to stimulate the economy. The amount of the increase is determined by the required change in output divided by the government spending multiplier." :
                    "When the current output is above the full-employment level, the government needs to reduce spending to cool down the economy. The amount of the reduction is determined by the required change in output divided by the government spending multiplier.";
                hint = "Calculate the government spending multiplier (1/(1-MPC)), then divide the required change in output by this multiplier.";
            } else {
                // Ask for required tax change
                const gapDirection = outputGap > 0 ? "below" : "above";
                question = `In an economy with a marginal propensity to consume of ${mpc}, the full-employment level of output is ${Math.abs(outputGap)} ${gapDirection} the current level of output. How much should the government change taxes to reach full employment?`;
                parameters = {
                    "Marginal Propensity to Consume (MPC)": mpc,
                    "Output Gap": `${Math.abs(outputGap)} ${gapDirection} current output`
                };
                answer = taxChange;
                solution = `Tax Multiplier = -MPC / (1 - MPC)\nTax Multiplier = -${mpc} / (1 - ${mpc})\nTax Multiplier = -${mpc} / ${roundToDecimal(1 - mpc, 2)}\nTax Multiplier = ${taxMultiplier}\n\nRequired Change in Output = ${outputGap}\n\nRequired Change in Taxes = Required Change in Output / Tax Multiplier\nRequired Change in Taxes = ${outputGap} / ${taxMultiplier} = ${taxChange}`;
                explanation = outputGap > 0 ?
                    "When the current output is below the full-employment level, the government needs to decrease taxes to stimulate the economy. The amount of the decrease is determined by the required change in output divided by the tax multiplier." :
                    "When the current output is above the full-employment level, the government needs to increase taxes to cool down the economy. The amount of the increase is determined by the required change in output divided by the tax multiplier.";
                hint = "Calculate the tax multiplier (-MPC/(1-MPC)), then divide the required change in output by this multiplier.";
            }

            return {
                question: question,
                parameters: parameters,
                answer: answer,
                solution: solution,
                explanation: explanation,
                hint: hint,
                difficulty: questionType === 1 ? 2 : 3,
                unit: questionType === 1 ? "" : "",
                tolerance: questionType === 1 ? 0.01 : 1, // Allow some tolerance
                source: "Fiscal Policy"
            };
        }
    },

    // Debt and Interest Rate Problems
    {
        id: "debt-interest",
        title: "Debt and Interest Rates",
        generateProblem: function() {
            // Generate random debt and GDP values
            const nominalDebt1 = getRandomInt(200, 500);
            const nominalGDP1 = getRandomInt(1000, 2000);

            // Calculate debt-to-GDP ratio
            const debtToGDP1 = roundToDecimal(nominalDebt1 / nominalGDP1, 3);

            // Generate values for second period with some growth
            const gdpGrowthFactor = 1 + Math.random() * 0.5; // 0-50% GDP growth
            const debtGrowthFactor = 1 + Math.random() * 0.8; // 0-80% debt growth

            const nominalDebt2 = Math.round(nominalDebt1 * debtGrowthFactor);
            const nominalGDP2 = Math.round(nominalGDP1 * gdpGrowthFactor);
            const debtToGDP2 = roundToDecimal(nominalDebt2 / nominalGDP2, 3);

            // Generate interest rate
            const interestRate = roundToDecimal(0.05 + Math.random() * 0.1, 2); // 5-15%
            const interestPayment = Math.round(nominalDebt2 * interestRate);

            // Generate bond price and face value
            const bondFaceValue = 1000;
            const bondPricePercent = 0.9 + Math.random() * 0.15; // 90-105% of face value
            const bondPrice = Math.round(bondFaceValue * bondPricePercent);
            const bondInterestRate = roundToDecimal(((bondFaceValue - bondPrice) / bondPrice) * 100, 2);

            // Randomly select which value to ask for
            const questionType = getRandomInt(1, 3);
            let question, parameters, answer, solution, explanation, hint;

            if (questionType === 1) {
                // Ask for debt-to-GDP ratio
                question = `In Year 1, a country had a nominal debt of $${nominalDebt1} and a nominal GDP of $${nominalGDP1}. What was the debt-to-GDP ratio in Year 1?`;
                parameters = {
                    "Nominal Debt Year 1": `$${nominalDebt1}`,
                    "Nominal GDP Year 1": `$${nominalGDP1}`
                };
                answer = debtToGDP1;
                solution = `Debt-to-GDP Ratio = Nominal Debt / Nominal GDP\nDebt-to-GDP Ratio = $${nominalDebt1} / $${nominalGDP1} = ${debtToGDP1}`;
                explanation = "The debt-to-GDP ratio is a measure of a country's debt relative to its economic output. It is calculated by dividing the nominal debt by the nominal GDP.";
                hint = "Divide the nominal debt by the nominal GDP.";
            } else if (questionType === 2) {
                // Ask for interest payment
                question = `In Year 2, a country had a nominal debt of $${nominalDebt2}. If the interest rate on the debt is ${interestRate * 100}%, what is the annual interest payment on the debt?`;
                parameters = {
                    "Nominal Debt Year 2": `$${nominalDebt2}`,
                    "Interest Rate": `${interestRate * 100}%`
                };
                answer = interestPayment;
                solution = `Annual Interest Payment = Nominal Debt × Interest Rate\nAnnual Interest Payment = $${nominalDebt2} × ${interestRate} = $${interestPayment}`;
                explanation = "The annual interest payment on a debt is calculated by multiplying the nominal debt by the interest rate.";
                hint = "Multiply the nominal debt by the interest rate.";
            } else {
                // Ask for bond interest rate
                question = `In an economy, the equilibrium price of a one-year, $${bondFaceValue} bond is $${bondPrice}. What is the interest rate in this economy?`;
                parameters = {
                    "Bond Face Value": `$${bondFaceValue}`,
                    "Bond Price": `$${bondPrice}`
                };
                answer = bondInterestRate;
                solution = `Interest Rate = ((Face Value - Bond Price) / Bond Price) × 100%\nInterest Rate = (($${bondFaceValue} - $${bondPrice}) / $${bondPrice}) × 100%\nInterest Rate = ($${bondFaceValue - bondPrice} / $${bondPrice}) × 100%\nInterest Rate = ${roundToDecimal((bondFaceValue - bondPrice) / bondPrice, 4)} × 100%\nInterest Rate = ${bondInterestRate}%`;
                explanation = "The interest rate on a bond is calculated as the return on investment, which is the difference between the face value and the bond price, divided by the bond price.";
                hint = "Use the formula: Interest Rate = ((Face Value - Bond Price) / Bond Price) × 100%";
            }

            return {
                question: question,
                parameters: parameters,
                answer: answer,
                solution: solution,
                explanation: explanation,
                hint: hint,
                difficulty: questionType === 1 ? 2 : 3,
                unit: questionType === 1 ? "" : (questionType === 2 ? "" : "%"),
                tolerance: questionType === 1 ? 0.001 : (questionType === 2 ? 0 : 0.01), // Allow some tolerance
                source: "Debt and Interest Rates"
            };
        }
    }
];

// Function to generate a random problem from a template
function generateRandomProblem(template) {
    return template.generateProblem();
}

// Define the math problems array (will be populated with random problems)
let MATH_PROBLEMS = [];

// Function to get all math problems
function getAllMathProblems() {
    // If the problems haven't been generated yet, generate them
    if (MATH_PROBLEMS.length === 0) {
        regenerateProblems();
    }
    return MATH_PROBLEMS;
}

// Function to regenerate all problems with new random values
function regenerateProblems() {
    MATH_PROBLEMS = [];

    // Generate one problem from each template
    for (const template of MATH_PROBLEM_TEMPLATES) {
        const problem = generateRandomProblem(template);
        problem.id = template.id + '-' + Math.floor(Math.random() * 1000); // Add random suffix to ID
        MATH_PROBLEMS.push(problem);
    }
}

// Generate problems on load
regenerateProblems();

// Function to get a math problem by ID
function getMathProblemById(id) {
    // If the problems haven't been generated yet, generate them
    if (MATH_PROBLEMS.length === 0) {
        regenerateProblems();
    }
    return MATH_PROBLEMS.find(problem => problem.id === id);
}

// Function to get a random math problem
function getRandomMathProblem(difficulty = null) {
    // If the problems haven't been generated yet, generate them
    if (MATH_PROBLEMS.length === 0) {
        regenerateProblems();
    }

    let filteredProblems = MATH_PROBLEMS;

    // Filter by difficulty if specified
    if (difficulty !== null) {
        filteredProblems = MATH_PROBLEMS.filter(problem => problem.difficulty === difficulty);
    }

    // If no problems match the criteria, return all problems
    if (filteredProblems.length === 0) {
        filteredProblems = MATH_PROBLEMS;
    }

    const randomIndex = Math.floor(Math.random() * filteredProblems.length);
    return filteredProblems[randomIndex];
}

// Function to get a daily math problem
function getDailyMathProblem() {
    // If the problems haven't been generated yet, generate them
    if (MATH_PROBLEMS.length === 0) {
        regenerateProblems();
    }

    // Get today's date as a string (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Use the date to deterministically select a problem
    const dateHash = today.split('-').reduce((sum, part) => sum + parseInt(part, 10), 0);
    const problemIndex = dateHash % MATH_PROBLEMS.length;

    return MATH_PROBLEMS[problemIndex];
}

// Export the functions
if (typeof window !== "undefined") {
    window.getAllMathProblems = getAllMathProblems;
    window.getMathProblemById = getMathProblemById;
    window.getRandomMathProblem = getRandomMathProblem;
    window.getDailyMathProblem = getDailyMathProblem;
    window.regenerateProblems = regenerateProblems;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getAllMathProblems,
        getMathProblemById,
        getRandomMathProblem,
        getDailyMathProblem,
        regenerateProblems
    };
}
