let chart = null;
let globalData = null;
let recessions = null;

// Load data
async function loadData() {
    try {
        const [indicatorsCsv, recessionsCsv] = await Promise.all([
            fetch('data/LeadingIndicators.csv').then(r => r.text()),
            fetch('data/recessions.csv').then(r => r.text())
        ]);

        // Parse data
        globalData = Papa.parse(indicatorsCsv, { header: true }).data
            .filter(row => row.Date && Object.values(row).some(v => v))
            .map(row => ({
                date: new Date(row.Date),
                ...Object.fromEntries(
                    Object.entries(row)
                        .filter(([key]) => key !== 'Date')
                        .map(([key, value]) => [key, parseFloat(value)])
                )
            }))
            .sort((a, b) => a.date - b.date);

        recessions = Papa.parse(recessionsCsv, { header: true }).data
            .filter(row => row.Start && row.End)
            .map(row => ({
                start: new Date(row.Start),
                end: new Date(row.End)
            }));

        // Initialize analysis
        const indicators = Object.keys(globalData[0]).filter(key => key !== 'date');
        initializeAnalysis(indicators);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function initializeAnalysis(indicators) {
    const container = document.getElementById('indicatorSelect');
    container.innerHTML = indicators.map(ind => `
        <option value="${ind}">${getIndicatorLabel(ind)}</option>
    `).join('');

    // Initialize with first indicator
    updateAnalysis(indicators[0]);
}

function getIndicatorLabel(indicator) {
    const labels = {
        '10Y2Y_Yield': 'Yield Curve (10Y-2Y)',
        'ISM_Orders': 'ISM New Orders',
        'Building_Permits': 'Building Permits',
        'Consumer_Confidence': 'Consumer Confidence',
        'PMI': 'Manufacturing PMI',
        'Initial_Claims': 'Initial Claims',
        'CLI': 'CLI',
        'SP500': 'S&P 500'
    };
    return labels[indicator] || indicator;
}

function updateAnalysis(indicator) {
    if (!globalData || !recessions) return;

    // Calculate z-scores
    const values = globalData.map(d => d[indicator]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
        values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );
    
    const zScores = globalData.map(d => ({
        date: d.date,
        value: (d[indicator] - mean) / stdDev
    }));

    // Define rules for each indicator
    const rules = {
        '10Y2Y_Yield': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'ISM_Orders': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'Building_Permits': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'Consumer_Confidence': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'PMI': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'Initial_Claims': { threshold: 1.0, description: 'Z-score rises above 1.0' },
        'CLI': { threshold: -1.0, description: 'Z-score falls below -1.0' },
        'SP500': { threshold: -1.0, description: 'Z-score falls below -1.0' }
    };

    // Find signals based on rules
    const signals = findSignals(zScores, rules[indicator]);

    // Analyze signals
    const analysis = analyzeSignals(signals);

    // Update chart
    updateChart(zScores, analysis);

    // Update stats
    updateStats(analysis);
}

function findSignals(data, rule) {
    const signals = [];
    let inSignal = false;

    data.forEach((d, i) => {
        const isSignal = rule.threshold > 0 ? 
            d.value > rule.threshold :
            d.value < rule.threshold;

        if (isSignal && !inSignal) {
            signals.push(d);
            inSignal = true;
        } else if (!isSignal) {
            inSignal = false;
        }
    });

    return signals;
}

function analyzeSignals(signals) {
    return signals.map(signal => {
        // Find if signal occurred during recession
        const duringRecession = recessions.some(r => 
            signal.date >= r.start && signal.date <= r.end
        );

        // If not during recession, find lead time to next recession
        let leadTime = null;
        let result = 'False Positive';

        if (!duringRecession) {
            const nextRecession = recessions.find(r => r.start > signal.date);
            if (nextRecession) {
                leadTime = Math.round(
                    (nextRecession.start - signal.date) / (1000 * 60 * 60 * 24 * 30.44)
                );
                if (leadTime <= 24) {
                    result = 'True Positive';
                }
            }
        }

        return {
            date: signal.date,
            value: signal.value,
            result,
            leadTime,
            duringRecession
        };
    });
}

function updateChart(data, analysis) {
    if (chart) {
        chart.destroy();
    }

    const ctx = document.getElementById('indicatorChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Z-Score',
                data: data.map(d => ({ x: d.date, y: d.value })),
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year'
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        ...recessions.reduce((acc, recession, i) => ({
                            ...acc,
                            [`recession${i}`]: {
                                type: 'box',
                                xMin: recession.start,
                                xMax: recession.end,
                                backgroundColor: 'rgba(200, 200, 200, 0.2)',
                                borderWidth: 0
                            }
                        }), {}),
                        ...analysis.reduce((acc, signal, i) => ({
                            ...acc,
                            [`signal${i}`]: {
                                type: 'line',
                                xMin: signal.date,
                                xMax: signal.date,
                                borderColor: signal.duringRecession ? 
                                    'rgba(200, 200, 200, 0.5)' : 
                                    signal.result === 'True Positive' ? 
                                        'rgba(34, 197, 94, 0.5)' : 
                                        'rgba(239, 68, 68, 0.5)',
                                borderWidth: 2
                            }
                        }), {})
                    }
                }
            }
        }
    });
}

function updateStats(analysis) {
    const validSignals = analysis.filter(s => !s.duringRecession);
    const truePositives = validSignals.filter(s => s.result === 'True Positive');
    const successRate = validSignals.length > 0 ? 
        (truePositives.length / validSignals.length * 100).toFixed(1) : 'N/A';
    const avgLeadTime = truePositives.length > 0 ?
        Math.round(truePositives.reduce((sum, s) => sum + s.leadTime, 0) / truePositives.length) : 'N/A';

    document.getElementById('signalStats').innerHTML = `
        <div class="space-y-2">
            <p>
                Success Rate: 
                <span class="font-medium ${
                    successRate === 'N/A' ? 'text-gray-600' :
                    parseFloat(successRate) > 70 ? 'text-green-600' :
                    parseFloat(successRate) > 40 ? 'text-yellow-600' :
                    'text-red-600'
                }">
                    ${successRate}${successRate !== 'N/A' ? '%' : ''}
                </span>
            </p>
            <p>
                Average Lead Time: 
                <span class="font-medium">
                    ${avgLeadTime}${avgLeadTime !== 'N/A' ? ' months' : ''}
                </span>
            </p>
            <p class="text-sm text-gray-600">
                ${analysis.filter(s => s.duringRecession).length} signals occurred during recessions
                (not counted in success rate)
            </p>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadData);
