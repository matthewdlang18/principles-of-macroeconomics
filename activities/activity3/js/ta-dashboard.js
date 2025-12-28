// Global state object to store all data and chart references
const state = {
    studentData: [],
    zScoreData: [],
    recessionData: [],
    charts: {},
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0, description: "Difference between 10-year and 2-year Treasury yields" },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0, description: "Index of new orders in manufacturing" },
        { id: "Building_Permits", label: "Building Permits", weight: 0, description: "Number of new housing permits" },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0, description: "Index of consumer sentiment" },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0, description: "Weekly unemployment insurance claims" },
        { id: "SP500", label: "S&P 500", weight: 0, description: "Stock market performance" },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0, description: "OECD Composite Leading Indicator" },
        { id: "PMI", label: "PMI", weight: 0, description: "Purchasing Managers Index" }
    ],
    aggregateIndex: [],
    signals: [],
    signalAnalysis: {}
};

// Helper function to map GDP values to categorical classifications
function mapGDPToCategory(value) {
    console.log("Mapping GDP value to category:", value, typeof value);

    if (typeof value === 'string') {
        // If it's already a categorical string, try to map it
        value = value.trim().toLowerCase();

        if (value.includes('strong') || value.includes('>3%') || value.includes('strong growth')) {
            return 'Strong Growth (>3%)';
        } else if (value.includes('moderate') || value.includes('1-3%') || value.includes('moderate growth')) {
            return 'Moderate Growth (1-3%)';
        } else if (value.includes('weak') || value.includes('0-1%') || value.includes('weak growth')) {
            return 'Weak Growth (0-1%)';
        } else if (value.includes('mild') || value.includes('-1-0%') || value.includes('mild contraction')) {
            return 'Mild Contraction (-1-0%)';
        } else if (value.includes('severe') || value.includes('<-1%') || value.includes('severe contraction')) {
            return 'Severe Contraction (<-1%)';
        }

        // Try to parse as a number if it's a numeric string
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            return mapGDPToCategory(numValue);
        }
    } else if (typeof value === 'number') {
        // Map numeric values to categories
        if (value > 3) return 'Strong Growth (>3%)';
        if (value > 1) return 'Moderate Growth (1-3%)';
        if (value >= 0) return 'Weak Growth (0-1%)';
        if (value >= -1) return 'Mild Contraction (-1-0%)';
        return 'Severe Contraction (<-1%)';
    }

    // Default when unable to determine
    console.log("Unable to determine GDP category for value:", value);
    return 'Moderate Growth (1-3%)';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content loaded");

    // Reset all state to default values
    initializeState();

    // Clear the file input and reset file upload UI elements
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo) fileInfo.classList.add('hidden');

    const analysisContent = document.getElementById('analysisContent');
    if (analysisContent) analysisContent.classList.add('hidden');

    const dropzoneContent = document.getElementById('dropzoneContent');
    if (dropzoneContent) dropzoneContent.classList.remove('hidden');

    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) uploadProgress.classList.add('hidden');

    // Initialize the user interface
    setupEventListeners();
    setupTabNavigation();
    initializeCharts();

    // Don't load any data initially - wait for user to upload
    console.log("Waiting for user to upload data...");

    // Hide the analysis content until data is uploaded
    document.getElementById('analysisContent').classList.add('hidden');
});

// Load class data for AI tab
function loadClassDataForAITab() {
    console.log('Loading class data for AI tab');

    // Load class weights from localStorage
    const classWeightsJson = localStorage.getItem('classWeights');
    if (classWeightsJson) {
        try {
            const classWeights = JSON.parse(classWeightsJson);
            console.log('Class weights loaded for AI tab:', classWeights);

            // Find top weighted indicator
            let topIndicator = { id: '', weight: 0 };
            let totalWeight = 0;

            classWeights.forEach(weight => {
                if (weight.weight > topIndicator.weight) {
                    topIndicator = weight;
                }
                totalWeight += weight.weight;
            });

            // Calculate average weight
            const avgWeight = totalWeight / classWeights.length;

            // Update class summary in AI tab
            const classTopIndicator = document.getElementById('classTopIndicator');
            if (classTopIndicator) {
                // Convert ID to readable name
                const readableName = topIndicator.id
                    .replace('10Y2Y_Yield', 'Yield Curve')
                    .replace('ISM_NewOrders', 'ISM New Orders')
                    .replace('Building_Permits', 'Building Permits')
                    .replace('Consumer_Confidence', 'Consumer Confidence')
                    .replace('Initial_Claims', 'Initial Claims')
                    .replace('Avg_WeeklyHours', 'CLI')
                    .replace('SP500', 'S&P 500');

                classTopIndicator.textContent = `${readableName} (${topIndicator.weight.toFixed(1)}%)`;
            }

            const classAvgWeight = document.getElementById('classAvgWeight');
            if (classAvgWeight) {
                classAvgWeight.textContent = `${avgWeight.toFixed(1)}%`;
            }

            // Load class analysis
            const classAnalysisJson = localStorage.getItem('classAnalysis');
            if (classAnalysisJson) {
                try {
                    const classAnalysis = JSON.parse(classAnalysisJson);
                    console.log('Class analysis loaded for AI tab:', classAnalysis);

                    const classDetectionRate = document.getElementById('classDetectionRate');
                    if (classDetectionRate) {
                        classDetectionRate.textContent = `${classAnalysis.detectionRate.toFixed(1)}%`;
                    }

                    const classLeadTime = document.getElementById('classLeadTime');
                    if (classLeadTime) {
                        classLeadTime.textContent = `${classAnalysis.avgLeadTime.toFixed(1)} months`;
                    }
                } catch (error) {
                    console.error('Error parsing class analysis for AI tab:', error);
                }
            }
        } catch (error) {
            console.error('Error parsing class weights for AI tab:', error);
        }
    }
}

// Initialize comparison preview chart - removed sample data
function initComparisonPreviewChart() {
    // This function is now empty - we'll only show data when it's uploaded
    console.log("Comparison preview chart initialization skipped - waiting for data");
}

// Setup tab navigation
function setupTabNavigation() {
    const studentDataTab = document.getElementById('studentDataTab');
    const aiPromptsTab = document.getElementById('aiPromptsTab');
    const studentDataContent = document.getElementById('studentDataContent');
    const aiPromptsContent = document.getElementById('aiPromptsContent');

    if (studentDataTab && aiPromptsTab && studentDataContent && aiPromptsContent) {
        // Set initial state
        studentDataTab.classList.add('active');
        studentDataContent.classList.remove('hidden');
        aiPromptsTab.classList.remove('active');
        aiPromptsContent.classList.add('hidden');

        // Add click event listeners
        studentDataTab.addEventListener('click', () => {
            // Update tab buttons
            studentDataTab.classList.add('active');
            studentDataTab.classList.add('text-blue-600');
            studentDataTab.classList.add('border-blue-500');
            studentDataTab.classList.remove('text-gray-500');
            studentDataTab.classList.remove('border-transparent');

            aiPromptsTab.classList.remove('active');
            aiPromptsTab.classList.remove('text-blue-600');
            aiPromptsTab.classList.remove('border-blue-500');
            aiPromptsTab.classList.add('text-gray-500');
            aiPromptsTab.classList.add('border-transparent');

            // Update content visibility
            studentDataContent.classList.remove('hidden');
            aiPromptsContent.classList.add('hidden');
        });

        aiPromptsTab.addEventListener('click', () => {
            // Update tab buttons
            aiPromptsTab.classList.add('active');
            aiPromptsTab.classList.add('text-blue-600');
            aiPromptsTab.classList.add('border-blue-500');
            aiPromptsTab.classList.remove('text-gray-500');
            aiPromptsTab.classList.remove('border-transparent');

            studentDataTab.classList.remove('active');
            studentDataTab.classList.remove('text-blue-600');
            studentDataTab.classList.remove('border-blue-500');
            studentDataTab.classList.add('text-gray-500');
            studentDataTab.classList.add('border-transparent');

            // Update content visibility
            aiPromptsContent.classList.remove('hidden');
            studentDataContent.classList.add('hidden');
        });
    }
}

// Initialize state object with default values
function initializeState() {
    state.studentData = [];
    state.zScoreData = [];
    state.recessionData = [];
    state.charts = {
        weightsChart: null,
        gdp12Chart: null,
        gdp24Chart: null,
        recessionChart: null,
        indexChart: null
    };
    state.indicators = [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0, description: "Difference between 10-year and 2-year Treasury yields" },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0, description: "Index of new orders in manufacturing" },
        { id: "Building_Permits", label: "Building Permits", weight: 0, description: "Number of new housing permits" },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0, description: "Index of consumer sentiment" },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0, description: "Weekly unemployment insurance claims" },
        { id: "SP500", label: "S&P 500", weight: 0, description: "Stock market performance" },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0, description: "OECD Composite Leading Indicator" },
        { id: "PMI", label: "PMI", weight: 0, description: "Purchasing Managers Index" }
    ];
    state.aggregateIndex = [];
    state.signals = [];
    state.signalAnalysis = {
        truePositives: 0,
        falsePositives: 0,
        missedRecessions: 0,
        avgLeadTime: 0
    };

    // Initialize classAnalysis with GDP forecasts
    state.classAnalysis = {
        truePositives: 0,
        falsePositives: 0,
        missedRecessions: 0,
        avgLeadTime: 0,
        detectionRate: 0,
        accuracy: 0,
        gdp12Month: 'N/A',
        gdp24Month: 'N/A',
        recessionProb: 0
    };

    // Save initial classAnalysis to localStorage
    localStorage.setItem('classAnalysis', JSON.stringify(state.classAnalysis));

    // Hide the analysis content section by default until data is uploaded
    document.getElementById('analysisContent').classList.add('hidden');
}

// Set up all event listeners
function setupEventListeners() {
    // File upload event listeners
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileInput');

    // Dropzone click to trigger file input
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Drag and drop events
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    // Sample data buttons
    const loadSample1Button = document.getElementById('loadSample1');
    if (loadSample1Button) {
        loadSample1Button.addEventListener('click', () => {
            loadSampleData('data/class_sample.xlsx');
        });
    }

    const loadSample2Button = document.getElementById('loadSample2');
    if (loadSample2Button) {
        loadSample2Button.addEventListener('click', () => {
            loadSampleData('data/class_sample2.xlsx');
        });
    }

    // Signal analysis controls
    document.getElementById('signalThreshold').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value).toFixed(1);
        document.getElementById('thresholdValue').textContent = value;
        console.log("Threshold changed to:", value);
        // Ensure there's index data before analyzing signals
        if (state.aggregateIndex && state.aggregateIndex.length > 0) {
            analyzeSignals();
        } else {
            console.log("Cannot analyze signals - no index data available");
        }
    });

    document.getElementById('signalDirection').addEventListener('change', (e) => {
        console.log("Direction changed to:", e.target.value);
        // Ensure there's index data before analyzing signals
        if (state.aggregateIndex && state.aggregateIndex.length > 0) {
            analyzeSignals();
        } else {
            console.log("Cannot analyze signals - no index data available");
        }
    });

    // Add button for setting threshold to class average weights
    document.getElementById('useClassAvgBtn').addEventListener('click', () => {
        // Calculate the weighted average of the index
        const weightedSum = state.aggregateIndex.reduce((sum, point) => sum + point.value, 0);
        const avgValue = weightedSum / state.aggregateIndex.length;

        // Set the threshold to the average value
        const threshold = Math.round(avgValue * 10) / 10; // Round to nearest 0.1
        document.getElementById('signalThreshold').value = threshold;
        document.getElementById('thresholdValue').textContent = threshold.toFixed(1);

        // Apply the new threshold
        applyThreshold();
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadResults);

    // Next page button - removed since we're using a direct link now
    // The button is now an <a> tag that links directly to ai-weights.html
}

// Initialize empty charts
function initializeCharts() {
    // Initialize weights chart
    const weightsCtx = document.getElementById('weightsChart').getContext('2d');
    state.charts.weightsChart = new Chart(weightsCtx, {
        type: 'bar',
        data: {
            labels: state.indicators.map(ind => ind.label),
            datasets: [{
                label: 'Average Weight (%)',
                data: state.indicators.map(ind => 0),
                backgroundColor: 'rgba(59, 130, 246, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    // Remove fixed max to allow auto-scaling
                    suggestedMax: 25, // Suggest a reasonable starting max that will adjust based on data
                    title: {
                        display: true,
                        text: 'Weight (%)'
                    },
                    ticks: {
                        // Add callback to ensure we always show at least 5% more than the max value
                        callback: function(value, index, values) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    // Initialize GDP 12-month forecast chart for categorical data
    const gdp12Ctx = document.getElementById('gdp12Chart').getContext('2d');
    state.charts.gdp12Chart = new Chart(gdp12Ctx, {
        type: 'bar',
        data: {
            labels: [
                'Strong Growth (>3%)',
                'Moderate Growth (1-3%)',
                'Weak Growth (0-1%)',
                'Mild Contraction (-1-0%)',
                'Severe Contraction (<-1%)'
            ],
            datasets: [{
                label: 'Number of Students',
                data: [0, 0, 0, 0, 0], // Initial empty data
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',  // Strong Growth - Green
                    'rgba(59, 130, 246, 0.7)',  // Moderate Growth - Blue
                    'rgba(250, 204, 21, 0.7)',  // Weak Growth - Yellow
                    'rgba(251, 146, 60, 0.7)',  // Mild Contraction - Orange
                    'rgba(239, 68, 68, 0.7)'    // Severe Contraction - Red
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const count = context.raw || 0;
                            return `${count} student${count !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'GDP Growth Category'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Initialize GDP 24-month forecast chart for categorical data
    const gdp24Ctx = document.getElementById('gdp24Chart').getContext('2d');
    state.charts.gdp24Chart = new Chart(gdp24Ctx, {
        type: 'bar',
        data: {
            labels: [
                'Strong Growth (>3%)',
                'Moderate Growth (1-3%)',
                'Weak Growth (0-1%)',
                'Mild Contraction (-1-0%)',
                'Severe Contraction (<-1%)'
            ],
            datasets: [{
                label: 'Number of Students',
                data: [0, 0, 0, 0, 0], // Initial empty data
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',  // Strong Growth - Green
                    'rgba(59, 130, 246, 0.7)',  // Moderate Growth - Blue
                    'rgba(250, 204, 21, 0.7)',  // Weak Growth - Yellow
                    'rgba(251, 146, 60, 0.7)',  // Mild Contraction - Orange
                    'rgba(239, 68, 68, 0.7)'    // Severe Contraction - Red
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const count = context.raw || 0;
                            return `${count} student${count !== 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'GDP Growth Category'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Initialize recession probability chart
    const recessionCtx = document.getElementById('recessionChart').getContext('2d');
    state.charts.recessionChart = new Chart(recessionCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Number of Students',
                data: [],
                backgroundColor: 'rgba(239, 68, 68, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Recession Probability (%)'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });

    // Initialize index chart (empty for now)
    const indexCtx = document.getElementById('indexChart').getContext('2d');
    state.charts.indexChart = new Chart(indexCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Class Average Leading Index',
                data: [],
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(tooltipItems[0].parsed.x).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short'
                            });
                        }
                    }
                },
                annotation: {
                    annotations: []
                },
                legend: {
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'year',
                        displayFormats: {
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Standard Deviations'
                    },
                    suggestedMin: -3,
                    suggestedMax: 3
                }
            }
        }
    });
}

// Load Z-Score data from CSV
function loadZScoreData() {
    return new Promise((resolve, reject) => {
        try {
            Papa.parse('data/LeadingIndicators_ZScore.csv', {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    try {
                        console.log('Z-Score data loaded, processing...');

                        // Process the data
                        state.zScoreData = results.data
                            .filter(row => row.time) // Filter out rows without dates
                            .map(row => ({
                                date: formatDate(row.time),
                                "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                                "ISM_NewOrders": parseFloat(row["ISM New Orders"]) || 0,
                                "Building_Permits": parseFloat(row["Building Permits"]) || 0,
                                "Consumer_Confidence": parseFloat(row["Consumer Confidence"]) || 0,
                                "PMI": parseFloat(row["PMI"]) || 0,
                                "Initial_Claims": parseFloat(row["4-Week MA Initial Unemployment Claims"]) || 0,
                                "Avg_WeeklyHours": parseFloat(row["US CLI"]) || 0,
                                "SP500": parseFloat(row["SP500"]) || 0
                            }))
                            // Filter to start from June 1977
                            .filter(row => {
                                const date = new Date(row.date);
                                return date >= new Date('1977-06-01');
                            });

                        console.log(`Processed ${state.zScoreData.length} Z-Score data points`);

                        // After loading the data, calculate the index with default equal weights
                        if (state.zScoreData.length > 0) {
                            // If no student data, set default equal weights
                            if (!state.studentData || !state.studentData.length) {
                                const equalWeight = 12.5; // 100% divided by 8 indicators
                                state.indicators.forEach(ind => ind.weight = equalWeight);
                                console.log('Set default equal weights for indicators');
                            }

                            // Only calculate index if charts are initialized
                            if (state.charts && state.charts.indexChart) {
                                // Calculate index with current weights
                                calculateIndex();

                                // Update weights chart
                                updateCharts();
                            } else {
                                console.warn('Charts not initialized yet, skipping index calculation');
                            }
                        } else {
                            console.warn('No Z-Score data points after processing');
                        }

                        resolve();
                    } catch (error) {
                        console.error('Error processing Z-score data:', error);
                        reject(error);
                    }
                },
                error: function(error) {
                    console.error('Error loading Z-score data:', error);
                    reject(error);
                }
            });
        } catch (error) {
            console.error('Error initializing Z-score data load:', error);
            reject(error);
        }
    });
}

// Load recession data from CSV
async function loadRecessionData() {
    try {
        const response = await fetch('data/recessions.csv');
        const csvText = await response.text();

        // Parse CSV data
        const results = Papa.parse(csvText, { header: true });

        // Process and format the data
        state.recessionData = results.data
            .filter(row => row.start && row.end) // Filter out empty rows
            .map(row => ({
                start: formatDate(row.start),
                end: formatDate(row.end)
            }))
            .filter(recession =>
                !isNaN(recession.start.getTime()) &&
                !isNaN(recession.end.getTime())
            ); // Filter out invalid dates
    } catch (error) {
        console.error('Error loading recession data:', error);
        showError('Failed to load recession data. Please try refreshing the page.');
    }
}

// Format date string to Date object
function formatDate(dateStr) {
    // Check if the date is in YYYY-MM-DD format
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        return new Date(dateStr);
    }

    // Otherwise, assume MM/DD/YY format
    const [month, day, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' : '20') + year : year;
    return new Date(`${fullYear}-${month.padStart(2, '0')}-${day ? day.padStart(2, '0') : '01'}`);
}

// Handle file upload
function handleFileUpload(file) {
    try {
        if (!file) {
            showError('No file selected. Please select a file to upload.');
            return;
        }

        console.log(`Handling file upload: ${file.name} (${file.type}, ${file.size} bytes)`);

        // Reset any previous data
        resetData();

        // Get progress bar element
        const progressBar = document.getElementById('progressBar');
        const uploadProgress = document.getElementById('uploadProgress');

        if (!progressBar || !uploadProgress) {
            console.warn('Progress elements not found, continuing without visual progress');
        } else {
            // Show progress bar
            progressBar.style.width = '0%';
            uploadProgress.classList.remove('hidden');
        }

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(progressInterval);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }, 100);

        // Process file based on type
        const fileType = file.name.split('.').pop().toLowerCase();
        console.log(`File type detected: ${fileType}`);

        if (fileType === 'xlsx' || fileType === 'xls') {
            processExcelFile(file, progressInterval);
        } else if (fileType === 'csv') {
            processCSVFile(file, progressInterval);
        } else {
            clearInterval(progressInterval);
            showError('Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
            resetUploadUI();
        }
    } catch (error) {
        console.error('Error handling file upload:', error);
        showError(`Error handling file upload: ${error.message}`);
        resetUploadUI();
    }
}

// Reset data state
function resetData() {
    // Reset student data
    state.studentData = [];

    // Reset indicator weights
    state.indicators.forEach(ind => ind.weight = 0);

    // Reset aggregate index
    state.aggregateIndex = [];

    // Reset signals
    state.signals = [];

    // Reset signal analysis
    state.signalAnalysis = {};

    // Hide analysis content until new data is processed
    document.getElementById('analysisContent').classList.add('hidden');

    // Hide file info
    document.getElementById('fileInfo').classList.add('hidden');
}

// Process Excel file
function processExcelFile(file, progressInterval) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get the first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with headers
            const rawData = XLSX.utils.sheet_to_json(worksheet);

            console.log("Excel data structure:", rawData.slice(0, 2)); // Log first two rows to see structure

            // Transform the data structure from indicators as rows to students as rows
            const transformedData = transformExcelData(rawData);

            // Initialize charts first if they don't exist
            if (!state.charts || !state.charts.indexChart) {
                console.log('Charts not initialized, initializing now');
                initCharts();
            }

            // Load base data first
            Promise.all([loadZScoreData(), loadRecessionData()])
                .then(() => {
                    // Process the transformed data
                    processStudentData(transformedData);

                    // Show file info
                    showFileInfo(file.name, transformedData.length);

                    // Hide progress bar
                    const uploadProgress = document.getElementById('uploadProgress');
                    const dropzoneContent = document.getElementById('dropzoneContent');

                    if (uploadProgress) {
                        uploadProgress.classList.add('hidden');
                    }
                    if (dropzoneContent) {
                        dropzoneContent.classList.remove('hidden');
                    }

                    // Clear progress interval
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                })
                .catch(error => {
                    console.error('Error loading base data:', error);
                    showError(`Error loading base data: ${error.message}`);
                    resetUploadUI();

                    // Clear progress interval
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                });

        } catch (error) {
            console.error('Error processing Excel file:', error);
            showError('Error processing Excel file. Please check the format and try again.');
            resetUploadUI();

            // Clear progress interval
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        }
    };

    reader.onerror = function() {
        console.error('Error reading file');
        showError('Error reading file. Please try again.');
        resetUploadUI();

        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    };

    // Show progress bar
    const dropzoneContent = document.getElementById('dropzoneContent');
    const uploadProgress = document.getElementById('uploadProgress');

    if (dropzoneContent) {
        dropzoneContent.classList.add('hidden');
    }
    if (uploadProgress) {
        uploadProgress.classList.remove('hidden');
    }

    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
}

// Transform Excel data from indicators as rows to students as rows
function transformExcelData(rawData) {
    // Initialize transformed data array
    const transformedData = [];

    // Check if data exists and has the expected structure
    if (!rawData || rawData.length === 0) {
        console.error("Empty or invalid Excel data");
        return transformedData;
    }

    console.log("First row keys:", Object.keys(rawData[0]));

    // Get all student column names (Student 1, Student 2, etc.)
    const firstRow = rawData[0];

    // Determine the indicator column name - could be 'Indicator' or '__EMPTY'
    let indicatorColumn = 'Indicator';
    if (!firstRow.hasOwnProperty('Indicator') && firstRow.hasOwnProperty('__EMPTY')) {
        indicatorColumn = '__EMPTY';
        console.log("Using '__EMPTY' column as indicator column");
    }

    // Check if the data has the expected structure with an indicator column
    if (!firstRow.hasOwnProperty(indicatorColumn)) {
        console.error(`Excel data does not have the expected structure with '${indicatorColumn}' column`);
        console.log("Available columns:", Object.keys(firstRow));

        // Try to handle alternative formats
        // If there's no Indicator column, assume each row is a student record
        return rawData.map((row, index) => {
            return {
                studentId: `Student ${index + 1}`,
                ...row
            };
        });
    }

    // Get all student column names (Student 1, Student 2, etc.)
    const studentColumns = Object.keys(firstRow).filter(key => key !== indicatorColumn);
    console.log(`Found ${studentColumns.length} student columns`);

    // Create a student object for each column
    studentColumns.forEach((studentCol, index) => {
        const studentData = {
            studentId: studentCol
        };

        // Extract data for each indicator for this student
        rawData.forEach(row => {
            const indicator = row[indicatorColumn];
            const value = row[studentCol];

            // Map indicator names to our expected field names
            switch(indicator) {
                case 'Yield Curve (10Y-2Y)':
                    studentData['10Y2Y_Yield'] = value;
                    break;
                case 'ISM New Orders':
                    studentData['ISM_NewOrders'] = value;
                    break;
                case 'Building Permits':
                    studentData['Building_Permits'] = value;
                    break;
                case 'Consumer Confidence':
                    studentData['Consumer_Confidence'] = value;
                    break;
                case 'Initial Claims':
                    studentData['Initial_Claims'] = value;
                    break;
                case 'S&P 500':
                    studentData['SP500'] = value;
                    break;
                case 'Average Weekly Hours':
                case 'CLI': // Map CLI to Avg_WeeklyHours as a substitute
                    studentData['Avg_WeeklyHours'] = value;
                    break;
                case '12-Month GDP Growth':
                    studentData['GDP_12Month'] = value;
                    break;
                case '24-Month GDP Growth':
                    studentData['GDP_24Month'] = value;
                    break;
                case 'Recession Probability':
                    studentData['Recession_Probability'] = value;
                    break;
                case 'PMI': // Add PMI mapping
                    studentData['PMI'] = value;
                    break;
                default:
                    // Store other indicators with a sanitized name
                    if (indicator !== undefined && indicator !== null) {
                        const sanitizedName = indicator.replace(/[^a-zA-Z0-9]/g, '_');
                        studentData[sanitizedName] = value;
                    } else {
                        console.log('Warning: Undefined indicator found in data');
                    }
            }
        });

        transformedData.push(studentData);
    });

    return transformedData;
}

// Process CSV file
function processCSVFile(file, progressInterval) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            // Parse CSV data
            Papa.parse(e.target.result, {
                header: true,
                dynamicTyping: true,
                complete: function(results) {
                    if (results.data && results.data.length > 0) {
                        // Check if the CSV is in the expected format or needs transformation
                        const firstRow = results.data[0];
                        const isIndicatorBasedFormat = 'Indicator' in firstRow;

                        let processedData;
                        if (isIndicatorBasedFormat) {
                            // Transform from indicator-based to student-based format
                            processedData = transformCSVData(results.data);
                        } else {
                            processedData = results.data;
                        }

                        // Initialize charts first if they don't exist
                        if (!state.charts || !state.charts.indexChart) {
                            console.log('Charts not initialized, initializing now');
                            initCharts();
                        }

                        // Load base data first
                        Promise.all([loadZScoreData(), loadRecessionData()])
                            .then(() => {
                                // Process the data
                                processStudentData(processedData);

                                // Show file info
                                showFileInfo(file.name, processedData.length);

                                // Hide progress bar
                                const uploadProgress = document.getElementById('uploadProgress');
                                const dropzoneContent = document.getElementById('dropzoneContent');

                                if (uploadProgress) {
                                    uploadProgress.classList.add('hidden');
                                }
                                if (dropzoneContent) {
                                    dropzoneContent.classList.remove('hidden');
                                }

                                // Clear progress interval
                                if (progressInterval) {
                                    clearInterval(progressInterval);
                                }
                            })
                            .catch(error => {
                                console.error('Error loading base data:', error);
                                showError(`Error loading base data: ${error.message}`);
                                resetUploadUI();

                                // Clear progress interval
                                if (progressInterval) {
                                    clearInterval(progressInterval);
                                }
                            });
                    } else {
                        showError('The CSV file appears to be empty or invalid.');

                        // Hide progress bar
                        const uploadProgress = document.getElementById('uploadProgress');
                        const dropzoneContent = document.getElementById('dropzoneContent');

                        if (uploadProgress) {
                            uploadProgress.classList.add('hidden');
                        }
                        if (dropzoneContent) {
                            dropzoneContent.classList.remove('hidden');
                        }

                        // Clear progress interval
                        if (progressInterval) {
                            clearInterval(progressInterval);
                        }
                    }
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    showError('Error parsing CSV file. Please check the format and try again.');
                    resetUploadUI();

                    // Clear progress interval
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                }
            });
        } catch (error) {
            console.error('Error processing CSV file:', error);
            showError('Error processing CSV file. Please check the format and try again.');
            resetUploadUI();

            // Clear progress interval
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        }
    };

    reader.onerror = function() {
        console.error('Error reading file');
        showError('Error reading file. Please try again.');
        resetUploadUI();

        // Clear progress interval
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    };

    // Show progress bar
    const dropzoneContent = document.getElementById('dropzoneContent');
    const uploadProgress = document.getElementById('uploadProgress');

    if (dropzoneContent) {
        dropzoneContent.classList.add('hidden');
    }
    if (uploadProgress) {
        uploadProgress.classList.remove('hidden');
    }

    // Read the file as text
    reader.readAsText(file);
}

// Transform CSV data from indicators as rows to students as rows
function transformCSVData(rawData) {
    // Initialize transformed data array
    const transformedData = [];

    // Check if data exists and has the expected structure
    if (!rawData || rawData.length === 0) {
        console.error("Empty or invalid CSV data");
        return transformedData;
    }

    console.log("First row keys:", Object.keys(rawData[0]));

    // Get the first row to determine structure
    const firstRow = rawData[0];

    // Determine the indicator column name - could be 'Indicator' or '__EMPTY'
    let indicatorColumn = 'Indicator';
    if (!firstRow.hasOwnProperty('Indicator') && firstRow.hasOwnProperty('__EMPTY')) {
        indicatorColumn = '__EMPTY';
        console.log("Using '__EMPTY' column as indicator column");
    }

    // Check if the data has the expected structure with an indicator column
    if (!firstRow.hasOwnProperty(indicatorColumn)) {
        console.error(`CSV data does not have the expected structure with '${indicatorColumn}' column`);
        console.log("Available columns:", Object.keys(firstRow));

        // Try to handle alternative formats
        // If there's no Indicator column, assume each row is a student record
        return rawData.map((row, index) => {
            return {
                studentId: `Student ${index + 1}`,
                ...row
            };
        });
    }

    // Get all student column names (Student 1, Student 2, etc.)
    const studentColumns = Object.keys(firstRow).filter(key => key !== indicatorColumn);
    console.log(`Found ${studentColumns.length} student columns`);

    // Create a student object for each column
    studentColumns.forEach((studentCol, index) => {
        const studentData = {
            studentId: studentCol
        };

        // Extract data for each indicator for this student
        rawData.forEach(row => {
            const indicator = row[indicatorColumn];
            const value = row[studentCol];

            // Map indicator names to our expected field names
            switch(indicator) {
                case 'Yield Curve (10Y-2Y)':
                    studentData['10Y2Y_Yield'] = value;
                    break;
                case 'ISM New Orders':
                    studentData['ISM_NewOrders'] = value;
                    break;
                case 'Building Permits':
                    studentData['Building_Permits'] = value;
                    break;
                case 'Consumer Confidence':
                    studentData['Consumer_Confidence'] = value;
                    break;
                case 'Initial Claims':
                    studentData['Initial_Claims'] = value;
                    break;
                case 'S&P 500':
                    studentData['SP500'] = value;
                    break;
                case 'Average Weekly Hours':
                case 'CLI': // Map CLI to Avg_WeeklyHours as a substitute
                    studentData['Avg_WeeklyHours'] = value;
                    break;
                case '12-Month GDP Growth':
                    studentData['GDP_12Month'] = value;
                    break;
                case '24-Month GDP Growth':
                    studentData['GDP_24Month'] = value;
                    break;
                case 'Recession Probability':
                    studentData['Recession_Probability'] = value;
                    break;
                case 'PMI': // Add PMI mapping
                    studentData['PMI'] = value;
                    break;
                default:
                    // Store other indicators with a sanitized name
                    if (indicator !== undefined && indicator !== null) {
                        const sanitizedName = indicator.replace(/[^a-zA-Z0-9]/g, '_');
                        studentData[sanitizedName] = value;
                    } else {
                        console.log('Warning: Undefined indicator found in data');
                    }
            }
        });

        transformedData.push(studentData);
    });

    return transformedData;
}

// Process student data from uploaded file
function processStudentData(data) {
    try {
        console.log("Processing student data:", data.slice(0, 2));

        if (!data || data.length === 0) {
            console.warn("No student data to process");
            return;
        }

        // Store the raw data
        state.studentData = data;

        // Make sure all GDP forecasts are in the correct categorical format
        state.studentData.forEach(student => {
            if (student['GDP_12Month']) {
                student['GDP_12Month'] = mapGDPToCategory(student['GDP_12Month']);
            }
            if (student['GDP_24Month']) {
                student['GDP_24Month'] = mapGDPToCategory(student['GDP_24Month']);
            }
        });

        // Calculate average weights for each indicator
        calculateAverageWeights();

        // Process GDP forecasts
        processGDPForecasts();

        // Process recession probabilities
        processRecessionProbabilities();

        // Calculate aggregate index using average weights
        calculateIndex();

        // Update all charts and tables
        updateCharts();

        // Analyze signals with default threshold
        analyzeSignals();

        // Save data to localStorage for ai-weights.html
        saveDataForAIWeights();

        // Show analysis content
        const analysisContent = document.getElementById('analysisContent');
        if (analysisContent) {
            analysisContent.classList.remove('hidden');
        } else {
            console.warn("Analysis content element not found");
        }

        console.log("Student data processing complete");
    } catch (error) {
        console.error("Error processing student data:", error);
        showError("An error occurred while processing the data. Please try again.");
    }
}

// Save data to localStorage for ai-weights.html
function saveDataForAIWeights() {
    console.log("Saving data for AI Weights page");

    // Save class weights
    const classWeights = state.indicators.map(ind => ({
        id: ind.id,
        weight: ind.weight
    }));
    localStorage.setItem('classWeights', JSON.stringify(classWeights));

    // Save class index data
    localStorage.setItem('classIndexData', JSON.stringify(state.aggregateIndex));

    // Save class analysis - make sure to include GDP forecasts and recession probability
    if (state.classAnalysis) {
        // Make sure we're not overwriting GDP forecasts and recession probability
        const gdp12Month = state.classAnalysis.gdp12Month;
        const gdp24Month = state.classAnalysis.gdp24Month;
        const recessionProb = state.classAnalysis.recessionProb;

        // Merge signal analysis with class analysis
        const mergedAnalysis = {
            ...state.signalAnalysis,
            gdp12Month: gdp12Month || 'N/A',
            gdp24Month: gdp24Month || 'N/A',
            recessionProb: recessionProb || 0
        };

        // Log the values to help with debugging
        console.log('Saving merged class analysis to localStorage:');
        console.log('GDP 12-Month:', mergedAnalysis.gdp12Month);
        console.log('GDP 24-Month:', mergedAnalysis.gdp24Month);
        console.log('Recession Probability:', mergedAnalysis.recessionProb);

        localStorage.setItem('classAnalysis', JSON.stringify(mergedAnalysis));

        // Update state.classAnalysis with the merged analysis
        state.classAnalysis = mergedAnalysis;
    } else {
        // If state.classAnalysis doesn't exist, just save signal analysis
        localStorage.setItem('classAnalysis', JSON.stringify(state.signalAnalysis));
    }

    // Save GDP forecasts
    const gdp12Data = {};
    const gdp24Data = {};

    // Count occurrences of each category
    state.studentData.forEach(student => {
        if (student['GDP_12Month']) {
            const category = student['GDP_12Month'];
            gdp12Data[category] = (gdp12Data[category] || 0) + 1;
        }
        if (student['GDP_24Month']) {
            const category = student['GDP_24Month'];
            gdp24Data[category] = (gdp24Data[category] || 0) + 1;
        }
    });

    localStorage.setItem('classGDP12Data', JSON.stringify(gdp12Data));
    localStorage.setItem('classGDP24Data', JSON.stringify(gdp24Data));

    console.log("Data saved for AI Weights page");
}

// Calculate average weights for each indicator from student data
function calculateAverageWeights() {
    // Reset weights
    state.indicators.forEach(ind => ind.weight = 0);

    if (!state.studentData || state.studentData.length === 0) return;

    // Calculate sum of weights for each indicator
    state.studentData.forEach(student => {
        state.indicators.forEach(ind => {
            // Assuming column names in the Excel/CSV match indicator IDs
            const weight = parseFloat(student[ind.id]) || 0;
            ind.weight += weight;
        });
    });

    // Calculate average and round to nearest tenth
    const studentCount = state.studentData.length;
    state.indicators.forEach(ind => {
        ind.weight = Math.round((ind.weight / studentCount) * 10) / 10;
    });

    // Update weights table
    updateWeightsTable();
}

// Update the weights table with statistics
function updateWeightsTable() {
    const tableBody = document.getElementById('weightsTable');
    tableBody.innerHTML = '';

    // Calculate min/max for each indicator
    const stats = state.indicators.map(ind => {
        const weights = state.studentData.map(student => parseFloat(student[ind.id]) || 0);
        return {
            id: ind.id,
            label: ind.label,
            avg: ind.weight,
            min: Math.min(...weights),
            max: Math.max(...weights)
        };
    });

    // Create table rows
    stats.forEach(stat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${stat.label}</td>
            <td class="px-4 py-2">${stat.avg.toFixed(1)}%</td>
            <td class="px-4 py-2">${stat.min.toFixed(1)}%</td>
            <td class="px-4 py-2">${stat.max.toFixed(1)}%</td>
        `;
        tableBody.appendChild(row);
    });
}

// Process GDP forecasts from student data
function processGDPForecasts() {
    if (!state.studentData || state.studentData.length === 0) {
        console.log("No student data available for GDP forecasts");
        return;
    }

    console.log("Processing GDP forecasts from student data:", state.studentData.slice(0, 2));

    // Define the categorical values we're looking for (now using display-friendly labels directly)
    const growthCategories = [
        'Strong Growth (>3%)',
        'Moderate Growth (1-3%)',
        'Weak Growth (0-1%)',
        'Mild Contraction (-1-0%)',
        'Severe Contraction (<-1%)'
    ];

    // Extract GDP 12-month categorical forecasts
    const gdp12Data = state.studentData.map(student => student['GDP_12Month'] || '');

    // Extract GDP 24-month categorical forecasts
    const gdp24Data = state.studentData.map(student => student['GDP_24Month'] || '');

    // Count occurrences of each category for 12-month forecasts
    const gdp12Counts = {};
    growthCategories.forEach(category => {
        gdp12Counts[category] = gdp12Data.filter(val => val === category).length;
    });

    // Count occurrences of each category for 24-month forecasts
    const gdp24Counts = {};
    growthCategories.forEach(category => {
        gdp24Counts[category] = gdp24Data.filter(val => val === category).length;
    });

    // Find the most common category for 12-month forecasts
    let most12Month = '';
    let most12Count = 0;
    Object.entries(gdp12Counts).forEach(([category, count]) => {
        if (count > most12Count) {
            most12Count = count;
            most12Month = category;
        }
    });

    // Find the most common category for 24-month forecasts
    let most24Month = '';
    let most24Count = 0;
    Object.entries(gdp24Counts).forEach(([category, count]) => {
        if (count > most24Count) {
            most24Count = count;
            most24Month = category;
        }
    });

    // Update GDP statistics in the UI with categorical data
    const gdp12Avg = document.getElementById('gdp12Avg');
    const gdp12Median = document.getElementById('gdp12Median');
    const gdp24Avg = document.getElementById('gdp24Avg');
    const gdp24Median = document.getElementById('gdp24Median');

    if (gdp12Avg) gdp12Avg.textContent = most12Month || 'N/A';
    if (gdp12Median) gdp12Median.textContent = `${gdp12Data.length} responses`;

    if (gdp24Avg) gdp24Avg.textContent = most24Month || 'N/A';
    if (gdp24Median) gdp24Median.textContent = `${gdp24Data.length} responses`;

    // Store GDP forecasts in localStorage for ai-weights.html to use
    if (state.classAnalysis) {
        state.classAnalysis.gdp12Month = most12Month || 'N/A';
        state.classAnalysis.gdp24Month = most24Month || 'N/A';

        // Log the values to help with debugging
        console.log('Updating classAnalysis with GDP forecasts:');
        console.log('GDP 12-Month:', state.classAnalysis.gdp12Month);
        console.log('GDP 24-Month:', state.classAnalysis.gdp24Month);

        localStorage.setItem('classAnalysis', JSON.stringify(state.classAnalysis));

        // Log the localStorage value to help with debugging
        console.log('localStorage classAnalysis after update:', localStorage.getItem('classAnalysis'));
    }

    // Prepare data for categorical chart display
    const gdp12ChartData = Object.entries(gdp12Counts).map(([category, count]) => ({
        category: category,
        count: count
    }));

    const gdp24ChartData = Object.entries(gdp24Counts).map(([category, count]) => ({
        category: category,
        count: count
    }));

    // Create categorical bar charts for GDP forecasts
    updateGDPCategoricalCharts(gdp12ChartData, gdp24ChartData);
}

// Process recession probabilities from student data
function processRecessionProbabilities() {
    if (!state.studentData || state.studentData.length === 0) return;

    // Extract recession probabilities
    const recessionData = state.studentData.map(student => parseFloat(student['Recession_Probability']) || 0);

    // Calculate statistics
    const stats = calculateStatistics(recessionData);

    // Update recession statistics in the UI
    document.getElementById('recessionAvg').textContent = `${stats.mean.toFixed(2)}%`;
    document.getElementById('recessionMedian').textContent = `${stats.median.toFixed(2)}%`;
    document.getElementById('recessionMin').textContent = `${stats.min.toFixed(2)}%`;
    document.getElementById('recessionMax').textContent = `${stats.max.toFixed(2)}%`;

    // Store recession probability in classAnalysis for ai-weights.html
    if (state.classAnalysis) {
        state.classAnalysis.recessionProb = stats.mean;

        // Log the values to help with debugging
        console.log('Updating classAnalysis with recession probability:');
        console.log('Recession Probability:', state.classAnalysis.recessionProb);

        localStorage.setItem('classAnalysis', JSON.stringify(state.classAnalysis));

        // Log the localStorage value to help with debugging
        console.log('localStorage classAnalysis after update:', localStorage.getItem('classAnalysis'));
    }

    // Create histogram for recession probabilities
    updateRecessionChart(recessionData);

    // Update probability ranges
    updateProbabilityRanges(recessionData);
}

// Update probability ranges display
function updateProbabilityRanges(data) {
    const rangesContainer = document.getElementById('probabilityRanges');
    rangesContainer.innerHTML = '';

    // Define probability ranges
    const ranges = [
        { min: 0, max: 20, label: 'Very Low (0-20%)' },
        { min: 20, max: 40, label: 'Low (20-40%)' },
        { min: 40, max: 60, label: 'Moderate (40-60%)' },
        { min: 60, max: 80, label: 'High (60-80%)' },
        { min: 80, max: 100, label: 'Very High (80-100%)' }
    ];

    // Count students in each range
    ranges.forEach(range => {
        const count = data.filter(p => p >= range.min && p < range.max).length;
        const percentage = (count / data.length) * 100;

        const rangeDiv = document.createElement('div');
        rangeDiv.className = 'flex items-center';
        rangeDiv.innerHTML = `
            <div class="w-32 text-sm text-gray-600">${range.label}:</div>
            <div class="flex-1 mx-2">
                <div class="bg-gray-200 h-4 rounded-full overflow-hidden">
                    <div class="bg-red-500 h-full" style="width: ${percentage}%"></div>
                </div>
            </div>
            <div class="text-sm font-medium">${count} (${percentage.toFixed(1)}%)</div>
        `;

        rangesContainer.appendChild(rangeDiv);
    });
}

// Calculate basic statistics for an array of numbers
function calculateStatistics(data) {
    if (!data || data.length === 0) {
        return { min: 0, max: 0, mean: 0, median: 0 };
    }

    // Sort data for median calculation
    const sortedData = [...data].sort((a, b) => a - b);

    // Calculate statistics
    const min = Math.min(...data);
    const max = Math.max(...data);
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / data.length;

    // Calculate median
    let median;
    const mid = Math.floor(sortedData.length / 2);
    if (sortedData.length % 2 === 0) {
        median = (sortedData[mid - 1] + sortedData[mid]) / 2;
    } else {
        median = sortedData[mid];
    }

    return { min, max, mean, median };
}

// Update GDP forecast charts for categorical data
function updateGDPCategoricalCharts(gdp12Data, gdp24Data) {
    // These are the ordered categories for display
    const orderedCategories = [
        'Strong Growth (>3%)',
        'Moderate Growth (1-3%)',
        'Weak Growth (0-1%)',
        'Mild Contraction (-1-0%)',
        'Severe Contraction (<-1%)'
    ];

    // Sort the data to match the ordered categories
    const sortedGDP12 = [];
    const sortedCounts12 = [];

    orderedCategories.forEach(category => {
        const match = gdp12Data.find(item => item.category === category);
        if (match) {
            sortedGDP12.push(match.category);
            sortedCounts12.push(match.count);
        } else {
            sortedGDP12.push(category);
            sortedCounts12.push(0);
        }
    });

    // Do the same for 24-month data
    const sortedGDP24 = [];
    const sortedCounts24 = [];

    orderedCategories.forEach(category => {
        const match = gdp24Data.find(item => item.category === category);
        if (match) {
            sortedGDP24.push(match.category);
            sortedCounts24.push(match.count);
        } else {
            sortedGDP24.push(category);
            sortedCounts24.push(0);
        }
    });

    // Custom colors for the different growth categories
    const backgroundColors = [
        'rgba(34, 197, 94, 0.7)',  // Strong Growth - Green
        'rgba(59, 130, 246, 0.7)',  // Moderate Growth - Blue
        'rgba(250, 204, 21, 0.7)',  // Weak Growth - Yellow
        'rgba(251, 146, 60, 0.7)',  // Mild Contraction - Orange
        'rgba(239, 68, 68, 0.7)'    // Severe Contraction - Red
    ];

    // Check if charts exist before updating
    if (state.charts.gdp12Chart) {
        // Update 12-month GDP chart
        state.charts.gdp12Chart.data.labels = sortedGDP12;
        state.charts.gdp12Chart.data.datasets[0].data = sortedCounts12;
        state.charts.gdp12Chart.data.datasets[0].backgroundColor = backgroundColors;
        state.charts.gdp12Chart.options.scales.x.title.text = 'GDP Growth Category';
        state.charts.gdp12Chart.options.scales.y.title.text = 'Number of Students';
        state.charts.gdp12Chart.update();
    } else {
        console.log('GDP 12-month chart not initialized');
    }

    if (state.charts.gdp24Chart) {
        // Update 24-month GDP chart
        state.charts.gdp24Chart.data.labels = sortedGDP24;
        state.charts.gdp24Chart.data.datasets[0].data = sortedCounts24;
        state.charts.gdp24Chart.data.datasets[0].backgroundColor = backgroundColors;
        state.charts.gdp24Chart.options.scales.x.title.text = 'GDP Growth Category';
        state.charts.gdp24Chart.options.scales.y.title.text = 'Number of Students';
        state.charts.gdp24Chart.update();
    } else {
        console.log('GDP 24-month chart not initialized');
    }
}

// Update recession probability chart
function updateRecessionChart(recessionData) {
    // Create histogram bins
    const bins = createHistogramBins(recessionData, 10);

    // Check if chart exists before updating
    if (state.charts.recessionChart) {
        // Update chart
        state.charts.recessionChart.data.labels = bins.labels;
        state.charts.recessionChart.data.datasets[0].data = bins.counts;
        state.charts.recessionChart.update();
    } else {
        console.log('Recession chart not initialized');
    }
}

// Create histogram bins for data visualization
function createHistogramBins(data, binSize) {
    if (!data || data.length === 0) {
        return { labels: [], counts: [] };
    }

    // Determine min and max values
    const min = Math.floor(Math.min(...data));
    const max = Math.ceil(Math.max(...data));

    // Create bins
    const bins = {};
    for (let i = min; i <= max; i += binSize) {
        const binLabel = binSize < 1
            ? `${i.toFixed(1)}-${(i + binSize).toFixed(1)}`
            : `${i}-${i + binSize}`;
        bins[binLabel] = 0;
    }

    // Count values in each bin
    data.forEach(value => {
        const binIndex = Math.floor((value - min) / binSize);
        const binStart = min + (binIndex * binSize);
        const binLabel = binSize < 1
            ? `${binStart.toFixed(1)}-${(binStart + binSize).toFixed(1)}`
            : `${binStart}-${binStart + binSize}`;

        if (bins[binLabel] !== undefined) {
            bins[binLabel]++;
        }
    });

    // Convert to arrays for Chart.js
    const labels = Object.keys(bins);
    const counts = Object.values(bins);

    return { labels, counts };
}

// Calculate the aggregate leading index using average weights
function calculateIndex() {
    if (!state.zScoreData || state.zScoreData.length === 0) {
        console.warn('No Z-Score data available, skipping index calculation');
        return;
    }

    try {
        // Get normalized weights (ensure they sum to 1)
        const totalWeight = state.indicators.reduce((sum, ind) => sum + ind.weight, 0);
        const weights = {};

        state.indicators.forEach(ind => {
            weights[ind.id] = totalWeight > 0 ? ind.weight / totalWeight : 0;
        });

        // Calculate weighted index for each date
        state.aggregateIndex = state.zScoreData.map(row => {
            let indexValue = 0;

            // Calculate weighted sum of indicators
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

        console.log(`Calculated index for ${state.aggregateIndex.length} data points`);

        // Update the index chart if it exists
        if (state.charts && state.charts.indexChart) {
            updateIndexChart();
        } else {
            console.warn('Index chart not initialized yet, skipping chart update');
        }
    } catch (error) {
        console.error('Error calculating index:', error);
    }
}

// Update the aggregate index chart
function updateIndexChart() {
    if (!state.aggregateIndex || state.aggregateIndex.length === 0) return;

    // Check if the chart exists
    if (!state.charts.indexChart) {
        console.warn('Index chart not initialized yet, skipping update');
        return;
    }

    // Prepare data for chart
    const chartData = {
        labels: state.aggregateIndex.map(d => d.date),
        datasets: [{
            label: 'Class Average Leading Index',
            data: state.aggregateIndex.map(d => ({ x: d.date, y: d.value })),
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4
        }]
    };

    // Add signal points if we have them
    if (state.signals && state.signals.length > 0) {
        // Create array of true positive signals
        const truePositiveSignals = state.signalAnalysis?.signalDetails?.filter(s => s.result === 'True Positive') || [];
        const falsePositiveSignals = state.signalAnalysis?.signalDetails?.filter(s => s.result === 'False Positive') || [];
        const coincidentSignals = state.signalAnalysis?.signalDetails?.filter(s => s.result === 'During Recession') || [];

        // Add true positive signals as green points
        if (truePositiveSignals.length > 0) {
            chartData.datasets.push({
                label: 'True Positive Signals',
                data: truePositiveSignals.map(s => ({ x: s.date, y: s.value })),
                backgroundColor: 'rgb(34, 197, 94)', // Green
                borderColor: 'rgb(34, 197, 94)',
                pointRadius: 6,
                pointStyle: 'triangle',
                showLine: false
            });
        }

        // Add false positive signals as red points
        if (falsePositiveSignals.length > 0) {
            chartData.datasets.push({
                label: 'False Positive Signals',
                data: falsePositiveSignals.map(s => ({ x: s.date, y: s.value })),
                backgroundColor: 'rgb(239, 68, 68)', // Red
                borderColor: 'rgb(239, 68, 68)',
                pointRadius: 6,
                pointStyle: 'cross',
                showLine: false
            });
        }

        // Add coincident signals as blue points
        if (coincidentSignals.length > 0) {
            chartData.datasets.push({
                label: 'Coincident Signals',
                data: coincidentSignals.map(s => ({ x: s.date, y: s.value })),
                backgroundColor: 'rgb(59, 130, 246)', // Blue
                borderColor: 'rgb(59, 130, 246)',
                pointRadius: 6,
                pointStyle: 'circle',
                showLine: false
            });
        }
    }

    // Prepare recession overlays
    const recessionOverlays = state.recessionData.map((recession, index) => ({
        type: 'box',
        xMin: recession.start,
        xMax: recession.end,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
        id: `recession-${index}`
    }));

    // Get threshold elements
    const thresholdInput = document.getElementById('signalThreshold');
    const directionSelect = document.getElementById('signalDirection');

    // Check if elements exist
    if (!thresholdInput || !directionSelect) {
        console.warn('Threshold elements not found, skipping threshold line');
        return;
    }

    // Add threshold line
    const threshold = parseFloat(thresholdInput.value);
    const direction = directionSelect.value;
    const thresholdLine = {
        type: 'line',
        id: 'threshold-line',
        yMin: threshold,
        yMax: threshold,
        borderColor: 'rgb(255, 0, 0)',
        borderWidth: 2,
        borderDash: [6, 6],
        drawTime: 'beforeDatasetsDraw',
        label: {
            display: true,
            content: `Threshold: ${threshold.toFixed(1)} (${direction === 'below' ? 'Below' : 'Above'})`,
            position: 'start'
        }
    };

    // Combine all annotations
    const annotations = {
        ...recessionOverlays.reduce((acc, overlay) => {
            acc[overlay.id] = overlay;
            return acc;
        }, {}),
        'threshold-line': thresholdLine
    };

    try {
        // Update chart
        state.charts.indexChart.data = chartData;
        state.charts.indexChart.options.plugins.annotation.annotations = annotations;
        state.charts.indexChart.options.scales.y.title.text = 'Standard Deviations';
        state.charts.indexChart.update();
    } catch (error) {
        console.error('Error updating index chart:', error);
    }
}

// Update all charts with current data
function updateCharts() {
    // Update weights chart
    const weightData = state.indicators.map(ind => ind.weight);
    state.charts.weightsChart.data.datasets[0].data = weightData;

    // Dynamically adjust y-axis scale based on data
    if (weightData && weightData.length > 0) {
        const maxWeight = Math.max(...weightData);
        if (maxWeight > 0) {
            // Set the max to be 20% higher than the maximum value for better visualization
            // but never less than 25% to avoid too small scales
            const suggestedMax = Math.max(Math.ceil(maxWeight * 1.2), 25);
            state.charts.weightsChart.options.scales.y.suggestedMax = suggestedMax;
            console.log(`Adjusted weight chart y-axis max to ${suggestedMax}% based on max value of ${maxWeight}%`);
        }
    }

    state.charts.weightsChart.update();

    // Other charts are updated in their respective functions
}

// Generate signals based on threshold and direction
function generateSignals(threshold, direction) {
    if (!state.aggregateIndex || state.aggregateIndex.length === 0) {
        return [];
    }

    // Sort the index data by date to ensure chronological order
    const sortedIndex = [...state.aggregateIndex].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
    });

    console.log(`Analyzing ${sortedIndex.length} data points`);

    // Configure signal rules - signals can only trigger once every 24 months or when a recession occurs
    let lastSignalDate = null;
    let lastRecessionEnd = null;
    let inSignalState = false;
    const signals = [];

    sortedIndex.forEach((dataPoint, index) => {
        const value = dataPoint.value;
        const date = new Date(dataPoint.date);

        // Check if inside a recession period
        const duringRecession = state.recessionData.some(recession => {
            if (!recession || !recession.start || !recession.end) return false;
            const recessionStart = new Date(recession.start);
            const recessionEnd = new Date(recession.end);
            return date >= recessionStart && date <= recessionEnd;
        });

        // Update lastRecessionEnd if we just exited a recession
        if (index > 0) {
            const prevDataPoint = sortedIndex[index - 1];
            const prevDate = new Date(prevDataPoint.date);

            const prevDuringRecession = state.recessionData.some(recession => {
                if (!recession || !recession.start || !recession.end) return false;
                const recessionStart = new Date(recession.start);
                const recessionEnd = new Date(recession.end);
                return prevDate >= recessionStart && prevDate <= recessionEnd;
            });

            if (prevDuringRecession && !duringRecession) {
                // We just exited a recession - find which one
                const exitedRecession = state.recessionData.find(recession => {
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

        // Handle signal generation logic
        if (isSignal) {
            // If we're not already in a signal state, or if we are but need to check for a new signal
            if (!inSignalState) {
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
                        value,
                        index
                    });
                    lastSignalDate = date;
                    inSignalState = true;
                    console.log(`Signal detected at ${date.toISOString()} with value ${value.toFixed(2)}`);
                }
            }
        } else {
            // Signal condition is no longer met
            inSignalState = false;
        }
    });

    console.log(`Generated ${signals.length} signals`);

    // Sort signals by date
    return signals.sort((a, b) => a.date - b.date);
}

// Generate signals based on threshold and analyze them
function analyzeSignals() {
    if (!state.aggregateIndex || state.aggregateIndex.length === 0) {
        console.log("No aggregate index data available for signal analysis");
        return;
    }

    // Get threshold and direction from UI
    const threshold = parseFloat(document.getElementById('signalThreshold').value);
    const direction = document.getElementById('signalDirection').value;

    console.log(`Analyzing signals with threshold: ${threshold}, direction: ${direction}`);

    // Generate signals
    state.signals = generateSignals(threshold, direction);

    // Analyze signals against recessions
    state.signalAnalysis = analyzeSignalPerformance(state.signals);

    // Update signals table
    updateSignalsTable();

    // Update performance metrics
    updatePerformanceMetrics();

    // Update chart with signal markers and new threshold
    updateIndexChart();
}

// Analyze signal performance against recessions
function analyzeSignalPerformance(signals) {
    console.log("Analyzing signal performance, signals:", signals);

    if (!signals || signals.length === 0 || !state.recessionData || state.recessionData.length === 0) {
        return {
            truePositives: 0,
            falsePositives: 0,
            missedRecessions: 0,
            avgLeadTime: 0,
            signalDetails: []
        };
    }

    // First analyze all signals
    const analysis = {
        signals: signals.map(signal => {
            const signalDate = new Date(signal.date);

            // Check if signal occurred during recession
            const duringRecession = state.recessionData.some(r => {
                const start = new Date(r.start);
                const end = new Date(r.end);
                return signalDate >= start && signalDate <= end;
            });

            if (duringRecession) {
                // Find the recession this signal is coincident with
                const coincidentRecession = state.recessionData.find(r => {
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
            const nextRecession = state.recessionData.find(r => {
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
    const missedRecessions = state.recessionData.filter(recession => {
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

    // Debug information
    console.log('Analysis results:');
    console.log('True Positives:', truePositives);
    console.log('False Positives:', falsePositives);
    console.log('Coincident Signals:', coincidentSignals);
    console.log('Missed Recessions:', missedRecessions);
    console.log('Average Lead Time:', avgLeadTime);

    return {
        truePositives,
        falsePositives,
        coincidentSignals,
        missedRecessions,
        avgLeadTime,
        signalDetails: analysis.signals
    };
}

// Update signals table with analysis results
function updateSignalsTable() {
    const tableBody = document.getElementById('signalsTable');
    tableBody.innerHTML = '';

    if (!state.signalAnalysis) return;

    // Sort signals by date
    const sortedSignals = state.signalAnalysis.signalDetails ?
        [...state.signalAnalysis.signalDetails].sort((a, b) =>
            new Date(a.date) - new Date(b.date)
        ) : [];

    // Create array of signals and recessions for display
    let displayItems = [...sortedSignals];

    // Add all recessions to the display items
    if (state.recessionData && state.recessionData.length > 0) {
        // Track which recessions were detected
        const detectedRecessions = new Set();

        // Mark all recessions that were correctly predicted or had coincident signals
        sortedSignals.forEach(signal => {
            if ((signal.result === 'True Positive' || signal.result === 'Coincident') && signal.recessionStart) {
                detectedRecessions.add(signal.recessionStart);
            }
        });

        // Add all recessions to the display
        state.recessionData.forEach(recession => {
            // Convert recession start to same format used in signals
            const recessionStartDate = new Date(recession.start);
            const recessionStartStr = recessionStartDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short'
            });

            // Check if this recession was detected by any signal
            const wasDetected = Array.from(detectedRecessions).some(detectedStart => {
                const detectedDate = new Date(detectedStart);
                return detectedDate.getFullYear() === recessionStartDate.getFullYear() &&
                       detectedDate.getMonth() === recessionStartDate.getMonth();
            });

            // If this recession wasn't detected, add it as a missed recession
            if (!wasDetected) {
                displayItems.push({
                    date: recessionStartDate,
                    value: null,
                    result: 'False Negative',
                    leadTime: 'Missed Recession',
                    recessionStart: recessionStartDate,
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
        const row = document.createElement('tr');

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

        row.innerHTML = `
            <td class="px-4 py-2">${dateStr}</td>
            <td class="px-4 py-2">${itemType}</td>
            <td class="px-4 py-2">${recessionDateStr}</td>
            <td class="px-4 py-2">${leadTimeDisplay}</td>
            <td class="px-4 py-2">${badgeHTML}</td>
        `;

        // Add subtle background color based on result
        if (item.result === 'True Positive') {
            row.classList.add('bg-green-50');
        } else if (item.result === 'False Positive') {
            row.classList.add('bg-red-50');
        } else if (item.result === 'Coincident') {
            row.classList.add('bg-blue-50');
        } else if (item.result === 'False Negative') {
            row.classList.add('bg-yellow-50');
        }

        tableBody.appendChild(row);
    });

    // Display a message if no signals or recessions
    if (displayItems.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" class="px-4 py-4 text-center text-gray-500">
                No signals generated with current threshold. Try adjusting the threshold value.
            </td>
        `;
        tableBody.appendChild(row);
    }
}

// Update performance metrics display
function updatePerformanceMetrics() {
    console.log("Updating performance metrics:", state.signalAnalysis);

    if (!state.signalAnalysis) {
        console.log("No signal analysis data available");
        return;
    }

    // Update basic metrics
    document.getElementById('truePositives').textContent = state.signalAnalysis.truePositives || 0;
    document.getElementById('falsePositives').textContent = state.signalAnalysis.falsePositives || 0;
    document.getElementById('coincidentSignals').textContent = state.signalAnalysis.coincidentSignals || 0;
    document.getElementById('avgLeadTime').textContent = state.signalAnalysis.avgLeadTime > 0 ?
        `${state.signalAnalysis.avgLeadTime} months` : 'N/A';
    document.getElementById('missedRecessions').textContent = state.signalAnalysis.missedRecessions || 0;

    // Calculate additional metrics for display
    const totalRecessions = (state.signalAnalysis.truePositives + state.signalAnalysis.missedRecessions) || 1; // Avoid division by zero
    const detectionRate = Math.round((state.signalAnalysis.truePositives / totalRecessions) * 100);

    // Get coincident signals count
    const coincidentSignals = state.signalAnalysis.coincidentSignals || 0;

    // Calculate accuracy using the new formula:
    // True Positive / (True Positives + False Positives + False Negatives - Coincident)
    const denominator = Math.max(1, state.signalAnalysis.truePositives +
                                   state.signalAnalysis.falsePositives +
                                   state.signalAnalysis.missedRecessions -
                                   coincidentSignals); // Avoid division by zero

    const accuracy = Math.round((state.signalAnalysis.truePositives / denominator) * 100);

    // Add these as additional metrics if the elements exist
    const detectionRateElement = document.getElementById('detectionRate');
    if (detectionRateElement) {
        detectionRateElement.textContent = `${detectionRate}%`;
        detectionRateElement.title = `${state.signalAnalysis.truePositives} detected out of ${totalRecessions} recessions`;
    }

    const accuracyElement = document.getElementById('accuracy');
    if (accuracyElement) {
        accuracyElement.textContent = `${accuracy}%`;
        accuracyElement.title = `${state.signalAnalysis.truePositives} true positives out of ${denominator} (TP+FP+FN-Coincident)`;
    }

    console.log("Performance metrics updated:", {
        truePositives: state.signalAnalysis.truePositives,
        falsePositives: state.signalAnalysis.falsePositives,
        coincidentSignals: coincidentSignals,
        missedRecessions: state.signalAnalysis.missedRecessions,
        avgLeadTime: state.signalAnalysis.avgLeadTime,
        detectionRate: detectionRate,
        accuracy: accuracy,
        accuracyDenominator: denominator
    });
}

// Reset upload UI after error
function resetUploadUI() {
    document.getElementById('dropzoneContent').classList.remove('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('progressBar').style.width = '0%';
}

// Show file info after successful upload
function showFileInfo(fileName, studentCount) {
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('studentCount').textContent = `${studentCount} student responses loaded`;
    document.getElementById('fileInfo').classList.remove('hidden');
}

// Show error message
function showError(message) {
    alert(message);
}

// Download analysis results as CSV
function downloadResults() {
    // Prepare data for download
    const data = [
        // Header row
        ['TA Dashboard Analysis Results', '', '', ''],
        ['Generated on', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],

        // Indicator weights
        ['Indicator Weights', '', '', ''],
        ['Indicator', 'Average Weight (%)', 'Min Weight (%)', 'Max Weight (%)'],
        ...state.indicators.map(ind => {
            const weights = state.studentData.map(student => parseFloat(student[ind.id]) || 0);
            return [
                ind.label,
                ind.weight.toFixed(1),
                Math.min(...weights).toFixed(1),
                Math.max(...weights).toFixed(1)
            ];
        }),
        ['', '', '', ''],

        // GDP forecasts
        ['GDP Growth Forecasts', '', ''],
        ['Timeframe', 'Most Common', 'Sample Size'],
        ['12-Month',
            state.classAnalysis?.gdp12Month || 'N/A',
            state.studentData.filter(s => s['GDP_12Month']).length
        ],
        ['24-Month',
            state.classAnalysis?.gdp24Month || 'N/A',
            state.studentData.filter(s => s['GDP_24Month']).length
        ],
        ['', '', '', ''],

        // Recession probability
        ['Recession Probability', '', '', ''],
        ['Average (%)', 'Median (%)', 'Min (%)', 'Max (%)'],
        [
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).mean.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).median.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).min.toFixed(2),
            calculateStatistics(state.studentData.map(s => parseFloat(s['Recession_Probability']) || 0)).max.toFixed(2)
        ],
        ['', '', '', ''],

        // Signal analysis
        ['Signal Analysis', '', '', ''],
        ['Metric', 'Value', '', ''],
        ['True Positives', state.signalAnalysis.truePositives, '', ''],
        ['False Positives', state.signalAnalysis.falsePositives, '', ''],
        ['Missed Recessions', state.signalAnalysis.missedRecessions, '', ''],
        ['Average Lead Time', `${state.signalAnalysis.avgLeadTime} months`, '', ''],
        ['', '', '', ''],

        // Signal details
        ['Signal Details', '', '', ''],
        ['Date', 'Value', 'Recession Start', 'Lead Time (Months)'],
        ...(state.signalAnalysis.signalDetails || []).map(signal => [
            signal.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            signal.value.toFixed(2),
            signal.recessionStart ? signal.recessionStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '-',
            signal.leadTime !== null ? signal.leadTime : '-'
        ])
    ];

    // Convert to CSV
    const csv = Papa.unparse(data);

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ta_dashboard_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to load sample data files
function loadSampleData(filePath) {
    try {
        console.log(`Loading sample data from ${filePath}`);

        // Reset any previous data
        resetData();

        // Get progress elements
        const progressBar = document.getElementById('progressBar');
        const uploadProgress = document.getElementById('uploadProgress');
        const dropzoneContent = document.getElementById('dropzoneContent');

        // Show progress bar if elements exist
        if (progressBar && uploadProgress && dropzoneContent) {
            progressBar.style.width = '0%';
            uploadProgress.classList.remove('hidden');
            dropzoneContent.classList.add('hidden');
        } else {
            console.warn('Progress elements not found, continuing without visual progress');
        }

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(progressInterval);
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }, 100);

        // Fetch the sample file
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sample data: ${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                try {
                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Get the first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to JSON with headers
                    const rawData = XLSX.utils.sheet_to_json(worksheet);

                    console.log(`Sample data from ${filePath}:`, rawData.slice(0, 2)); // Log first two rows to see structure

                    // Transform the data structure from indicators as rows to students as rows
                    const transformedData = transformExcelData(rawData);

                    // Initialize charts first if they don't exist
                    if (!state.charts || !state.charts.indexChart) {
                        console.log('Charts not initialized, initializing now');
                        initCharts();
                    }

                    // Load base data first
                    Promise.all([loadZScoreData(), loadRecessionData()])
                        .then(() => {
                            // Process the transformed data
                            processStudentData(transformedData);

                            // Show file info
                            const fileName = filePath.split('/').pop();
                            showFileInfo(fileName, transformedData.length);

                            // Hide progress bar
                            if (uploadProgress && dropzoneContent) {
                                uploadProgress.classList.add('hidden');
                                dropzoneContent.classList.remove('hidden');
                            }

                            if (progressInterval) {
                                clearInterval(progressInterval);
                            }

                            console.log('Sample data loaded and processed successfully');
                        })
                        .catch(error => {
                            console.error('Error loading base data:', error);
                            showError(`Error loading base data: ${error.message}`);
                            resetUploadUI();

                            if (progressInterval) {
                                clearInterval(progressInterval);
                            }
                        });

                } catch (error) {
                    console.error('Error processing sample file:', error);
                    showError(`Error processing sample file: ${error.message}`);
                    resetUploadUI();

                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading sample file:', error);
                showError(`Error loading sample file: ${error.message}`);
                resetUploadUI();

                if (progressInterval) {
                    clearInterval(progressInterval);
                }
            });
    } catch (error) {
        console.error('Error in loadSampleData:', error);
        showError(`Error loading sample data: ${error.message}`);
        resetUploadUI();
    }
}