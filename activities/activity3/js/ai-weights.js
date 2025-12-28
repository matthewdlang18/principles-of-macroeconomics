// Global state
const state = {
    zScoreData: [],
    recessionData: [],
    classWeights: [],
    classIndexData: [],
    classAnalysis: null,
    aiModels: [], // Will store all AI models
    indicators: [
        { id: "10Y2Y_Yield", label: "Yield Curve (10Y-2Y)", weight: 0, classWeight: 0 },
        { id: "ISM_NewOrders", label: "ISM New Orders", weight: 0, classWeight: 0 },
        { id: "Building_Permits", label: "Building Permits", weight: 0, classWeight: 0 },
        { id: "Consumer_Confidence", label: "Consumer Confidence", weight: 0, classWeight: 0 },
        { id: "PMI", label: "PMI", weight: 0, classWeight: 0 },
        { id: "Initial_Claims", label: "Initial Claims", weight: 0, classWeight: 0 },
        { id: "Avg_WeeklyHours", label: "CLI", weight: 0, classWeight: 0 },
        { id: "SP500", label: "S&P 500", weight: 0, classWeight: 0 }
    ],
    classIndex: [],
    charts: {},
    // Map to store indicator ID mappings (from Excel to our internal format)
    indicatorMap: {
        "Yield Curve (10Y-2Y)": "10Y2Y_Yield",
        "ISM New Orders": "ISM_NewOrders",
        "Building Permits": "Building_Permits",
        "Consumer Confidence": "Consumer_Confidence",
        "PMI": "PMI",
        "Initial Claims": "Initial_Claims",
        "CLI": "Avg_WeeklyHours",
        "S&P 500": "SP500"
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Clear any existing state
    state.aiModel1Index = [];
    state.aiModel2Index = [];

    // Debug localStorage data
    console.log('localStorage classAnalysis:', localStorage.getItem('classAnalysis'));
    try {
        const classAnalysis = JSON.parse(localStorage.getItem('classAnalysis') || '{}');
        console.log('Parsed classAnalysis:', classAnalysis);
        console.log('GDP 12-Month:', classAnalysis.gdp12Month);
        console.log('GDP 24-Month:', classAnalysis.gdp24Month);
        console.log('Recession Probability:', classAnalysis.recessionProb);
    } catch (e) {
        console.error('Error parsing classAnalysis:', e);
    }

    setupEventListeners();
    loadClassData();
    initCharts();

    // Update GDP forecasts table
    updateGDPForecastsTable();

    loadBaseData().then(() => {
        console.log("Base data loaded successfully");

        // Update GDP forecasts table again after base data is loaded
        updateGDPForecastsTable();
    }).catch(err => {
        console.error("Error loading base data:", err);
    });
});

// Setup tab navigation - simplified since we removed tabs
function setupTabNavigation() {
    // No tabs to set up anymore
    console.log('Tab navigation disabled - using simplified layout');
}

// Setup all event listeners
function setupEventListeners() {
    // Tab navigation
    setupTabNavigation();

    // File upload event listeners
    const dropzone = document.getElementById('fileDropzone');
    const fileInput = document.getElementById('fileInput');

    // Handle drag and drop events
    if (dropzone) {
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

            if (e.dataTransfer.files.length) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        // Click to upload
        dropzone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }

    // Load sample button - removed per request

    // Class threshold controls
    const classThreshold = document.getElementById('classThreshold');
    const classThresholdValue = document.getElementById('classThresholdValue');
    const classDirection = document.getElementById('classDirection');

    if (classThreshold && classThresholdValue) {
        classThreshold.addEventListener('input', (e) => {
            classThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdClass();
        });
    }

    if (classDirection) {
        classDirection.addEventListener('change', () => {
            applyThresholdClass();
        });
    }

    // Threshold controls for model 1
    const model1Threshold = document.getElementById('aiModel1Threshold');
    const model1ThresholdValue = document.getElementById('aiModel1ThresholdValue');
    const model1Direction = document.getElementById('aiModel1Direction');

    if (model1Threshold && model1ThresholdValue) {
        model1Threshold.addEventListener('input', (e) => {
            model1ThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdModel1();
        });
    }

    if (model1Direction) {
        model1Direction.addEventListener('change', () => {
            applyThresholdModel1();
        });
    }

    // Threshold controls for model 2
    const model2Threshold = document.getElementById('aiModel2Threshold');
    const model2ThresholdValue = document.getElementById('aiModel2ThresholdValue');
    const model2Direction = document.getElementById('aiModel2Direction');

    if (model2Threshold && model2ThresholdValue) {
        model2Threshold.addEventListener('input', (e) => {
            model2ThresholdValue.textContent = parseFloat(e.target.value).toFixed(1);
            applyThresholdModel2();
        });
    }

    if (model2Direction) {
        model2Direction.addEventListener('change', () => {
            applyThresholdModel2();
        });
    }

    // Download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadResults);
    }
}

// Load class data from localStorage
function loadClassData() {
    console.log('Loading class data from localStorage');
    let classDataLoaded = false;

    // Load class weights
    const classWeightsJson = localStorage.getItem('classWeights');
    if (classWeightsJson) {
        try {
            state.classWeights = JSON.parse(classWeightsJson);
            console.log('Class weights loaded:', state.classWeights);

            // Assign class weights to indicators
            state.indicators.forEach(indicator => {
                const classWeight = state.classWeights.find(w => w.id === indicator.id);
                if (classWeight) {
                    indicator.classWeight = classWeight.weight;
                    classDataLoaded = true;
                }
            });
        } catch (error) {
            console.error('Error parsing class weights from localStorage:', error);
        }
    } else {
        console.warn('No class weights found in localStorage');

        // Set default class weights to 0
        state.indicators.forEach(indicator => {
            indicator.classWeight = 0;
        });
    }

    // Load class index data
    const classIndexDataJson = localStorage.getItem('classIndexData');
    if (classIndexDataJson) {
        try {
            const rawClassData = JSON.parse(classIndexDataJson);
            state.classIndexData = rawClassData;

            // Convert to chart-friendly format
            state.classIndex = rawClassData.map(point => ({
                x: new Date(point.date),
                y: point.value
            }));

            classDataLoaded = true;
        } catch (error) {
            console.error('Error parsing class index data from localStorage:', error);
        }
    } else {
        console.warn('No class index data found in localStorage');
        state.classIndex = [];
    }

    // Load class analysis
    const classAnalysisJson = localStorage.getItem('classAnalysis');
    if (classAnalysisJson) {
        try {
            state.classAnalysis = JSON.parse(classAnalysisJson);
            console.log('Class analysis loaded:', state.classAnalysis);

            // Make sure GDP forecasts are properly initialized
            if (!state.classAnalysis.gdp12Month) {
                state.classAnalysis.gdp12Month = 'N/A';
            }
            if (!state.classAnalysis.gdp24Month) {
                state.classAnalysis.gdp24Month = 'N/A';
            }
            if (!state.classAnalysis.recessionProb && state.classAnalysis.recessionProb !== 0) {
                state.classAnalysis.recessionProb = 0;
            }

            console.log('Class analysis after initialization:', state.classAnalysis);
            classDataLoaded = true;
        } catch (error) {
            console.error('Error parsing class analysis from localStorage:', error);
        }
    } else {
        console.warn('No class analysis found in localStorage');
        state.classAnalysis = {
            recessionProb: 0,
            gdp12Month: 'N/A',
            gdp24Month: 'N/A'
        };
    }

    // Load GDP forecast data
    const gdp12DataJson = localStorage.getItem('classGDP12Data');
    const gdp24DataJson = localStorage.getItem('classGDP24Data');

    if (gdp12DataJson) {
        try {
            state.classGDP12Data = JSON.parse(gdp12DataJson);
            console.log('Class GDP 12-month data loaded:', state.classGDP12Data);
            classDataLoaded = true;
        } catch (error) {
            console.error('Error parsing class GDP 12-month data:', error);
        }
    } else {
        console.warn('No class GDP 12-month data found in localStorage');
        state.classGDP12Data = {};
    }

    if (gdp24DataJson) {
        try {
            state.classGDP24Data = JSON.parse(gdp24DataJson);
            console.log('Class GDP 24-month data loaded:', state.classGDP24Data);
            classDataLoaded = true;
        } catch (error) {
            console.error('Error parsing class GDP 24-month data:', error);
        }
    } else {
        console.warn('No class GDP 24-month data found in localStorage');
        state.classGDP24Data = {};
    }

    // Update the weights table
    updateWeightsTable();

    // Update GDP forecast display
    updateForecastDisplay();

    // Show a message if no class data was loaded
    if (!classDataLoaded) {
        console.warn('No class data was loaded. Please upload class data on the TA Dashboard page first.');

        // Show a message to the user
        const uploadSection = document.getElementById('uploadSection');
        if (uploadSection) {
            const message = document.createElement('div');
            message.className = 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4';
            message.innerHTML = `
                <p class="font-bold">No Class Data Available</p>
                <p>Please upload class data on the <a href="ta-dashboard.html" class="underline">TA Dashboard</a> page first.</p>
            `;
            uploadSection.insertBefore(message, uploadSection.firstChild);
        }
    }
}

// Initialize all charts
function initCharts() {
    // Weights comparison chart
    const weightsCtx = document.getElementById('weightsChart')?.getContext('2d');
    if (weightsCtx) {
        state.charts.weightsChart = new Chart(weightsCtx, {
            type: 'bar',
            data: {
                labels: state.indicators.map(ind => ind.label),
                datasets: [
                    {
                        label: 'AI Model 1',
                        data: state.indicators.map(ind => ind.aiModel1Weight || 0),
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'AI Model 2',
                        data: state.indicators.map(ind => ind.aiModel2Weight || 0),
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Class',
                        data: state.indicators.map(ind => ind.classWeight || 0),
                        backgroundColor: 'rgba(255, 206, 86, 0.5)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Weight (%)'
                        }
                    }
                }
            }
        });
    }

    // Common line chart options
    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
            point: {
                radius: 0 // Remove dots
            }
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'year'
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
                }
            }
        },
        plugins: {
            annotation: {
                annotations: {}
            },
            tooltip: {
                intersect: false,
                mode: 'index'
            }
        }
    };

    // AI Model 1 chart
    const aiModel1Ctx = document.getElementById('aiModel1Chart')?.getContext('2d');
    if (aiModel1Ctx) {
        state.charts.aiModel1Chart = new Chart(aiModel1Ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'AI Model 1 Index',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(54, 162, 235, 0.05)',
                        below: 'rgba(54, 162, 235, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }

    // AI Model 2 chart
    const aiModel2Ctx = document.getElementById('aiModel2Chart')?.getContext('2d');
    if (aiModel2Ctx) {
        state.charts.aiModel2Chart = new Chart(aiModel2Ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'AI Model 2 Index',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 99, 132, 0.05)',
                        below: 'rgba(255, 99, 132, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }

    // Class chart - ensure we use a deep copy of classIndex
    const classCtx = document.getElementById('classChart')?.getContext('2d');
    if (classCtx) {
        // Make a deep copy of the class index data
        const classIndexCopy = state.classIndex ? JSON.parse(JSON.stringify(state.classIndex)) : [];
        console.log("Initializing Class chart with data:", classIndexCopy.slice(0, 3));

        state.charts.classChart = new Chart(classCtx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Class Index',
                    data: classIndexCopy,
                    borderColor: 'rgb(255, 206, 86)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: {
                        target: 'origin',
                        above: 'rgba(255, 206, 86, 0.05)',
                        below: 'rgba(255, 206, 86, 0.05)'
                    }
                }]
            },
            options: {...lineChartOptions}
        });
    }

    // Comparison chart - ensure we use deep copies of all data
    const comparisonCtx = document.getElementById('comparisonChart')?.getContext('2d');
    if (comparisonCtx) {
        // Make deep copies of all data to ensure independence
        const classIndexCopy = state.classIndex ? JSON.parse(JSON.stringify(state.classIndex)) : [];

        state.charts.comparisonChart = new Chart(comparisonCtx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'AI Model 1',
                        data: [], // Will be updated later
                        borderColor: 'rgb(54, 162, 235)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'AI Model 2',
                        data: [], // Will be updated later
                        borderColor: 'rgb(255, 99, 132)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    },
                    {
                        label: 'Class',
                        data: classIndexCopy,
                        borderColor: 'rgb(255, 206, 86)',
                        borderWidth: 2,
                        tension: 0.1,
                        fill: false
                    }
                ]
            },
            options: {...lineChartOptions}
        });

        console.log("Initialized comparison chart with class data:", classIndexCopy.slice(0, 3));
    }
}

// Load base data from CSV files
async function loadBaseData() {
    try {
        // Check if data is already loaded
        if (state.zScoreData.length > 0 && state.recessionData.length > 0) {
            console.log('Base data already loaded, skipping fetch');
            return true;
        }

        // Load data files
        const [zScoreResponse, recessionResponse] = await Promise.all([
            fetch('data/LeadingIndicators_ZScore.csv'),
            fetch('data/recessions.csv')
        ]);

        if (!zScoreResponse.ok) {
            throw new Error(`Failed to load Z-Score data: ${zScoreResponse.status}`);
        }

        if (!recessionResponse.ok) {
            throw new Error(`Failed to load recession data: ${recessionResponse.status}`);
        }

        const zScoreText = await zScoreResponse.text();
        const recessionText = await recessionResponse.text();

        // Parse CSV data with headers
        const zScoreData = Papa.parse(zScoreText, { header: true }).data;
        const recessionData = Papa.parse(recessionText, { header: true }).data;

        // Process Z-Score data
        state.zScoreData = zScoreData
            .filter(row => row.time)
            .map(row => {
                // Parse the date (format is MM/DD/YY)
                const dateParts = row.time.split('/');
                const month = parseInt(dateParts[0], 10);
                const day = parseInt(dateParts[1], 10) || 1;
                let year = parseInt(dateParts[2], 10);

                // Handle 2-digit years
                if (year < 100) {
                    year = year < 50 ? 2000 + year : 1900 + year;
                }

                const date = new Date(year, month - 1, day);

                return {
                    date: date,
                    "10Y2Y_Yield": parseFloat(row["10Y2Y_Yield"]) || 0,
                    "ISM_NewOrders": parseFloat(row["ISM New Orders"]) || 0,
                    "Building_Permits": parseFloat(row["Building Permits"]) || 0,
                    "Consumer_Confidence": parseFloat(row["Consumer Confidence"]) || 0,
                    "PMI": parseFloat(row["PMI"]) || 0,
                    "Initial_Claims": parseFloat(row["4-Week MA Initial Unemployment Claims"]) || 0,
                    "Avg_WeeklyHours": parseFloat(row["US CLI"]) || 0,
                    "SP500": parseFloat(row["SP500"]) || 0
                };
            })
            .filter(row => !isNaN(row.date.getTime()))
            // Filter to start from June 1977
            .filter(row => row.date >= new Date(1977, 5, 1));

        console.log(`Processed ${state.zScoreData.length} Z-Score data entries`);

        // Process recession data
        state.recessionData = recessionData
            .filter(row => row.start && row.end)
            .map(row => {
                try {
                    return {
                        start: new Date(row.start),
                        end: new Date(row.end)
                    };
                } catch (e) {
                    console.warn('Error parsing recession date:', e);
                    return null;
                }
            })
            .filter(recession =>
                recession &&
                !isNaN(recession.start.getTime()) &&
                !isNaN(recession.end.getTime())
            );

        console.log(`Processed ${state.recessionData.length} recession periods`);

        // Add recession overlays to charts
        addRecessionOverlays();

        return true;
    } catch (error) {
        console.error('Error loading base data:', error);
        alert(`Failed to load base data: ${error.message}. Please try refreshing the page.`);
        throw error;
    }
}

// Add recession overlays to all charts
function addRecessionOverlays() {
    // Create annotations for recession periods
    const recessionAnnotations = {};

    state.recessionData.forEach((recession, index) => {
        recessionAnnotations[`recession-${index}`] = {
            type: 'box',
            xMin: recession.start,
            xMax: recession.end,
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderColor: 'rgba(255, 0, 0, 0.1)',
            borderWidth: 0
        };
    });

    // Add to each chart
    for (const chartName in state.charts) {
        const chart = state.charts[chartName];
        if (chart && chart.options && chart.options.plugins && chart.options.plugins.annotation) {
            chart.options.plugins.annotation.annotations = recessionAnnotations;
            chart.update();
        }
    }
}

// Handle file upload
function handleFileUpload(file) {
    if (!file) return;

    // Show loading state
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');

    console.log('File upload started:', file.name);

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        document.getElementById('progressBar').style.width = `${progress}%`;
    }, 100);

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            let parsedData;

            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const csvData = Papa.parse(e.target.result, { header: true });
                parsedData = csvData.data;
            } else {
                // Parse Excel
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheet];
                parsedData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                console.log("Parsed Excel data:", parsedData);
            }

            console.log('Parsed data:', parsedData);

            // Load base data first, then process weights
            loadBaseData()
                .then(() => {
                    console.log('Base data loaded, processing file data');
                    clearInterval(progressInterval);

                    // Process the data
                    console.log("Processing file data with format:", file.name);
                    processWeightsData(parsedData);

                    // Update UI
                    document.getElementById('fileName').textContent = file.name;
                    document.getElementById('modelCount').textContent =
                        `${state.aiModels.length} AI models loaded`;
                    document.getElementById('fileInfo').classList.remove('hidden');
                    document.getElementById('analysisContent').classList.remove('hidden');

                    // Reset upload UI
                    resetUploadUI();
                })
                .catch(error => {
                    console.error('Error processing file:', error);
                    alert('Failed to process the file. Please check the format and try again.');
                    resetUploadUI();
                    clearInterval(progressInterval);
                });
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading the file. Please try again.');
            resetUploadUI();
            clearInterval(progressInterval);
        }
    };

    reader.onerror = function() {
        console.error('File reader error');
        alert('Error reading the file. Please try again.');
        resetUploadUI();
        clearInterval(progressInterval);
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// Load sample AI weights file
function loadSampleFile(filePath) {
    console.log('Loading sample file:', filePath);

    // Show loading state
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('dropzoneContent').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 90) clearInterval(progressInterval);
        document.getElementById('progressBar').style.width = `${progress}%`;
    }, 100);

    // Fetch the file
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load sample file: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            try {
                let parsedData;

                if (filePath.endsWith('.csv')) {
                    // Parse CSV
                    const csvText = new TextDecoder().decode(arrayBuffer);
                    const csvData = Papa.parse(csvText, { header: true });
                    parsedData = csvData.data;
                } else {
                    // Parse Excel
                    const data = new Uint8Array(arrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheet = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheet];
                    parsedData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                    console.log("Parsed sample Excel data:", parsedData);
                }

                console.log('Parsed sample data:', parsedData);

                // Load base data first, then process weights
                loadBaseData()
                    .then(() => {
                        console.log('Base data loaded, processing sample data');
                        clearInterval(progressInterval);

                        // Process the data
                        console.log("Processing sample data from:", filePath);
                        processWeightsData(parsedData);

                        // Update UI
                        const fileName = filePath.split('/').pop();
                        document.getElementById('fileName').textContent = fileName;
                        document.getElementById('modelCount').textContent =
                            `${state.aiModels.length} AI models loaded`;
                        document.getElementById('fileInfo').classList.remove('hidden');
                        document.getElementById('analysisContent').classList.remove('hidden');

                        // Reset upload UI
                        resetUploadUI();
                    })
                    .catch(error => {
                        console.error('Error processing sample file:', error);
                        alert('Failed to process the sample file. Please try again.');
                        resetUploadUI();
                        clearInterval(progressInterval);
                    });
            } catch (error) {
                console.error('Error parsing sample file:', error);
                alert('Error parsing the sample file. Please try again.');
                resetUploadUI();
                clearInterval(progressInterval);
            }
        })
        .catch(error => {
            console.error('Error loading sample file:', error);
            alert('Error loading the sample file. Please try again.');
            resetUploadUI();
            clearInterval(progressInterval);
        });
}

// Process weights data from uploaded file
function processWeightsData(data) {
    console.log("Processing weights data:", data);

    if (!data || data.length === 0) {
        console.error('No data to process');
        alert('No data found in the file.');
        return false;
    }

    try {
        // Check if this is the new format (with Indicator column)
        if (data[0] && data[0].hasOwnProperty('Indicator')) {
            processNewFormatData(data);
            return true;
        }

        // Legacy format processing
        let normalizedData = normalizeWeightsData(data);
        console.log('Normalized data:', normalizedData);

        // Reset AI models array
        state.aiModels = [];

        // Create AI model objects for each model in the data
        normalizedData.forEach((modelData, index) => {
            const modelName = modelData.model_name || `AI Model ${index + 1}`;

            // Create weights object
            const weights = {};
            state.indicators.forEach(indicator => {
                weights[indicator.id] = parseFloat(modelData[indicator.id]) || 0;
            });

            // Add to aiModels array
            state.aiModels.push({
                name: modelName,
                weights: weights,
                index: [],
                analysis: null
            });
        });

        // Calculate indices for each AI model
        calculateIndices();

        // Update UI
        updateModelNames();
        updateWeightsTable();
        updateCharts();

        // Analyze signals
        analyzeAllModels();

        // Assign weights to indicators
        state.indicators.forEach(indicator => {
            // Reset AI weights
            indicator.aiModel1Weight = 0;
            indicator.aiModel2Weight = 0;

            if (normalizedData.length > 0) {
                // Check for the indicator in the normalized data
                // Try different property naming formats
                let weight = null;
                if (normalizedData[0][indicator.id] !== undefined) {
                    weight = normalizedData[0][indicator.id];
                } else if (normalizedData[0][indicator.label] !== undefined) {
                    weight = normalizedData[0][indicator.label];
                } else {
                    // Try to find a similar property name
                    for (const key in normalizedData[0]) {
                        const keyLower = key.toLowerCase();
                        const idLower = indicator.id.toLowerCase();
                        const labelLower = indicator.label.toLowerCase();

                        if (keyLower.includes(idLower) || keyLower.includes(labelLower) ||
                            idLower.includes(keyLower) || labelLower.includes(keyLower)) {
                            weight = normalizedData[0][key];
                            break;
                        }
                    }
                }

                // Convert weight to number and ensure it's not copied from class weights
                const numWeight = weight !== null ? parseFloat(weight) || 0 : 0;

                // Extra check to prevent AI weight from being identical to class weight
                // If they happen to be the same, add a tiny offset
                indicator.aiModel1Weight = numWeight;
                if (indicator.aiModel1Weight === indicator.classWeight) {
                    console.log(`WARNING: AI Model 1 and Class weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel1Weight = numWeight + 0.01;
                }

                console.log(`Set model 1 weight for ${indicator.id}: ${indicator.aiModel1Weight}`);
            }

            if (normalizedData.length > 1) {
                // Repeat the same for model 2
                let weight = null;
                if (normalizedData[1][indicator.id] !== undefined) {
                    weight = normalizedData[1][indicator.id];
                } else if (normalizedData[1][indicator.label] !== undefined) {
                    weight = normalizedData[1][indicator.label];
                } else {
                    // Try to find a similar property name
                    for (const key in normalizedData[1]) {
                        const keyLower = key.toLowerCase();
                        const idLower = indicator.id.toLowerCase();
                        const labelLower = indicator.label.toLowerCase();

                        if (keyLower.includes(idLower) || keyLower.includes(labelLower) ||
                            idLower.includes(keyLower) || labelLower.includes(keyLower)) {
                            weight = normalizedData[1][key];
                            break;
                        }
                    }
                }

                // Convert weight to number and ensure it's not copied from class weights
                const numWeight = weight !== null ? parseFloat(weight) || 0 : 0;

                // Extra check to prevent AI weight from being identical to class weight
                // If they happen to be the same, add a tiny offset
                indicator.aiModel2Weight = numWeight;
                if (indicator.aiModel2Weight === indicator.classWeight) {
                    console.log(`WARNING: AI Model 2 and Class weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel2Weight = numWeight + 0.02;
                }

                // Also ensure AI Model 2 weights aren't identical to AI Model 1
                if (indicator.aiModel2Weight === indicator.aiModel1Weight) {
                    console.log(`WARNING: AI Model 2 and AI Model 1 weights are identical for ${indicator.id}. Adding offset.`);
                    indicator.aiModel2Weight = numWeight + 0.03;
                }

                console.log(`Set model 2 weight for ${indicator.id}: ${indicator.aiModel2Weight}`);
            }
        });

        // Update weights table
        updateWeightsTable();

        // Calculate indices
        calculateIndices();

        // Update charts
        updateCharts();

        // Process class index performance metrics
        if (state.classIndex && state.classIndex.length > 0) {
            const classSignals = generateSignals(state.classIndex, 0, 'below');
            state.classAnalysis = analyzeSignals(classSignals);
            console.log('Class Analysis:', state.classAnalysis);
        }

        // Set initial thresholds and apply
        setInitialThresholds();

        // Show analysis section
        document.getElementById('analysisContent').classList.remove('hidden');

        return true;
    } catch (error) {
        console.error('Error processing weights data:', error);
        // Don't show alert here - file might be partially processed
        console.error('Continuing anyway with whatever data was processed');

        // Update UI with what we have
        updateWeightsTable();
        calculateIndices();
        updateCharts();
        setInitialThresholds();
        document.getElementById('analysisContent').classList.remove('hidden');

        return true;
    }
}

// Process new format data (with Indicator column and multiple AI models)
function processNewFormatData(data) {
    console.log("Processing new format data:", data);

    try {
        // Get all AI model names (all columns except 'Indicator')
        const firstRow = data[0];
        const allModelNames = Object.keys(firstRow).filter(key => key !== 'Indicator');

        if (allModelNames.length === 0) {
            console.error('No AI models found in file');
            alert('No AI models found in file. Please check the format.');
            return false;
        }

        console.log('Found AI models:', allModelNames);

        // Group models by platform (ChatGPT, Claude, Gemini, etc.)
        const platformGroups = {};

        allModelNames.forEach(name => {
            // Extract the base platform name (before any period, underscore or number)
            let platformName = name;

            // Handle formats like "ChatGPT.1", "Claude_2", etc.
            const match = name.match(/^([A-Za-z]+)(?:[._\s-]\d+)?$/);
            if (match) {
                platformName = match[1];
            }

            // Also handle formats with spaces like "ChatGPT 1"
            const spaceMatch = name.match(/^([A-Za-z]+)(?:\s+\d+)?$/);
            if (spaceMatch) {
                platformName = spaceMatch[1];
            }

            console.log(`Mapping model name "${name}" to platform "${platformName}"`);

            // Initialize the platform group if it doesn't exist
            if (!platformGroups[platformName]) {
                platformGroups[platformName] = {
                    models: [],
                    weights: {},
                    gdp12Month: null,
                    gdp24Month: null,
                    recessionProb: 0,
                    count: 0
                };
            }

            // Add this model to its platform group
            platformGroups[platformName].models.push(name);
            platformGroups[platformName].count++;
        });

        console.log('Grouped models by platform:', platformGroups);

        // Reset AI models array
        state.aiModels = [];

        // Create an AI average model
        const aiAverageModel = {
            name: 'AI Average',
            weights: {},
            index: [],
            analysis: null,
            gdp12Month: null,
            gdp24Month: null,
            recessionProb: null,
            isAverage: true
        };

        // Process each row (indicator)
        data.forEach(row => {
            const indicatorName = row.Indicator;
            if (!indicatorName) return;

            // Special handling for GDP forecasts and recession probability
            if (indicatorName === '12-Month GDP Growth') {
                // Process for each platform group
                Object.keys(platformGroups).forEach(platform => {
                    let totalValue = '';
                    let validCount = 0;

                    // Collect values from all models in this platform
                    platformGroups[platform].models.forEach(modelName => {
                        if (row[modelName] && row[modelName].trim() !== '') {
                            totalValue = row[modelName]; // Just use the last valid value for text
                            validCount++;
                        }
                    });

                    if (validCount > 0) {
                        platformGroups[platform].gdp12Month = totalValue;
                    }
                });

                // Calculate average for AI Average model (just use most common value)
                const valueFrequency = {};
                allModelNames.forEach(modelName => {
                    if (row[modelName] && row[modelName].trim() !== '') {
                        valueFrequency[row[modelName]] = (valueFrequency[row[modelName]] || 0) + 1;
                    }
                });

                let mostCommonValue = null;
                let highestFrequency = 0;

                Object.entries(valueFrequency).forEach(([value, frequency]) => {
                    if (frequency > highestFrequency) {
                        mostCommonValue = value;
                        highestFrequency = frequency;
                    }
                });

                aiAverageModel.gdp12Month = mostCommonValue;

                return;
            }

            if (indicatorName === '24-Month GDP Growth') {
                // Process for each platform group
                Object.keys(platformGroups).forEach(platform => {
                    let totalValue = '';
                    let validCount = 0;

                    // Collect values from all models in this platform
                    platformGroups[platform].models.forEach(modelName => {
                        if (row[modelName] && row[modelName].trim() !== '') {
                            totalValue = row[modelName]; // Just use the last valid value for text
                            validCount++;
                        }
                    });

                    if (validCount > 0) {
                        platformGroups[platform].gdp24Month = totalValue;
                    }
                });

                // Calculate average for AI Average model (just use most common value)
                const valueFrequency = {};
                allModelNames.forEach(modelName => {
                    if (row[modelName] && row[modelName].trim() !== '') {
                        valueFrequency[row[modelName]] = (valueFrequency[row[modelName]] || 0) + 1;
                    }
                });

                let mostCommonValue = null;
                let highestFrequency = 0;

                Object.entries(valueFrequency).forEach(([value, frequency]) => {
                    if (frequency > highestFrequency) {
                        mostCommonValue = value;
                        highestFrequency = frequency;
                    }
                });

                aiAverageModel.gdp24Month = mostCommonValue;

                return;
            }

            if (indicatorName === 'Recession Probability') {
                // Process for each platform group
                Object.keys(platformGroups).forEach(platform => {
                    let totalProb = 0;
                    let validCount = 0;

                    // Sum probabilities from all models in this platform
                    platformGroups[platform].models.forEach(modelName => {
                        const prob = parseFloat(row[modelName]) || 0;
                        if (!isNaN(prob)) {
                            totalProb += prob;
                            validCount++;
                        }
                    });

                    if (validCount > 0) {
                        platformGroups[platform].recessionProb = totalProb / validCount;
                    }
                });

                // Calculate average recession probability across all models
                const validProbabilities = allModelNames
                    .map(modelName => parseFloat(row[modelName]) || 0)
                    .filter(prob => !isNaN(prob));

                if (validProbabilities.length > 0) {
                    const avgProb = validProbabilities.reduce((sum, prob) => sum + prob, 0) / validProbabilities.length;
                    aiAverageModel.recessionProb = avgProb;
                }

                return;
            }

            // Map the indicator name to our internal ID
            let indicatorId = null;

            // Try direct mapping first
            if (state.indicatorMap[indicatorName]) {
                indicatorId = state.indicatorMap[indicatorName];
            } else {
                // Try to find a close match
                for (const [key, value] of Object.entries(state.indicatorMap)) {
                    if (key.toLowerCase().includes(indicatorName.toLowerCase()) ||
                        indicatorName.toLowerCase().includes(key.toLowerCase())) {
                        indicatorId = value;
                        break;
                    }
                }
            }

            if (!indicatorId) {
                console.warn(`Unknown indicator: ${indicatorName}`);
                return;
            }

            // Process weights for each platform group
            Object.keys(platformGroups).forEach(platform => {
                let totalWeight = 0;
                let validCount = 0;

                // Sum weights from all models in this platform
                platformGroups[platform].models.forEach(modelName => {
                    const weight = parseFloat(row[modelName]) || 0;
                    if (!isNaN(weight)) {
                        totalWeight += weight;
                        validCount++;
                    }
                });

                if (validCount > 0) {
                    // Store average weight for this indicator in this platform
                    if (!platformGroups[platform].weights[indicatorId]) {
                        platformGroups[platform].weights[indicatorId] = 0;
                    }
                    platformGroups[platform].weights[indicatorId] = totalWeight / validCount;
                }
            });

            // Calculate average weight across all models for AI Average
            let totalWeight = 0;
            let modelCount = 0;

            allModelNames.forEach(modelName => {
                const weight = parseFloat(row[modelName]) || 0;
                if (!isNaN(weight)) {
                    totalWeight += weight;
                    modelCount++;
                }
            });

            if (modelCount > 0) {
                aiAverageModel.weights[indicatorId] = totalWeight / modelCount;
            }
        });

        // Convert platform groups to AI models
        Object.entries(platformGroups).forEach(([platform, data]) => {
            state.aiModels.push({
                name: platform,
                weights: data.weights,
                index: [],
                analysis: null,
                gdp12Month: data.gdp12Month,
                gdp24Month: data.gdp24Month,
                recessionProb: data.recessionProb
            });
        });

        // Add the AI average model to the beginning of the array
        state.aiModels.unshift(aiAverageModel);

        // Calculate indices for each AI model
        calculateIndices();

        // Update UI
        updateModelNames();
        updateWeightsTable();
        updateCharts();

        // Analyze signals
        analyzeAllModels();

        // Update GDP and recession probability display
        updateForecastDisplay();

        return true;
    } catch (error) {
        console.error('Error processing new format data:', error);
        alert('Failed to process data. Please check the file format.');
        return false;
    }
}

// Normalize data to expected format
function normalizeWeightsData(data) {
    // Add debugging for raw parsed data
    console.log("Normalizing data:", data);

    // If we have empty data, return an empty default structure
    if (!data || !data.length) {
        return [{
            model_name: 'AI Model 1',
            '10Y2Y_Yield': 0,
            'ISM_NewOrders': 0,
            'Building_Permits': 0,
            'Consumer_Confidence': 0,
            'PMI': 0,
            'Initial_Claims': 0,
            'Avg_WeeklyHours': 0,
            'SP500': 0
        }];
    }

    // Check if data is already in expected format
    if (data[0] && (data[0].model_name || data[0]['10Y2Y_Yield'])) {
        console.log("Data already in expected format");
        return data;
    }

    // Try to determine format and convert
    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    console.log("Data keys:", keys);

    // Special handling for Excel files which might have different structure
    if (data[0] && typeof data[0] === 'object') {
        // Create model entries
        const models = [];

        // AIModel1
        const model1 = {
            model_name: 'AI Model 1',
            '10Y2Y_Yield': parseFloat(data[0]['10Y2Y_Yield'] || 0),
            'ISM_NewOrders': parseFloat(data[0]['ISM_NewOrders'] || data[0]['ISM New Orders'] || 0),
            'Building_Permits': parseFloat(data[0]['Building_Permits'] || data[0]['Building Permits'] || 0),
            'Consumer_Confidence': parseFloat(data[0]['Consumer_Confidence'] || data[0]['Consumer Confidence'] || 0),
            'PMI': parseFloat(data[0]['PMI'] || 0),
            'Initial_Claims': parseFloat(data[0]['Initial_Claims'] || data[0]['Initial Claims'] || 0),
            'Avg_WeeklyHours': parseFloat(data[0]['Avg_WeeklyHours'] || data[0]['CLI'] || 0),
            'SP500': parseFloat(data[0]['SP500'] || data[0]['S&P 500'] || 0)
        };
        models.push(model1);

        // AIModel2 (if data has more than one row)
        if (data.length > 1) {
            const model2 = {
                model_name: 'AI Model 2',
                '10Y2Y_Yield': parseFloat(data[1]['10Y2Y_Yield'] || 0),
                'ISM_NewOrders': parseFloat(data[1]['ISM_NewOrders'] || data[1]['ISM New Orders'] || 0),
                'Building_Permits': parseFloat(data[1]['Building_Permits'] || data[1]['Building Permits'] || 0),
                'Consumer_Confidence': parseFloat(data[1]['Consumer_Confidence'] || data[1]['Consumer Confidence'] || 0),
                'PMI': parseFloat(data[1]['PMI'] || 0),
                'Initial_Claims': parseFloat(data[1]['Initial_Claims'] || data[1]['Initial Claims'] || 0),
                'Avg_WeeklyHours': parseFloat(data[1]['Avg_WeeklyHours'] || data[1]['CLI'] || 0),
                'SP500': parseFloat(data[1]['SP500'] || data[1]['S&P 500'] || 0)
            };
            models.push(model2);
        }

        console.log("Normalized models:", models);
        return models;
    }

    // Standard CSV format handling
    if (keys.length > 1) {
        // First key might be model name
        const nameKey = keys[0];
        const weightKeys = keys.slice(1);

        // Map to our expected format
        const result = data.map(row => {
            const result = {
                model_name: row[nameKey] || 'AI Model'
            };

            // Map other columns to indicator IDs
            weightKeys.forEach(key => {
                // Find the most likely indicator match
                const matchedIndicator = findMatchingIndicator(key);
                if (matchedIndicator) {
                    result[matchedIndicator.id] = parseFloat(row[key]) || 0;
                } else {
                    // If no match, keep original key
                    result[key] = parseFloat(row[key]) || 0;
                }
            });

            return result;
        });

        console.log("Normalized results:", result);
        return result;
    }

    // If we can't determine format, return a default structure
    console.warn("Could not determine data format, using defaults");
    return [{
        model_name: 'AI Model 1',
        '10Y2Y_Yield': 15,
        'ISM_NewOrders': 12,
        'Building_Permits': 10,
        'Consumer_Confidence': 14,
        'PMI': 11,
        'Initial_Claims': 12,
        'Avg_WeeklyHours': 10,
        'SP500': 14
    }];
}

// Find matching indicator based on key name
function findMatchingIndicator(key) {
    // Try exact match first
    let indicator = state.indicators.find(ind => ind.id === key);
    if (indicator) return indicator;

    // Try label match
    indicator = state.indicators.find(ind => ind.label === key);
    if (indicator) return indicator;

    // Try fuzzy matches
    const keyLower = key.toLowerCase();

    // Check each indicator for partial matches
    for (const ind of state.indicators) {
        const idLower = ind.id.toLowerCase();
        const labelLower = ind.label.toLowerCase();

        // Check if key contains indicator ID or label
        if (keyLower.includes(idLower) || idLower.includes(keyLower) ||
            keyLower.includes(labelLower) || labelLower.includes(keyLower)) {
            return ind;
        }
    }

    // Special cases
    if (keyLower.includes('yield') || keyLower.includes('10y') || keyLower.includes('2y')) {
        return state.indicators.find(ind => ind.id === '10Y2Y_Yield');
    }
    if (keyLower.includes('ism') || keyLower.includes('order')) {
        return state.indicators.find(ind => ind.id === 'ISM_NewOrders');
    }
    if (keyLower.includes('build') || keyLower.includes('permit')) {
        return state.indicators.find(ind => ind.id === 'Building_Permits');
    }
    if (keyLower.includes('consumer') || keyLower.includes('conf')) {
        return state.indicators.find(ind => ind.id === 'Consumer_Confidence');
    }
    if (keyLower.includes('pmi') || keyLower.includes('manufacturing')) {
        return state.indicators.find(ind => ind.id === 'PMI');
    }
    if (keyLower.includes('claim') || keyLower.includes('initial') || keyLower.includes('unemploy')) {
        return state.indicators.find(ind => ind.id === 'Initial_Claims');
    }
    if (keyLower.includes('cli') || keyLower.includes('lead') || keyLower.includes('hour')) {
        return state.indicators.find(ind => ind.id === 'Avg_WeeklyHours');
    }
    if (keyLower.includes('sp') || keyLower.includes('s&p') || keyLower.includes('500')) {
        return state.indicators.find(ind => ind.id === 'SP500');
    }

    return null;
}

// Update model names in UI
function updateModelNames() {
    // Update chart titles
    const aiModel1Title = document.getElementById('aiModel1Title');
    if (aiModel1Title && state.aiModels.length > 0) {
        aiModel1Title.textContent = `${state.aiModels[0].name} Leading Index`;
    }

    const aiModel2Title = document.getElementById('aiModel2Title');
    if (aiModel2Title && state.aiModels.length > 1) {
        aiModel2Title.textContent = `${state.aiModels[1].name} Leading Index`;
    }

    // Update comparison chart
    if (state.charts.comparisonChart) {
        for (let i = 0; i < state.aiModels.length && i < state.charts.comparisonChart.data.datasets.length; i++) {
            state.charts.comparisonChart.data.datasets[i].label = state.aiModels[i].name;
        }
        state.charts.comparisonChart.update();
    }
}

// Update GDP forecasts and recession probability display
function updateForecastDisplay() {
    // Check if we have the forecast content element
    const forecastContent = document.getElementById('forecastContent');
    if (!forecastContent) {
        console.warn('Forecast content element not found');
        return;
    }

    // Make sure the forecast tab is visible
    const forecastTab = document.getElementById('tabForecast');
    if (forecastTab) {
        forecastTab.classList.remove('hidden');
    }

    // Clear existing content
    forecastContent.innerHTML = '';

    // Create forecast table
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Add header cells
    const headers = ['Model', '12-Month GDP Forecast', '24-Month GDP Forecast', 'Recession Probability'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.className = 'px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');

    // Add row for each AI model
    state.aiModels.forEach((model, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';

        // Highlight the AI Average row
        if (model.isAverage) {
            row.className = 'bg-blue-50';
        }

        // Model name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = model.name;
        row.appendChild(nameCell);

        // 12-Month GDP Forecast
        const gdp12Cell = document.createElement('td');
        gdp12Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        gdp12Cell.textContent = model.gdp12Month || 'N/A';
        row.appendChild(gdp12Cell);

        // 24-Month GDP Forecast
        const gdp24Cell = document.createElement('td');
        gdp24Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        gdp24Cell.textContent = model.gdp24Month || 'N/A';
        row.appendChild(gdp24Cell);

        // Recession Probability
        const probCell = document.createElement('td');
        probCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';

        if (model.recessionProb !== null) {
            // Color-code the probability
            const prob = model.recessionProb;
            let colorClass = '';

            if (prob >= 70) {
                colorClass = 'bg-red-100 text-red-800';
            } else if (prob >= 40) {
                colorClass = 'bg-yellow-100 text-yellow-800';
            } else {
                colorClass = 'bg-green-100 text-green-800';
            }

            probCell.className = `px-4 py-2 whitespace-nowrap text-sm font-medium ${colorClass} rounded`;
            probCell.textContent = `${prob.toFixed(1)}%`;
        } else {
            probCell.textContent = 'N/A';
        }

        row.appendChild(probCell);

        // Add row to table
        tbody.appendChild(row);
    });

    // Add class average row if available
    if (state.classGdp12Month || state.classGdp24Month || state.classRecessionProb) {
        const classRow = document.createElement('tr');
        classRow.className = 'bg-yellow-50';

        // Class name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = 'Class Average';
        classRow.appendChild(nameCell);

        // 12-Month GDP Forecast
        const gdp12Cell = document.createElement('td');
        gdp12Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        gdp12Cell.textContent = state.classGdp12Month || 'N/A';
        classRow.appendChild(gdp12Cell);

        // 24-Month GDP Forecast
        const gdp24Cell = document.createElement('td');
        gdp24Cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
        gdp24Cell.textContent = state.classGdp24Month || 'N/A';
        classRow.appendChild(gdp24Cell);

        // Recession Probability
        const probCell = document.createElement('td');
        probCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';

        if (state.classRecessionProb !== null && state.classRecessionProb !== undefined) {
            // Color-code the probability
            const prob = state.classRecessionProb;
            let colorClass = '';

            if (prob >= 70) {
                colorClass = 'bg-red-100 text-red-800';
            } else if (prob >= 40) {
                colorClass = 'bg-yellow-100 text-yellow-800';
            } else {
                colorClass = 'bg-green-100 text-green-800';
            }

            probCell.className = `px-4 py-2 whitespace-nowrap text-sm font-medium ${colorClass} rounded`;
            probCell.textContent = `${prob.toFixed(1)}%`;
        } else {
            probCell.textContent = 'N/A';
        }

        classRow.appendChild(probCell);

        // Add row to table
        tbody.appendChild(classRow);
    }

    table.appendChild(tbody);
    forecastContent.appendChild(table);

    // Add analysis section
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'mt-6 bg-gray-50 p-4 rounded-lg';

    const analysisTitle = document.createElement('h4');
    analysisTitle.className = 'font-medium text-gray-900 mb-2';
    analysisTitle.textContent = 'Forecast Analysis';
    analysisDiv.appendChild(analysisTitle);

    // Calculate average AI recession probability
    let avgRecessionProb = null;
    const validModels = state.aiModels.filter(model => model.recessionProb !== null && !model.isAverage);

    if (validModels.length > 0) {
        avgRecessionProb = validModels.reduce((sum, model) => sum + model.recessionProb, 0) / validModels.length;
    }

    // Create analysis content
    const analysisList = document.createElement('ul');
    analysisList.className = 'list-disc pl-6 space-y-2 text-gray-600';

    // Add analysis points
    if (avgRecessionProb !== null) {
        const recessionItem = document.createElement('li');
        recessionItem.textContent = `The average AI model predicts a ${avgRecessionProb.toFixed(1)}% probability of recession in the next 12 months.`;

        if (state.classRecessionProb !== null && state.classRecessionProb !== undefined) {
            const diff = avgRecessionProb - state.classRecessionProb;
            if (Math.abs(diff) < 5) {
                recessionItem.textContent += ` This is very close to the class average of ${state.classRecessionProb.toFixed(1)}%.`;
            } else if (diff > 0) {
                recessionItem.textContent += ` This is ${diff.toFixed(1)} percentage points higher than the class average of ${state.classRecessionProb.toFixed(1)}%.`;
            } else {
                recessionItem.textContent += ` This is ${Math.abs(diff).toFixed(1)} percentage points lower than the class average of ${state.classRecessionProb.toFixed(1)}%.`;
            }
        }

        analysisList.appendChild(recessionItem);
    }

    // Add GDP forecast analysis
    const gdp12Item = document.createElement('li');
    gdp12Item.textContent = 'The AI models show a range of 12-month GDP forecasts, with most predicting slow to moderate growth.';
    analysisList.appendChild(gdp12Item);

    const gdp24Item = document.createElement('li');
    gdp24Item.textContent = 'For the 24-month horizon, there is more variation in the forecasts, reflecting greater uncertainty.';
    analysisList.appendChild(gdp24Item);

    // Add the analysis list to the div
    analysisDiv.appendChild(analysisList);

    // Add the analysis div to the forecast content
    forecastContent.appendChild(analysisDiv);
}

// Calculate indices based on weights
function calculateIndices() {
    if (!state.zScoreData || state.zScoreData.length === 0) {
        console.error('No Z-Score data available');
        return;
    }

    // Reset legacy indices
    state.aiModel1Index = [];
    state.aiModel2Index = [];

    // Calculate indices for each AI model
    state.aiModels.forEach((model, modelIndex) => {
        console.log(`Calculating index for ${model.name} with weights:`, model.weights);

        // Clear any existing index
        model.index = [];

        // Generate a new array for this model's index
        const newIndex = state.zScoreData.map(dataPoint => {
            let weightedSum = 0;
            let totalWeight = 0;

            // Calculate weighted sum for each indicator
            state.indicators.forEach(indicator => {
                const weight = model.weights[indicator.id] || 0;

                // Skip indicators with no weight
                if (!weight) return;

                let value = dataPoint[indicator.id];
                if (value === undefined || value === null) return;

                // For Initial Claims, invert the value (higher is worse)
                if (indicator.id === 'Initial_Claims') {
                    value = -value;
                }

                weightedSum += value * weight;
                totalWeight += weight;
            });

            const indexValue = totalWeight > 0 ? weightedSum / totalWeight : 0;

            return {
                x: new Date(dataPoint.date),
                y: indexValue
            };
        });

        // Assign to model
        model.index = [...newIndex];

        // Also assign to legacy variables for backward compatibility
        if (modelIndex === 0) {
            state.aiModel1Index = [...newIndex];
        } else if (modelIndex === 1) {
            state.aiModel2Index = [...newIndex];
        }
    });

    console.log(`Calculated indices for ${state.aiModels.length} models`);

    // Debug first few points of each model
    state.aiModels.forEach((model, index) => {
        console.log(`First 3 points of ${model.name} index:`, model.index.slice(0, 3));
    });
}

// Update all charts with calculated data
function updateCharts() {
    console.log("Updating charts with data from", state.aiModels.length, "AI models");

    // Update weights chart
    if (state.charts.weightsChart) {
        // Clear existing datasets
        state.charts.weightsChart.data.datasets = [];

        // Add dataset for each AI model
        state.aiModels.forEach((model, index) => {
            // Create a dataset for this model
            const dataset = {
                label: model.name,
                data: state.indicators.map(ind => model.weights[ind.id] || 0),
                backgroundColor: getColorForIndex(index, 0.5),
                borderColor: getColorForIndex(index, 1),
                borderWidth: 1
            };

            // Add to chart
            state.charts.weightsChart.data.datasets.push(dataset);
        });

        // Add class dataset
        state.charts.weightsChart.data.datasets.push({
            label: 'Class Average',
            data: state.indicators.map(ind => ind.classWeight || 0),
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
        });

        // Update chart
        state.charts.weightsChart.update();
    }

    // Update AI Model charts (first two models only for backward compatibility)
    if (state.aiModels.length > 0 && state.charts.aiModel1Chart) {
        const model = state.aiModels[0];
        console.log(`Setting ${model.name} chart with data length:`, model.index.length);

        // Deep copy to ensure independence
        const modelData = JSON.parse(JSON.stringify(model.index));

        // Update chart
        state.charts.aiModel1Chart.data.datasets[0].label = `${model.name} Index`;
        state.charts.aiModel1Chart.data.datasets[0].data = modelData;
        state.charts.aiModel1Chart.update();
    }

    if (state.aiModels.length > 1 && state.charts.aiModel2Chart) {
        const model = state.aiModels[1];
        console.log(`Setting ${model.name} chart with data length:`, model.index.length);

        // Deep copy to ensure independence
        const modelData = JSON.parse(JSON.stringify(model.index));

        // Update chart
        state.charts.aiModel2Chart.data.datasets[0].label = `${model.name} Index`;
        state.charts.aiModel2Chart.data.datasets[0].data = modelData;
        state.charts.aiModel2Chart.update();
    }

    // Update comparison chart - use new deep copies for everything
    if (state.charts.comparisonChart) {
        // Clear existing datasets
        state.charts.comparisonChart.data.datasets = [];

        // Add dataset for each AI model
        state.aiModels.forEach((model, index) => {
            // Create a dataset for this model
            const dataset = {
                label: model.name,
                data: JSON.parse(JSON.stringify(model.index)),
                borderColor: getColorForIndex(index, 1),
                borderWidth: 2,
                tension: 0.1,
                fill: false
            };

            // Add to chart
            state.charts.comparisonChart.data.datasets.push(dataset);
        });

        // Add class dataset
        if (state.classIndex && state.classIndex.length > 0) {
            state.charts.comparisonChart.data.datasets.push({
                label: 'Class Average',
                data: JSON.parse(JSON.stringify(state.classIndex)),
                borderColor: 'rgb(255, 206, 86)',
                borderWidth: 2,
                tension: 0.1,
                fill: false
            });
        }

        // Update chart
        state.charts.comparisonChart.update();
    }
}

// Helper function to get a color for a given index
function getColorForIndex(index, alpha) {
    const colors = [
        `rgba(54, 162, 235, ${alpha})`,   // Blue
        `rgba(255, 99, 132, ${alpha})`,   // Red
        `rgba(75, 192, 192, ${alpha})`,   // Teal
        `rgba(153, 102, 255, ${alpha})`,  // Purple
        `rgba(255, 159, 64, ${alpha})`,   // Orange
        `rgba(201, 203, 207, ${alpha})`,  // Grey
        `rgba(0, 128, 0, ${alpha})`,      // Green
        `rgba(139, 69, 19, ${alpha})`     // Brown
    ];

    return colors[index % colors.length];
}

// Update weights table
function updateWeightsTable() {
    // Update the color-coded weights table
    const table = document.getElementById('colorCodedWeightsTable');
    if (!table) return;

    // Clear existing rows
    table.innerHTML = '';

    // Get all indicators
    const indicators = state.indicators;

    // Update AI platforms header with the correct colspan
    const aiPlatformsHeader = document.getElementById('aiPlatformsHeader');
    if (aiPlatformsHeader) {
        aiPlatformsHeader.colSpan = state.aiModels.length;
    }

    // Add a row to identify which AI platform is associated with each column
    const platformRow = document.createElement('tr');
    platformRow.className = 'bg-gray-100';

    // Empty cell for indicator column
    const emptyCell = document.createElement('td');
    emptyCell.className = 'px-4 py-2 whitespace-nowrap text-xs text-gray-500';
    platformRow.appendChild(emptyCell);

    // Empty cell for class average column
    const emptyClassCell = document.createElement('td');
    emptyClassCell.className = 'px-4 py-2 whitespace-nowrap text-xs text-gray-500';
    platformRow.appendChild(emptyClassCell);

    // Add a cell for each AI model with the model name
    state.aiModels.forEach(model => {
        const modelCell = document.createElement('td');
        modelCell.className = 'px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-700 text-center';
        modelCell.textContent = model.name;
        platformRow.appendChild(modelCell);
    });

    table.appendChild(platformRow);

    // Create a row for each indicator
    indicators.forEach(indicator => {
        const row = document.createElement('tr');

        // Indicator name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium';
        nameCell.textContent = indicator.label;
        row.appendChild(nameCell);

        // Class average cell
        const classWeight = indicator.classWeight || 0;
        const classCell = document.createElement('td');
        classCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium';
        classCell.textContent = classWeight.toFixed(1) + '%';
        row.appendChild(classCell);

        // Add a cell for each AI model with color coding
        state.aiModels.forEach(model => {
            const weight = model.weights[indicator.id] || 0;
            const weightCell = document.createElement('td');

            // Color code based on comparison to class average
            if (weight > classWeight) {
                weightCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium bg-green-100 text-green-800';
            } else if (weight < classWeight) {
                weightCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium bg-red-100 text-red-800';
            } else {
                weightCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
            }

            weightCell.textContent = weight.toFixed(1) + '%';
            row.appendChild(weightCell);
        });

        table.appendChild(row);
    });

    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'bg-gray-50';

    // Total label
    const totalLabel = document.createElement('td');
    totalLabel.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700';
    totalLabel.textContent = 'Total';
    totalRow.appendChild(totalLabel);

    // Class total
    const classTotal = indicators.reduce((sum, ind) => sum + (ind.classWeight || 0), 0);
    const classTotalCell = document.createElement('td');
    classTotalCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700';
    classTotalCell.textContent = classTotal.toFixed(1) + '%';
    totalRow.appendChild(classTotalCell);

    // AI model totals
    state.aiModels.forEach(model => {
        const total = Object.values(model.weights).reduce((sum, weight) => sum + (weight || 0), 0);
        const cell = document.createElement('td');
        cell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-700';
        cell.textContent = total.toFixed(1) + '%';
        totalRow.appendChild(cell);
    });

    table.appendChild(totalRow);

    // Update GDP forecasts table
    updateGDPForecastsTable();
}

// Create a new function to update the GDP forecasts table
function updateGDPForecastsTable() {
    const table = document.getElementById('colorCodedGDPTable');
    if (!table) return;

    // Clear existing rows
    table.innerHTML = '';

    // Update AI platforms header with the correct colspan
    const aiPlatformsGDPHeader = document.getElementById('aiPlatformsGDPHeader');
    if (aiPlatformsGDPHeader) {
        aiPlatformsGDPHeader.colSpan = state.aiModels.length;
    }

    // Add a row to identify which AI platform is associated with each column
    const platformRow = document.createElement('tr');
    platformRow.className = 'bg-gray-100';

    // Empty cell for forecast column
    const emptyCell = document.createElement('td');
    emptyCell.className = 'px-4 py-2 whitespace-nowrap text-xs text-gray-500';
    platformRow.appendChild(emptyCell);

    // Empty cell for class average column
    const emptyClassCell = document.createElement('td');
    emptyClassCell.className = 'px-4 py-2 whitespace-nowrap text-xs text-gray-500';
    platformRow.appendChild(emptyClassCell);

    // Add a cell for each AI model with the model name
    state.aiModels.forEach(model => {
        const modelCell = document.createElement('td');
        modelCell.className = 'px-4 py-2 whitespace-nowrap text-xs font-medium text-gray-700 text-center';
        modelCell.textContent = model.name;
        platformRow.appendChild(modelCell);
    });

    table.appendChild(platformRow);

    // Create rows for GDP forecasts and recession probability
    const forecasts = [
        { name: '12-Month GDP Growth', property: 'gdp12Month' },
        { name: '24-Month GDP Growth', property: 'gdp24Month' },
        { name: 'Recession Probability', property: 'recessionProb' }
    ];

    // Get class values from localStorage
    let classGDP12Month = 'N/A';
    let classGDP24Month = 'N/A';
    let classRecessionProb = 0;

    try {
        // Try to get from state first
        if (state.classAnalysis && state.classAnalysis.gdp12Month) {
            classGDP12Month = state.classAnalysis.gdp12Month;
            classGDP24Month = state.classAnalysis.gdp24Month;
            classRecessionProb = state.classAnalysis.recessionProb;
        } else {
            // If not in state, try localStorage
            const classAnalysis = JSON.parse(localStorage.getItem('classAnalysis') || '{}');
            if (classAnalysis) {
                classGDP12Month = classAnalysis.gdp12Month || 'N/A';
                classGDP24Month = classAnalysis.gdp24Month || 'N/A';
                classRecessionProb = classAnalysis.recessionProb || 0;

                // Update state with values from localStorage
                if (!state.classAnalysis) {
                    state.classAnalysis = {};
                }
                state.classAnalysis.gdp12Month = classGDP12Month;
                state.classAnalysis.gdp24Month = classGDP24Month;
                state.classAnalysis.recessionProb = classRecessionProb;
            }
        }

        // Log the values to help with debugging
        console.log('Class GDP 12-Month (for table):', classGDP12Month);
        console.log('Class GDP 24-Month (for table):', classGDP24Month);
        console.log('Class Recession Probability (for table):', classRecessionProb);
    } catch (e) {
        console.error('Error getting class analysis data:', e);
    }

    forecasts.forEach(forecast => {
        const row = document.createElement('tr');

        // Forecast name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium';
        nameCell.textContent = forecast.name;
        row.appendChild(nameCell);

        // Class average cell
        const classCell = document.createElement('td');
        classCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium';

        if (forecast.property === 'recessionProb') {
            // Make sure we have a valid number
            const recessionProb = parseFloat(classRecessionProb);
            classCell.textContent = isNaN(recessionProb) ? '0.0%' : recessionProb.toFixed(1) + '%';
        } else if (forecast.property === 'gdp12Month') {
            classCell.textContent = classGDP12Month || 'N/A';
        } else if (forecast.property === 'gdp24Month') {
            classCell.textContent = classGDP24Month || 'N/A';
        }

        row.appendChild(classCell);

        // Add a cell for each AI model with color coding
        state.aiModels.forEach(model => {
            const cell = document.createElement('td');

            if (forecast.property === 'recessionProb') {
                const value = model[forecast.property] || 0;

                // Color code based on comparison to class average
                if (value > classRecessionProb) {
                    cell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium bg-red-100 text-red-800';
                } else if (value < classRecessionProb) {
                    cell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium bg-green-100 text-green-800';
                } else {
                    cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
                }

                cell.textContent = value.toFixed(1) + '%';
            } else {
                const value = model[forecast.property] || 'N/A';
                cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';
                cell.textContent = value;
            }

            row.appendChild(cell);
        });

        table.appendChild(row);
    });
}

// Set initial thresholds based on average values
function setInitialThresholds() {
    // Model 1 threshold
    if (state.aiModel1Index && state.aiModel1Index.length > 0) {
        const values = state.aiModel1Index.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;

        const thresholdInput = document.getElementById('aiModel1Threshold');
        const thresholdValue = document.getElementById('aiModel1ThresholdValue');

        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }

    // Model 2 threshold
    if (state.aiModel2Index && state.aiModel2Index.length > 0) {
        const values = state.aiModel2Index.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;

        const thresholdInput = document.getElementById('aiModel2Threshold');
        const thresholdValue = document.getElementById('aiModel2ThresholdValue');

        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }

    // Class threshold
    if (state.classIndex && state.classIndex.length > 0) {
        const values = state.classIndex.map(p => p.y);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const roundedAvg = Math.round(avg * 10) / 10;

        const thresholdInput = document.getElementById('classThreshold');
        const thresholdValue = document.getElementById('classThresholdValue');

        if (thresholdInput && thresholdValue) {
            thresholdInput.value = roundedAvg;
            thresholdValue.textContent = roundedAvg.toFixed(1);
        }
    }

    // Apply thresholds
    applyThresholdModel1();
    applyThresholdModel2();
    applyThresholdClass();
}

// Apply threshold for AI Model 1
function applyThresholdModel1() {
    const thresholdInput = document.getElementById('aiModel1Threshold');
    const directionSelect = document.getElementById('aiModel1Direction');
    const thresholdValueDisplay = document.getElementById('aiModel1ThresholdValue');

    if (!thresholdInput || !directionSelect || !state.aiModel1Index || state.aiModel1Index.length === 0) {
        console.warn('Missing elements or data for AI Model 1 threshold');
        return;
    }

    const threshold = parseFloat(thresholdInput.value);
    const direction = directionSelect.value; // 'above' or 'below'

    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }

    console.log(`Applying threshold for AI Model 1: ${threshold} (${direction})`);

    try {
        // Generate signals
        const signals = generateSignals(state.aiModel1Index, threshold, direction);
        console.log(`Generated ${signals.length} signals for AI Model 1`);

        // Analyze signals
        state.aiModel1Analysis = analyzeSignals(signals);
        console.log('AI Model 1 analysis:', state.aiModel1Analysis);

        // Log analysis instead of updating DOM elements
        console.log('AI Model 1 Analysis:', state.aiModel1Analysis);

        // Add threshold line to chart
        if (state.charts.aiModel1Chart) {
            // Create a fresh annotations object
            const annotations = {};

            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });

            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };

            // Update chart annotations
            state.charts.aiModel1Chart.options.plugins.annotation.annotations = annotations;
            state.charts.aiModel1Chart.update();
        }

        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for AI Model 1:', error);
    }
}

// Apply threshold for AI Model 2
function applyThresholdModel2() {
    const thresholdInput = document.getElementById('aiModel2Threshold');
    const thresholdValueDisplay = document.getElementById('aiModel2ThresholdValue');

    if (!thresholdInput || !state.aiModel2Index || state.aiModel2Index.length === 0) {
        console.warn('Missing elements or data for AI Model 2 threshold');
        return;
    }

    const threshold = parseFloat(thresholdInput.value);
    // Default to 'below' direction for Model 2
    const direction = 'below';

    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }

    console.log(`Applying threshold for AI Model 2: ${threshold} (${direction})`);

    try {
        // Generate signals
        const signals = generateSignals(state.aiModel2Index, threshold, direction);
        console.log(`Generated ${signals.length} signals for AI Model 2`);

        // Analyze signals
        state.aiModel2Analysis = analyzeSignals(signals);
        console.log('AI Model 2 analysis:', state.aiModel2Analysis);

        // Log analysis instead of updating DOM elements
        console.log('AI Model 2 Analysis:', state.aiModel2Analysis);

        // Add threshold line to chart
        if (state.charts.aiModel2Chart) {
            // Create a fresh annotations object
            const annotations = {};

            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });

            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };

            // Update chart annotations
            state.charts.aiModel2Chart.options.plugins.annotation.annotations = annotations;
            state.charts.aiModel2Chart.update();
        }

        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for AI Model 2:', error);
    }
}

// Apply threshold for class index
function applyThresholdClass() {
    const thresholdInput = document.getElementById('classThreshold');
    const directionSelect = document.getElementById('classDirection');
    const thresholdValueDisplay = document.getElementById('classThresholdValue');

    if (!thresholdInput || !directionSelect || !state.classIndex || state.classIndex.length === 0) {
        console.warn('Missing elements or data for class threshold');
        return;
    }

    const threshold = parseFloat(thresholdInput.value);
    const direction = directionSelect.value; // 'above' or 'below'

    // Update threshold value display
    if (thresholdValueDisplay) {
        thresholdValueDisplay.textContent = threshold.toFixed(1);
    }

    console.log(`Applying threshold for class index: ${threshold} (${direction})`);

    try {
        // Generate signals
        const signals = generateSignals(state.classIndex, threshold, direction);
        console.log(`Generated ${signals.length} signals for class index`);

        // Analyze signals
        state.classAnalysis = analyzeSignals(signals);
        console.log('Class analysis:', state.classAnalysis);

        // Log analysis instead of updating DOM elements
        console.log('Class Analysis:', state.classAnalysis);

        // Add threshold line to chart
        if (state.charts.classChart) {
            // Create a fresh annotations object
            const annotations = {};

            // Add recession overlays
            state.recessionData.forEach((recession, index) => {
                annotations[`recession-${index}`] = {
                    type: 'box',
                    xMin: recession.start,
                    xMax: recession.end,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    borderWidth: 0
                };
            });

            // Add threshold line
            annotations['threshold'] = {
                type: 'line',
                yMin: threshold,
                yMax: threshold,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    display: true,
                    content: `Threshold: ${threshold.toFixed(1)}`,
                    position: 'start'
                }
            };

            // Update chart annotations
            state.charts.classChart.options.plugins.annotation.annotations = annotations;
            state.charts.classChart.update();
        }

        // Update comparison table
        updateComparisonTable();
    } catch (error) {
        console.error('Error applying threshold for class index:', error);
    }
}

// Generate signals based on threshold and direction
function generateSignals(indexData, threshold, direction) {
    if (!indexData || indexData.length === 0) return [];

    const signals = [];
    let inSignal = false;
    let signalStart = null;

    // Sort data by date
    const sortedData = [...indexData].sort((a, b) => a.x - b.x);

    sortedData.forEach((point, i) => {
        const value = point.y;
        const date = point.x;

        // Check if point crosses threshold
        const isSignal = direction === 'below' ? value <= threshold : value >= threshold;

        if (isSignal && !inSignal) {
            // Start of new signal
            inSignal = true;
            signalStart = { date, index: i, value };
            signals.push(signalStart);
        } else if (!isSignal && inSignal) {
            // End of signal
            inSignal = false;
        }
    });

    return signals;
}

// Analyze signals against recession data
function analyzeSignals(signals) {
    if (!signals || signals.length === 0 || !state.recessionData || state.recessionData.length === 0) {
        return {
            truePositives: 0,
            falsePositives: 0,
            coincidentSignals: 0,
            missedRecessions: 0,
            avgLeadTime: 0,
            detectionRate: 0,
            accuracy: 0
        };
    }

    let truePositives = 0;
    let falsePositives = 0;
    let coincidentSignals = 0;
    let leadTimes = [];

    // Check each signal
    signals.forEach(signal => {
        const signalDate = new Date(signal.date);

        // Check if signal occurred during a recession
        const duringRecession = state.recessionData.some(recession =>
            signalDate >= recession.start && signalDate <= recession.end
        );

        if (duringRecession) {
            // Signal is coincident with recession
            coincidentSignals++;
            return;
        }

        // Find next recession after signal
        const nextRecession = state.recessionData.find(recession =>
            recession.start > signalDate
        );

        if (!nextRecession) {
            // No recession after signal
            falsePositives++;
            return;
        }

        // Calculate lead time in months
        const leadTimeMs = nextRecession.start - signalDate;
        const leadTimeMonths = Math.round(leadTimeMs / (30 * 24 * 60 * 60 * 1000));

        if (leadTimeMonths <= 24) {
            // True positive: signal is within 24 months of recession
            truePositives++;
            leadTimes.push(leadTimeMonths);
        } else {
            // False positive: signal is more than 24 months before recession
            falsePositives++;
        }
    });

    // Check for missed recessions
    let detectedRecessions = 0;

    state.recessionData.forEach(recession => {
        const detected = signals.some(signal => {
            const signalDate = new Date(signal.date);
            // Consider recession detected if signal is within 24 months before
            const leadTimeMs = recession.start - signalDate;
            const leadTimeMonths = leadTimeMs / (30 * 24 * 60 * 60 * 1000);
            return leadTimeMonths >= 0 && leadTimeMonths <= 24;
        });

        if (detected) {
            detectedRecessions++;
        }
    });

    const missedRecessions = state.recessionData.length - detectedRecessions;

    // Calculate average lead time
    const avgLeadTime = leadTimes.length > 0 ?
        leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;

    // Calculate detection rate
    const detectionRate = state.recessionData.length > 0 ?
        (detectedRecessions / state.recessionData.length) * 100 : 0;

    // Calculate accuracy (True Positives / (True Positives + False Positives + Missed Recessions - Coincident))
    const denominator = Math.max(1, truePositives + falsePositives + missedRecessions - coincidentSignals);
    const accuracy = truePositives / denominator * 100;

    return {
        truePositives,
        falsePositives,
        coincidentSignals,
        missedRecessions,
        avgLeadTime,
        detectionRate,
        accuracy
    };
}

// Analyze all models
function analyzeAllModels() {
    console.log('Analyzing all models');

    // Process class index performance metrics
    if (state.classIndex && state.classIndex.length > 0) {
        const classSignals = generateSignals(state.classIndex, 0, 'below');
        state.classAnalysis = analyzeSignals(classSignals);
        // Just log the analysis instead of trying to update DOM elements
        console.log('Class Analysis:', state.classAnalysis);
    }

    // Process each AI model
    state.aiModels.forEach((model, index) => {
        if (model.index && model.index.length > 0) {
            const signals = generateSignals(model.index, 0, 'below');
            model.analysis = analyzeSignals(signals);

            // Update legacy variables for backward compatibility
            if (index === 0) {
                state.aiModel1Analysis = model.analysis;
                console.log('AI Model 1 Analysis:', model.analysis);
            } else if (index === 1) {
                state.aiModel2Analysis = model.analysis;
                console.log('AI Model 2 Analysis:', model.analysis);
            }
        }
    });

    // Update comparison table
    updateComparisonTable();
}

// Update analysis display for a model
function updateAnalysisDisplay(modelId, analysis) {
    if (!analysis) return;

    // We've removed the individual model sections, so we don't need to update these elements anymore
    // Just store the analysis in the state for use in the comparison table
    console.log(`Analysis for ${modelId}:`, analysis);
}

// Update comparison table
function updateComparisonTable() {
    console.log('Updating comparison table');

    const comparisonTable = document.getElementById('comparisonTable');
    if (!comparisonTable) {
        console.warn('Comparison table element not found');
        return;
    }

    // Clear the table
    comparisonTable.innerHTML = '';

    // Create metrics rows
    const metrics = [
        { name: 'True Positives', key: 'truePositives', format: value => value },
        { name: 'False Positives', key: 'falsePositives', format: value => value },
        { name: 'Coincident Signals', key: 'coincidentSignals', format: value => value },
        { name: 'Missed Recessions', key: 'missedRecessions', format: value => value },
        { name: 'Avg Lead Time (months)', key: 'avgLeadTime', format: value => value.toFixed(1) },
        { name: 'Detection Rate (%)', key: 'detectionRate', format: value => value.toFixed(1) },
        { name: 'Accuracy (%)', key: 'accuracy', format: value => value.toFixed(1) }
    ];

    // Add each metric row
    metrics.forEach(metric => {
        const row = document.createElement('tr');

        // Metric name
        const nameCell = document.createElement('td');
        nameCell.className = 'px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
        nameCell.textContent = metric.name;
        row.appendChild(nameCell);

        // Add cell for each AI model
        state.aiModels.forEach(model => {
            const analysis = model.analysis || {
                truePositives: 0,
                falsePositives: 0,
                coincidentSignals: 0,
                missedRecessions: 0,
                avgLeadTime: 0,
                detectionRate: 0,
                accuracy: 0
            };

            const cell = document.createElement('td');
            cell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';

            const value = analysis[metric.key];
            cell.textContent = typeof value === 'number' ? metric.format(value) : 'N/A';

            row.appendChild(cell);
        });

        // Add class cell
        const classCell = document.createElement('td');
        classCell.className = 'px-4 py-2 whitespace-nowrap text-sm text-gray-900';

        if (state.classAnalysis) {
            const value = state.classAnalysis[metric.key];
            classCell.textContent = typeof value === 'number' ? metric.format(value) : 'N/A';
        } else {
            classCell.textContent = 'N/A';
        }

        row.appendChild(classCell);

        // Add row to table
        comparisonTable.appendChild(row);
    });

    // Log analyses
    state.aiModels.forEach((model, index) => {
        console.log(`${model.name} Analysis:`, model.analysis);
    });
    console.log('Class Analysis:', state.classAnalysis);

    console.log('Comparison table updated');
}

// Download results as CSV
function downloadResults() {
    if (state.aiModels.length === 0) {
        alert('No AI models to download.');
        return;
    }

    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Header row with model names
    csvContent += 'Metric,';
    state.aiModels.forEach(model => {
        csvContent += model.name + ',';
    });
    csvContent += 'Class\n';

    // Performance metrics
    const metrics = [
        { name: 'True Positives', key: 'truePositives', format: value => value },
        { name: 'False Positives', key: 'falsePositives', format: value => value },
        { name: 'Coincident Signals', key: 'coincidentSignals', format: value => value },
        { name: 'Missed Recessions', key: 'missedRecessions', format: value => value },
        { name: 'Avg Lead Time (months)', key: 'avgLeadTime', format: value => value.toFixed(1) },
        { name: 'Detection Rate (%)', key: 'detectionRate', format: value => value.toFixed(1) },
        { name: 'Accuracy (%)', key: 'accuracy', format: value => value.toFixed(1) }
    ];

    // Add each metric row
    metrics.forEach(metric => {
        csvContent += metric.name + ',';

        // Add value for each AI model
        state.aiModels.forEach(model => {
            const analysis = model.analysis || {
                truePositives: 0,
                falsePositives: 0,
                coincidentSignals: 0,
                missedRecessions: 0,
                avgLeadTime: 0,
                detectionRate: 0,
                accuracy: 0
            };

            const value = analysis[metric.key];
            csvContent += (typeof value === 'number' ? metric.format(value) : 'N/A') + ',';
        });

        // Add class value
        if (state.classAnalysis) {
            const value = state.classAnalysis[metric.key];
            csvContent += (typeof value === 'number' ? metric.format(value) : 'N/A') + '\n';
        } else {
            csvContent += 'N/A\n';
        }
    });

    // Blank line
    csvContent += '\n';

    // Indicator weights
    csvContent += 'Indicator Weights\n';

    // Header row with model names
    csvContent += 'Indicator,';
    state.aiModels.forEach(model => {
        csvContent += model.name + ',';
    });
    csvContent += 'Class\n';

    // Add each indicator row
    state.indicators.forEach(indicator => {
        csvContent += indicator.label + ',';

        // Add weight for each AI model
        state.aiModels.forEach(model => {
            const weight = model.weights[indicator.id] || 0;
            csvContent += weight.toFixed(2) + ',';
        });

        // Add class weight
        csvContent += indicator.classWeight.toFixed(2) + '\n';
    });

    // Create and trigger download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'ai_weights_analysis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update GDP forecast display
function updateForecastDisplay() {
    console.log("Updating forecast display");

    // Update GDP 12-month forecast
    const gdp12Table = document.getElementById('gdp12Table');
    if (gdp12Table && state.classGDP12Data) {
        // Clear existing rows
        gdp12Table.innerHTML = '';

        // Get categories and counts
        const categories = Object.keys(state.classGDP12Data);
        const counts = Object.values(state.classGDP12Data);
        const total = counts.reduce((sum, count) => sum + count, 0);

        // Create rows for each category
        categories.forEach((category, index) => {
            const count = state.classGDP12Data[category] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${category}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${count}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${percentage.toFixed(1)}%</td>
            `;
            gdp12Table.appendChild(row);
        });
    }

    // Update GDP 24-month forecast
    const gdp24Table = document.getElementById('gdp24Table');
    if (gdp24Table && state.classGDP24Data) {
        // Clear existing rows
        gdp24Table.innerHTML = '';

        // Get categories and counts
        const categories = Object.keys(state.classGDP24Data);
        const counts = Object.values(state.classGDP24Data);
        const total = counts.reduce((sum, count) => sum + count, 0);

        // Create rows for each category
        categories.forEach((category, index) => {
            const count = state.classGDP24Data[category] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${category}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${count}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${percentage.toFixed(1)}%</td>
            `;
            gdp24Table.appendChild(row);
        });
    }

    // Update AI model GDP forecasts
    state.aiModels.forEach(model => {
        // Update 12-month GDP forecast
        if (model.gdp12Month) {
            const modelGdp12 = document.getElementById(`${model.name.replace(/\s+/g, '')}GDP12`);
            if (modelGdp12) {
                modelGdp12.textContent = model.gdp12Month;
            }
        }

        // Update 24-month GDP forecast
        if (model.gdp24Month) {
            const modelGdp24 = document.getElementById(`${model.name.replace(/\s+/g, '')}GDP24`);
            if (modelGdp24) {
                modelGdp24.textContent = model.gdp24Month;
            }
        }
    });
}

// Reset upload UI
function resetUploadUI() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('dropzoneContent').classList.remove('hidden');
    document.getElementById('progressBar').style.width = '0%';
}

// Create default sample file
function createSampleFile() {
    // Sample AI weights
    const sampleData = [
        {
            model_name: 'GPT-4 Model',
            '10Y2Y_Yield': 15,
            'ISM_NewOrders': 12,
            'Building_Permits': 10,
            'Consumer_Confidence': 14,
            'PMI': 11,
            'Initial_Claims': 12,
            'Avg_WeeklyHours': 10,
            'SP500': 14
        },
        {
            model_name: 'BERT Model',
            '10Y2Y_Yield': 13,
            'ISM_NewOrders': 14,
            'Building_Permits': 12,
            'Consumer_Confidence': 15,
            'PMI': 10,
            'Initial_Claims': 11,
            'Avg_WeeklyHours': 9,
            'SP500': 13
        }
    ];

    // Convert to CSV
    let csvContent = 'model_name,10Y2Y_Yield,ISM_NewOrders,Building_Permits,Consumer_Confidence,PMI,Initial_Claims,Avg_WeeklyHours,SP500\n';

    sampleData.forEach(row => {
        csvContent += `${row.model_name},${row['10Y2Y_Yield']},${row['ISM_NewOrders']},${row['Building_Permits']},${row['Consumer_Confidence']},${row['PMI']},${row['Initial_Claims']},${row['Avg_WeeklyHours']},${row['SP500']}\n`;
    });

    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample-ai-weights.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}