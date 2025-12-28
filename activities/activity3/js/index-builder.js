// Global state
const state = {
    rawData: [],
    processedData: [],
    recessions: [],
    chart: null,
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0 },
        { id: "ISM_Orders", label: "ISM New Orders", weight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0 },
        { id: "PMI", label: "Manufacturing PMI", weight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0 },
        { id: "CLI", label: "CLI", weight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0 }
    ]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadData();
    
    // Add event listeners
    document.getElementById('signalType').addEventListener('change', updateRuleInputs);
});

async function loadData() {
    try {
        // Show loading state
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('mainContent').classList.add('hidden');

        // Load data files
        const [zScoreResponse, recessionResponse] = await Promise.all([
            fetch('data/LeadingIndicators_ZScore.csv'),
            fetch('data/recessions.csv')
        ]);

        const zScoreText = await zScoreResponse.text();
        const recessionText = await recessionResponse.text();

        // Parse CSV data
        state.rawData = Papa.parse(zScoreText, { header: true }).data
            .filter(row => row.time)
            .map(row => ({
                date: formatDate(row.time),
                "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                "ISM_Orders": parseFloat(row["ISM New Orders"]) || 0,
                "Building_Permits": parseFloat(row["Building Permits"]) || 0,
                "Consumer_Confidence": parseFloat(row["Consumer Confidence"]) || 0,
                "PMI": parseFloat(row["PMI"]) || 0,
                "Initial_Claims": parseFloat(row["4-Week MA Initial Unemployment Claims"]) || 0,
                "CLI": parseFloat(row["US CLI"]) || 0,
                "SP500": parseFloat(row["SP500"]) || 0
            }))
            .filter(row => !isNaN(row.date))
            // Filter to start from June 1977
            .filter(row => {
                const date = new Date(row.date);
                return date >= new Date('1977-06-01');
            });

        state.recessions = Papa.parse(recessionText, { header: true }).data
            .filter(row => row.start && row.end)
            .map(row => ({
                start: new Date(row.start),
                end: new Date(row.end)
            }));

        // Initialize chart
        updateChart();

        // Hide loading state
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data. Please try refreshing the page.');
    }
}

function formatDate(dateStr) {
    const [month, day, year] = dateStr.split('/');
    return `${year.length === 2 ? '19' + year : year}-${month.padStart(2, '0')}-${day || '01'}`;
}

function initializeUI() {
    const weightInputs = document.getElementById('weightInputs');
    state.indicators.forEach(indicator => {
        const div = document.createElement('div');
        div.className = 'space-y-2';
        div.innerHTML = `
            <label class="block text-sm font-medium text-gray-700">
                ${indicator.label}
            </label>
            <div class="flex items-center space-x-4">
                <input type="range" 
                       id="weight_${indicator.id}" 
                       min="0" 
                       max="100" 
                       value="0"
                       class="flex-1"
                       oninput="updateWeight('${indicator.id}', this.value)">
                <span id="weightLabel_${indicator.id}" class="text-sm w-12 text-right">0%</span>
            </div>
        `;
        weightInputs.appendChild(div);
    });
}

function updateWeight(indicatorId, value) {
    const indicator = state.indicators.find(ind => ind.id === indicatorId);
    if (indicator) {
        indicator.weight = parseInt(value);
        document.getElementById(`weightLabel_${indicatorId}`).textContent = `${value}%`;
        updateTotalWeight();
    }
}

function updateTotalWeight() {
    const total = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    document.getElementById('totalWeight').textContent = total;
}

function normalizeWeights() {
    const total = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
    if (total === 0) return;

    state.indicators.forEach(indicator => {
        const normalizedWeight = Math.round((indicator.weight / total) * 100);
        const input = document.getElementById(`weight_${indicator.id}`);
        input.value = normalizedWeight;
        document.getElementById(`weightLabel_${indicator.id}`).textContent = `${normalizedWeight}%`;
        indicator.weight = normalizedWeight;
    });
    updateTotalWeight();
    updateChart();
}

function calculateIndex() {
    if (!state.rawData || state.rawData.length === 0) return [];

    const weights = {};
    state.indicators.forEach(ind => {
        weights[ind.id] = ind.weight / 100;
    });

    return state.rawData.map(row => {
        let indexValue = 0;
        Object.entries(weights).forEach(([indicator, weight]) => {
            // For Initial Claims, invert the value since higher is worse
            const value = indicator === "Initial_Claims" ? -row[indicator] : row[indicator];
            indexValue += (value || 0) * weight;
        });
        return {
            date: row.date,
            value: indexValue
        };
    });
}

function updateChart() {
    const indexData = calculateIndex();
    if (!indexData || indexData.length === 0) return;

    const ctx = document.getElementById('indexChart').getContext('2d');
    
    if (state.chart) {
        state.chart.destroy();
    }

    // Get threshold value and direction for display
    const thresholdValue = parseFloat(document.getElementById('thresholdValue').value);
    const thresholdDirection = document.getElementById('thresholdDirection').value;

    // Prepare recession overlay data
    const recessionOverlays = state.recessions.map(recession => ({
        type: 'box',
        xMin: recession.start,
        xMax: recession.end,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 0
    }));

    // Add threshold line annotation
    const thresholdLine = {
        type: 'line',
        yMin: thresholdValue,
        yMax: thresholdValue,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        label: {
            display: true,
            content: `Threshold: ${thresholdValue.toFixed(1)}`,
            position: 'start'
        }
    };

    // Add all annotations
    const annotations = [...recessionOverlays, thresholdLine];

    // Generate signals for display
    const signals = generateSignals(thresholdValue, thresholdDirection, document.getElementById('retriggerRule').value);

    // Create datasets
    const datasets = [
        {
            label: 'Leading Index',
            data: indexData.map(d => d.value),
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: false,
            tension: 0.1
        }
    ];

    // Add signal points if there are any
    if (signals && signals.length > 0) {
        // Create a dataset for signals
        const signalPoints = signals.map(s => ({
            x: s.date,
            y: s.value
        }));

        datasets.push({
            label: 'Signals',
            data: signalPoints,
            backgroundColor: 'rgba(255, 99, 132, 1)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
        });
    }

    // Update the chart with the latest data
    state.chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                annotation: {
                    annotations: annotations
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y.toFixed(2);
                            const date = new Date(context.parsed.x).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short'
                            });
                            return `${label}: ${value} (${date})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Standard Deviations'
                    }
                }
            }
        }
    });

    // Update current value display
    if (indexData.length > 0) {
        const latestData = [...indexData].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        document.getElementById('currentValue').textContent = latestData.value.toFixed(2);
        
        // Find values from 1 and 2 years ago
        const oneYearAgo = new Date(latestData.date);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const twoYearsAgo = new Date(latestData.date);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        // Find closest data points
        const findClosestValue = (targetDate) => {
            const sortedByCloseness = [...indexData].sort((a, b) => {
                const aDiff = Math.abs(new Date(a.date) - targetDate);
                const bDiff = Math.abs(new Date(b.date) - targetDate);
                return aDiff - bDiff;
            });
            
            return sortedByCloseness[0]?.value || 'N/A';
        };
        
        const oneYearValue = findClosestValue(oneYearAgo);
        const twoYearValue = findClosestValue(twoYearsAgo);
        
        document.getElementById('oneYearAgo').textContent = typeof oneYearValue === 'number' ? oneYearValue.toFixed(2) : oneYearValue;
        document.getElementById('twoYearsAgo').textContent = typeof twoYearValue === 'number' ? twoYearValue.toFixed(2) : twoYearValue;
    }

    // Apply signal rule if active
    applyRule();
}

function updateRuleInputs() {
    const ruleType = document.getElementById('signalType').value;
    document.getElementById('thresholdRules').classList.toggle('hidden', ruleType !== 'threshold');
    document.getElementById('changeRules').classList.toggle('hidden', ruleType !== 'change');
    document.getElementById('retriggerRules').classList.toggle('hidden', ruleType !== 'threshold');
    updateChart();
}

function applyRule() {
    const ruleType = document.getElementById('signalType').value;
    const retriggerRule = document.getElementById('retriggerRule').value;
    const indexData = calculateIndex();
    let signals = [];

    if (ruleType === 'threshold') {
        const direction = document.getElementById('thresholdDirection').value;
        const threshold = parseFloat(document.getElementById('thresholdValue').value);
        
        // Generate signals based on threshold and direction
        signals = generateSignals(threshold, direction, retriggerRule);
    }

    analyzeSignals(signals);
}

// Generate signals based on threshold and direction
function generateSignals(threshold, direction, retriggerRule) {
    console.log("Generating signals with threshold:", threshold, "direction:", direction, "retrigger rule:", retriggerRule);
    const signals = [];
    let inSignalState = false;
    
    // Make sure we have data to analyze
    const indexData = calculateIndex();
    if (!indexData || indexData.length === 0) {
        console.log("No index data available");
        return signals;
    }
    
    // Sort the index data by date to ensure chronological order
    const sortedIndex = [...indexData].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
    });
    
    console.log(`Analyzing ${sortedIndex.length} data points`);
    
    // Configure signal rules - signals can only trigger once every 24 months or when a recession occurs
    let lastSignalDate = null;
    let lastRecessionEnd = null;
    
    sortedIndex.forEach((dataPoint, index) => {
        const value = dataPoint.value;
        const date = new Date(dataPoint.date);
        
        // Check if inside a recession period
        const duringRecession = state.recessions.some(recession => {
            if (!recession || !recession.start || !recession.end) return false;
            const recessionStart = new Date(recession.start);
            const recessionEnd = new Date(recession.end);
            return date >= recessionStart && date <= recessionEnd;
        });
        
        // Update lastRecessionEnd if we just exited a recession
        if (index > 0) {
            const prevDataPoint = sortedIndex[index - 1];
            const prevDate = new Date(prevDataPoint.date);
            
            const prevDuringRecession = state.recessions.some(recession => {
                if (!recession || !recession.start || !recession.end) return false;
                const recessionStart = new Date(recession.start);
                const recessionEnd = new Date(recession.end);
                return prevDate >= recessionStart && prevDate <= recessionEnd;
            });
            
            if (prevDuringRecession && !duringRecession) {
                // We just exited a recession - find which one
                const exitedRecession = state.recessions.find(recession => {
                    if (!recession || !recession.start || !recession.end) return false;
                    const recessionStart = new Date(recession.start);
                    const recessionEnd = new Date(recession.end);
                    return prevDate >= recessionStart && prevDate <= recessionEnd;
                });
                
                if (exitedRecession) {
                    lastRecessionEnd = new Date(exitedRecession.end);
                }
            }
        }
        
        // Check if value crosses threshold based on direction
        const isSignal = direction === 'below' ? value < threshold : value > threshold;
        
        // Only register signal when first crossing threshold
        if (isSignal && !inSignalState) {
            // Check if we can trigger a new signal
            let canTrigger = true;
            
            if (lastSignalDate) {
                const daysSinceLastSignal = (date - lastSignalDate) / (1000 * 60 * 60 * 24);
                
                // Signal can only trigger once every 24 months (730 days) or when a recession occurs
                if (daysSinceLastSignal < 730 && (!lastRecessionEnd || lastSignalDate > lastRecessionEnd)) {
                    canTrigger = false;
                    console.log(`Signal suppressed at ${date.toISOString()} - less than 24 months since last signal and no recession has occurred`);
                } else if (daysSinceLastSignal >= 730) {
                    console.log(`Signal allowed at ${date.toISOString()} - 24 months have passed since last signal`);
                } else if (lastRecessionEnd && lastSignalDate < lastRecessionEnd) {
                    console.log(`Signal allowed at ${date.toISOString()} - recession has ended since last signal`);
                }
            }
            
            if (canTrigger) {
                signals.push({
                    date,
                    value
                });
                lastSignalDate = date;
                inSignalState = true;
                console.log(`Signal detected at ${date.toISOString()} with value ${value.toFixed(2)}`);
            }
        } else if (!isSignal) {
            inSignalState = false;
        }
    });
    
    console.log(`Generated ${signals.length} signals`);
    
    // Sort signals by date
    return signals.sort((a, b) => a.date - b.date);
}

function analyzeSignals(signals) {
    if (!signals || signals.length === 0) {
        // Reset the analysis display
        updateAnalysis({
            stats: {
                truePositives: 0,
                falsePositives: 0,
                coincidentSignals: 0,
                missedRecessions: 0,
                accuracy: 0,
                avgLeadTime: 0
            },
            signals: []
        });
        return;
    }

    // First analyze all signals
    const analysis = {
        signals: signals.map(signal => {
            const signalDate = new Date(signal.date);
            
            // Check if signal occurred during recession
            const duringRecession = state.recessions.some(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return signalDate >= start && signalDate <= end;
            });

            if (duringRecession) {
                // Find the recession this signal is coincident with
                const coincidentRecession = state.recessions.find(r => {
                    const start = new Date(r.start);
                    const end = new Date(r.end);
                    return signalDate >= start && signalDate <= end;
                });
                
                return {
                    date: signalDate,
                    value: signal.value,
                    result: 'Coincident',
                    leadTime: 0,
                    recessionStart: coincidentRecession.start,
                    duringRecession: true
                };
            }

            // For non-coincident signals, find the next recession
            const nextRecession = state.recessions.find(r => {
                const start = new Date(r.start);
                return start > signalDate;
            });

            if (!nextRecession) return {
                date: signalDate,
                value: signal.value,
                result: 'False Positive',
                leadTime: null,
                recessionStart: null,
                duringRecession: false
            };

            const recessionStart = new Date(nextRecession.start);
            const leadTime = Math.round((recessionStart - signalDate) / (30 * 24 * 60 * 60 * 1000));

            return {
                date: signalDate,
                value: signal.value,
                result: leadTime <= 24 ? 'True Positive' : 'False Positive',
                leadTime: leadTime <= 24 ? leadTime : leadTime,
                recessionStart: nextRecession.start,
                duringRecession: false
            };
        }),
        stats: {}
    };

    // Calculate statistics
    const validSignals = analysis.signals.filter(s => !s.duringRecession);
    const truePositives = validSignals.filter(s => s.result === 'True Positive').length;
    const falsePositives = validSignals.filter(s => s.result === 'False Positive').length;
    const coincidentSignals = analysis.signals.filter(s => s.duringRecession).length;

    // For each recession, check if it was predicted by a true positive
    const detectedRecessions = new Set();
    analysis.signals
        .filter(s => s.result === 'True Positive')
        .forEach(s => {
            detectedRecessions.add(new Date(s.recessionStart).getTime());
        });
    
    // Count missed recessions
    const missedRecessions = state.recessions.filter(recession => {
        return !detectedRecessions.has(new Date(recession.start).getTime());
    }).length;

    // Calculate average lead time
    let totalLeadTime = 0;
    let leadTimeCount = 0;
    
    analysis.signals
        .filter(s => s.result === 'True Positive')
        .forEach(s => {
            if (s.leadTime !== null) {
                totalLeadTime += s.leadTime;
                leadTimeCount++;
            }
        });
    
    const avgLeadTime = leadTimeCount > 0 ? Math.round(totalLeadTime / leadTimeCount) : 0;

    // Calculate accuracy using the new formula:
    // True Positive / (True Positives + False Positives + False Negatives - Coincident)
    const denominator = Math.max(1, truePositives + falsePositives + missedRecessions - coincidentSignals);
    const accuracy = Math.round((truePositives / denominator) * 100);

    // Debug information
    console.log('Analysis results:');
    console.log('True Positives:', truePositives);
    console.log('False Positives:', falsePositives);
    console.log('Coincident Signals:', coincidentSignals);
    console.log('Missed Recessions:', missedRecessions);
    console.log('Average Lead Time:', avgLeadTime);
    console.log('Accuracy:', accuracy + '%');
    
    analysis.stats = {
        truePositives,
        falsePositives,
        coincidentSignals,
        missedRecessions,
        avgLeadTime,
        accuracy
    };

    updateAnalysis(analysis);
}

function updateAnalysis(analysis) {
    // Update statistics
    document.getElementById('truePositives').textContent = analysis.stats.truePositives;
    document.getElementById('falsePositives').textContent = analysis.stats.falsePositives;
    document.getElementById('falseNegatives').textContent = analysis.stats.missedRecessions;
    document.getElementById('coincidentCount').textContent = analysis.stats.coincidentSignals;
    
    // Update accuracy with new formula display
    document.getElementById('accuracy').textContent = `${analysis.stats.accuracy}%`;
    
    // Update average lead time
    const avgLeadTimeElement = document.getElementById('avgLeadTime');
    if (avgLeadTimeElement) {
        avgLeadTimeElement.textContent = analysis.stats.avgLeadTime > 0 ? 
            `${analysis.stats.avgLeadTime} months` : 'N/A';
    }
    
    // Update the accuracy formula display
    const accuracyFormula = document.querySelector('.accuracy-formula');
    if (accuracyFormula) {
        accuracyFormula.textContent = 'TP/(TP+FP+FN-Coincident)';
    }

    // Update signals table
    const signalsList = document.getElementById('signalsList');
    signalsList.innerHTML = '';

    // Sort signals by date
    const sortedSignals = [...(analysis.signals || [])].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Create array of signals and recessions for display
    let displayItems = [...sortedSignals];
    
    // Add missed recessions
    if (state.recessions && state.recessions.length > 0) {
        // Track which recessions were detected
        const detectedRecessions = new Set();
        
        // Mark all recessions that were correctly predicted or had coincident signals
        sortedSignals.forEach(signal => {
            if ((signal.result === 'True Positive' || signal.result === 'Coincident') && signal.recessionStart) {
                detectedRecessions.add(new Date(signal.recessionStart).getTime());
            }
        });
        
        // Add missed recessions
        state.recessions.forEach(recession => {
            const recessionStart = new Date(recession.start);
            if (!detectedRecessions.has(recessionStart.getTime())) {
                displayItems.push({
                    date: recessionStart,
                    value: null,
                    result: 'False Negative',
                    leadTime: 'Missed Recession',
                    recessionStart: recessionStart,
                    duringRecession: false,
                    type: 'Recession'
                });
            }
        });
    }
    
    // Sort the combined list
    displayItems.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create table rows
    displayItems.forEach(item => {
        const dateStr = new Date(item.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short'
        });
        
        const recessionDateStr = item.recessionStart ? 
            new Date(item.recessionStart).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short'
            }) : 
            '-';
        
        // Format lead time display
        let leadTimeDisplay = '-';
        if (item.result === 'Coincident') {
            leadTimeDisplay = 'Coincident';
        } else if (item.result === 'True Positive') {
            leadTimeDisplay = `${item.leadTime} months`;
        } else if (item.result === 'False Positive' && item.leadTime) {
            if (item.leadTime > 24) {
                leadTimeDisplay = `${item.leadTime} months (>24)`;
            } else {
                leadTimeDisplay = 'No recession within 24 months';
            }
        } else if (item.result === 'False Negative') {
            leadTimeDisplay = 'Missed Recession';
        }
        
        // Determine item type for display
        const itemType = item.result === 'False Negative' ? 'Recession' : 'Signal';
        
        // Generate badge HTML
        let badgeHTML = '';
        if (item.result === 'True Positive') {
            badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">True Positive</span>`;
        } else if (item.result === 'False Positive') {
            badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">False Positive</span>`;
        } else if (item.result === 'Coincident') {
            badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">Coincident</span>`;
        } else if (item.result === 'False Negative') {
            badgeHTML = `<span class="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">False Negative</span>`;
        }
        
        signalsList.innerHTML += `
            <tr class="${
                item.result === 'True Positive' ? 'bg-green-50' :
                item.result === 'False Positive' ? 'bg-red-50' :
                item.result === 'Coincident' ? 'bg-blue-50' :
                item.result === 'False Negative' ? 'bg-yellow-50' : ''
            } border-b">
                <td class="px-3 py-2 text-sm">${dateStr}</td>
                <td class="px-3 py-2 text-sm">${itemType}</td>
                <td class="px-3 py-2 text-sm">${recessionDateStr}</td>
                <td class="px-3 py-2 text-sm">${leadTimeDisplay}</td>
                <td class="px-3 py-2 text-sm">${badgeHTML}</td>
            </tr>
        `;
    });

    // Display a message if no signals or recessions
    if (displayItems.length === 0) {
        signalsList.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                    No signals generated with current threshold. Try adjusting the threshold value.
                </td>
            </tr>
        `;
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative';
    errorDiv.innerHTML = `
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
    `;
    document.querySelector('main').prepend(errorDiv);
}
