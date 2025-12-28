// dashboard.js
// Handles the dashboard-specific functionality

// Global variables
let info;
let rawExcelData = null;
let processedMapData = null;
let columnMapping = {
    state: '',
    value: ''
};
let rawAIExcelData = null;
let aiData = null;
let aiColumnMapping = {
    state: '',
    value: ''
};
let currentView = 'student'; // 'student', 'ai', or 'comparison'

// Color scale for the map
const colorScale = d3.scaleThreshold()
    .domain([15, 25, 35, 45, 55, 65, 75, 85]) // Score ranges
    .range([
        "#1E3F66", // Dark Blue for 0-15
        "#2B6EBF", // Medium Blue for 15-25
        "#85C1E9", // Light Blue for 25-35
        "#ABEBC6", // Light Green for 35-45
        "#239B56", // Dark Green for 45-55
        "#F7DC6F", // Yellow for 55-65
        "#F39C12", // Orange for 65-75
        "#E74C3C", // Red for 75-85
        "#8B0000"  // Dark Red for above
    ]);

// Function to get color based on value
function getColor(value) {
    return value === undefined ? '#cccccc' : colorScale(value);
}

// Show status message
function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = 'mt-4 p-3 rounded-md';

    if (type === 'error') {
        statusEl.classList.add('bg-red-50', 'text-red-700');
    } else if (type === 'success') {
        statusEl.classList.add('bg-green-50', 'text-green-700');
    } else {
        statusEl.classList.add('bg-blue-50', 'text-blue-700');
    }

    statusEl.classList.remove('hidden');
}

// Show status for AI upload
function showAIStatus(message, type = 'info') {
    const statusEl = document.getElementById('aiStatus');
    statusEl.textContent = message;
    statusEl.className = 'mt-4 p-3 rounded-md';

    if (type === 'error') {
        statusEl.classList.add('bg-red-50', 'text-red-700');
    } else if (type === 'success') {
        statusEl.classList.add('bg-green-50', 'text-green-700');
    } else {
        statusEl.classList.add('bg-blue-50', 'text-blue-700');
    }

    statusEl.classList.remove('hidden');
}

// Parse Excel file
function parseExcel(data) {
    try {
        // Read the Excel file
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];

        // Convert to JSON
        return XLSX.utils.sheet_to_json(worksheet);
    } catch (error) {
        console.error("Error parsing Excel file:", error);
        return null;
    }
}

// Show Excel preview and column selection
function showColumnSelection(data) {
    if (!data || data.length === 0) {
        showStatus('No data found in the Excel file.', 'error');
        return;
    }

    // Get the column mapping section and AI data container
    const columnMappingSection = document.getElementById('columnMappingSection');
    const aiDataContainer = document.getElementById('aiDataContainer');

    // Move the column mapping section after the AI data container
    if (aiDataContainer && columnMappingSection) {
        aiDataContainer.parentNode.insertBefore(columnMappingSection, aiDataContainer.nextSibling);
    }

    // Show the column mapping section
    columnMappingSection.classList.remove('hidden');

    // Get all column names
    const columns = Object.keys(data[0]);

    // Populate the select elements
    const stateSelect = document.getElementById('stateColumn');
    const valueSelect = document.getElementById('valueColumn');

    // Clear existing options
    stateSelect.innerHTML = '<option value="">Select column...</option>';
    valueSelect.innerHTML = '<option value="">Select column...</option>';

    // Add options for each column
    columns.forEach(column => {
        stateSelect.innerHTML += `<option value="${column}">${column}</option>`;
        valueSelect.innerHTML += `<option value="${column}">${column}</option>`;
    });

    // Try to auto-select columns based on name
    const stateColumns = ['State', 'state', 'STATE', 'StateName', 'state_name'];
    const valueColumns = ['Value', 'value', 'StudentValue', 'Score', 'Total', 'Final'];

    // Auto-select state column if found
    for (const col of stateColumns) {
        if (columns.includes(col)) {
            stateSelect.value = col;
            break;
        }
    }

    // Auto-select value column if found
    for (const col of valueColumns) {
        if (columns.includes(col)) {
            valueSelect.value = col;
            break;
        }
    }

    // Check if Excel preview table exists before trying to update it
    const previewTable = document.getElementById('excelPreview');
    if (!previewTable) {
        console.error('Excel preview table element not found');
        return;
    }

    // Generate Excel preview
    let previewHTML = '<thead><tr>';

    // Add headers
    columns.forEach(column => {
        previewHTML += `<th>${column}</th>`;
    });

    previewHTML += '</tr></thead><tbody>';

    // Add rows (limit to first 5)
    const previewRows = Math.min(data.length, 5);
    for (let i = 0; i < previewRows; i++) {
        previewHTML += '<tr>';
        columns.forEach(column => {
            previewHTML += `<td>${data[i][column] !== undefined ? data[i][column] : ''}</td>`;
        });
        previewHTML += '</tr>';
    }

    previewHTML += '</tbody>';
    previewTable.innerHTML = previewHTML;
}

// Process data using the selected columns
function processData() {
    if (!rawExcelData || !columnMapping.state || !columnMapping.value) {
        showStatus('Please select both state and value columns.', 'error');
        return;
    }

    // Create processed data with standardized format
    processedMapData = {};
    rawExcelData.forEach(row => {
        const stateValue = row[columnMapping.state];
        const numericValue = row[columnMapping.value];

        let parsedValue = null;
        if (numericValue !== undefined && numericValue !== null) {
            parsedValue = parseFloat(numericValue);
            if (isNaN(parsedValue)) parsedValue = null;
        }

        if (stateValue && parsedValue !== null) {
            processedMapData[normalizeStateName(stateValue)] = parsedValue;
        }
    });

    showStatus(`Processed ${Object.keys(processedMapData).length} states with valid data.`, 'success');

    // If student data was processed successfully, enable AI upload
    if (Object.keys(processedMapData).length > 0) {
        document.getElementById('aiFileUpload').disabled = false;
        showStatus('Student data processed. You can now upload AI assessment data.', 'success');
    }

    // Update the map based on current view
    if (currentView === 'student') {
        mapLoader.updateMap(processedMapData, 'student');
        updateSummaryStats(processedMapData);
        updateLegend();
    } else if (currentView === 'comparison' && aiData) {
        const comparisonData = {};
        Object.keys(processedMapData).forEach(state => {
            comparisonData[state] = {
                studentValue: processedMapData[state],
                aiValue: aiData[state],
                difference: aiData[state] ? processedMapData[state] - aiData[state] : null
            };
        });
        mapLoader.updateComparisonMap(comparisonData);
        updateComparisonStats();
        updateComparisonLegend();
    }
}

// Process AI data similar to student data
function processAIData() {
    if (!rawAIExcelData || !aiColumnMapping.state || !aiColumnMapping.value) {
        showAIStatus('Please select both state and value columns for AI data.', 'error');
        return;
    }

    // Create processed data with standardized format
    aiData = {};
    rawAIExcelData.forEach(row => {
        const stateValue = row[aiColumnMapping.state];
        const numericValue = row[aiColumnMapping.value];

        let parsedValue = null;
        if (numericValue !== undefined && numericValue !== null) {
            parsedValue = parseFloat(numericValue);
            if (isNaN(parsedValue)) parsedValue = null;
        }

        if (stateValue && parsedValue !== null) {
            aiData[normalizeStateName(stateValue)] = parsedValue;
        }
    });

    showAIStatus(`Processed ${Object.keys(aiData).length} states with valid AI assessment data.`, 'success');

    // Enable comparison view if student data is also available
    if (Object.keys(processedMapData).length > 0) {
        document.getElementById('comparisonViewBtn').disabled = false;
    }

    // Update the map based on current view
    if (currentView === 'ai') {
        mapLoader.updateMap(aiData, 'ai');
        updateSummaryStats(aiData);
        updateLegend();
    } else if (currentView === 'comparison') {
        const comparisonData = {};
        Object.keys(processedMapData).forEach(state => {
            comparisonData[state] = {
                studentValue: processedMapData[state],
                aiValue: aiData[state],
                difference: aiData[state] ? processedMapData[state] - aiData[state] : null
            };
        });
        mapLoader.updateComparisonMap(comparisonData);
        updateComparisonStats();
        updateComparisonLegend();
    }

    // Switch to AI view to show the results
    setActiveView('ai');
}

// Update map with data
function updateMap() {
    // Determine which dataset to use based on current view
    if (currentView === 'student' && processedMapData) {
        mapLoader.updateMap(processedMapData, 'student');
        updateSummaryStats(processedMapData);
        updateLegend();
    } else if (currentView === 'ai' && aiData) {
        mapLoader.updateMap(aiData, 'ai');
        updateSummaryStats(aiData);
        updateLegend();
    } else if (currentView === 'comparison' && processedMapData && aiData) {
        const comparisonData = {};
        Object.keys(processedMapData).forEach(state => {
            comparisonData[state] = {
                studentValue: processedMapData[state],
                aiValue: aiData[state],
                difference: aiData[state] ? processedMapData[state] - aiData[state] : null
            };
        });
        mapLoader.updateComparisonMap(comparisonData);
        updateComparisonStats();
        updateComparisonLegend();
    }
}

// Normalize state name for better matching
function normalizeStateName(name) {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Update the regular legend
function updateLegend() {
    // If in comparison view, use the comparison legend
    if (currentView === 'comparison') {
        updateComparisonLegend();
        return;
    }

    const legendDiv = document.getElementById('legend');
    let html = '<div class="p-2">';
    html += `<h4 class="font-bold mb-2">${currentView === 'student' ? 'Student' : 'AI'} Assessment</h4>`;

    const grades = [0, 15, 25, 35, 45, 55, 65, 75, 85];
    const labels = [
        'Strong Buyer\'s (0-15)',
        'Buyer\'s (15-25)',
        'Slight Buyer\'s (25-35)',
        'Balanced (35-45)',
        'Slight Seller\'s (45-55)',
        'Seller\'s (55-65)',
        'Strong Seller\'s (65-75)',
        'Extreme Seller\'s (75-85)',
        'No Data'
    ];

    for (let i = 0; i < grades.length; i++) {
        html += '<div class="legend-item">' +
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            '<span>' + (labels[i] ? labels[i] : '+') + '</span>' +
            '</div>';
    }

    html += '</div>';
    legendDiv.innerHTML = html;
}

// Update the comparison legend
function updateComparisonLegend() {
    const legendDiv = document.getElementById('legend');
    let html = '<div class="p-2">';
    html += '<h4 class="font-bold mb-2">Assessment Comparison</h4>';

    const labels = [
        'Student Much Higher (>15)',
        'Student Higher (10-15)',
        'Student Slightly Higher (5-10)',
        'Similar Values (±5)',
        'AI Slightly Higher (5-10)',
        'AI Higher (10-15)',
        'AI Much Higher (>15)',
        'No Data'
    ];

    const colors = [
        '#1E3F66', // Strong blue - student much higher
        '#3498DB', // Medium blue - student moderately higher
        '#85C1E9', // Light blue - student slightly higher
        '#ABEBC6', // Green - similar values
        '#F5B041', // Light orange - AI slightly higher
        '#E67E22', // Medium orange - AI moderately higher
        '#C0392B', // Red - AI much higher
        '#cccccc'  // Gray - no data
    ];

    for (let i = 0; i < colors.length; i++) {
        html += '<div class="legend-item">' +
            '<i style="background:' + colors[i] + '"></i> ' +
            '<span>' + (labels[i] ? labels[i] : '+') + '</span>' +
            '</div>';
    }

    html += '</div>';
    legendDiv.innerHTML = html;
}

// Function to set active view
function setActiveView(view) {
    // Update current view
    currentView = view;

    // Update button styles
    const buttons = {
        student: document.getElementById('studentViewBtn'),
        ai: document.getElementById('aiViewBtn'),
        comparison: document.getElementById('comparisonViewBtn')
    };

    // Reset all buttons
    Object.values(buttons).forEach(btn => {
        btn.className = 'px-4 py-2 rounded focus:ring-2 focus:ring-opacity-50';
    });

    // Active button style
    buttons.student.className = 'px-4 py-2 rounded focus:ring-2 focus:ring-opacity-50 ' +
        (view === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');

    buttons.ai.className = 'px-4 py-2 rounded focus:ring-2 focus:ring-opacity-50 ' +
        (view === 'ai' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');

    buttons.comparison.className = 'px-4 py-2 rounded focus:ring-2 focus:ring-opacity-50 ' +
        (view === 'comparison' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700');

    // Update the map
    updateMap();
}

// Initialize the dashboard
async function initDashboard() {
    try {
        // Initialize the map using mapLoader
        await mapLoader.initializeMap();

        // Add info control
        info = L.control();
        info.onAdd = function() {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function(props) {
            if (!props) {
                this._div.innerHTML = '<h4>Housing Market Assessment</h4>Hover over a state';
                return;
            }

            // Different display based on view type
            if (props.viewType === 'comparison') {
                this._div.innerHTML = `
                    <h4>Assessment Comparison</h4>
                    <b>${props.name}</b><br>
                    Student: ${props.studentValue !== null ? props.studentValue.toFixed(1) : 'No data'}<br>
                    AI: ${props.aiValue !== null ? props.aiValue.toFixed(1) : 'No data'}<br>
                    Difference: ${props.difference !== null ? props.difference.toFixed(1) : 'N/A'}
                `;
            } else {
                this._div.innerHTML = `
                    <h4>${props.viewType === 'student' ? 'Student' : 'AI'} Assessment</h4>
                    <b>${props.name}</b><br>
                    Value: ${props.value !== undefined ? props.value.toFixed(1) : 'No data'}
                `;
            }
        };

        info.addTo(mapLoader.getMap());

        // Initialize the legend with student view
        updateLegend();

        // Add event listeners for file uploads
        document.getElementById('fileUpload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            showStatus('Loading data...');

            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);

                // Parse the Excel file
                const parsedData = parseExcel(data);

                if (parsedData && parsedData.length > 0) {
                    rawExcelData = parsedData;
                    showStatus(`Excel file loaded successfully: ${parsedData.length} rows found.`, 'success');
                    showColumnSelection(parsedData);
                } else {
                    showStatus('Error parsing the Excel file or no data found.', 'error');
                }
            };

            reader.onerror = function() {
                showStatus('Error reading the file.', 'error');
            };

            reader.readAsArrayBuffer(file);
        });

        // Add event listener for AI file upload
        document.getElementById('aiFileUpload').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            showAIStatus('Loading AI data...');

            const reader = new FileReader();
            reader.onload = function(event) {
                const data = new Uint8Array(event.target.result);

                // Parse the Excel file
                const parsedData = parseExcel(data);

                if (parsedData && parsedData.length > 0) {
                    rawAIExcelData = parsedData;
                    showAIStatus(`AI Excel file loaded successfully: ${parsedData.length} rows found.`, 'success');

                    // Since AI data is likely to have the same column structure as student data,
                    // we can use the same column mapping
                    aiColumnMapping = {...columnMapping};

                    // Process AI data immediately
                    processAIData();

                    // Enable AI view button
                    document.getElementById('aiViewBtn').disabled = false;

                    // Switch to AI view
                    setActiveView('ai');
                } else {
                    showAIStatus('Error parsing the AI Excel file or no data found.', 'error');
                }
            };

            reader.onerror = function() {
                showAIStatus('Error reading the AI file.', 'error');
            };

            reader.readAsArrayBuffer(file);
        });

        // Add event listener for apply mapping button
        document.getElementById('applyMapping').addEventListener('click', function() {
            columnMapping.state = document.getElementById('stateColumn').value;
            columnMapping.value = document.getElementById('valueColumn').value;

            if (!columnMapping.state || !columnMapping.value) {
                showStatus('Please select both state and value columns.', 'error');
                return;
            }

            processData();
        });

        // Add event listeners for view buttons
        document.getElementById('studentViewBtn').addEventListener('click', function() {
            setActiveView('student');
        });

        document.getElementById('aiViewBtn').addEventListener('click', function() {
            setActiveView('ai');
        });

        document.getElementById('comparisonViewBtn').addEventListener('click', function() {
            setActiveView('comparison');
        });

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showStatus('Error: Failed to initialize the dashboard.', 'error');
    }
}

// Update summary statistics
function updateSummaryStats(data) {
    const summaryEl = document.getElementById('summaryStats');

    if (!data || Object.keys(data).length === 0) {
        summaryEl.innerHTML = '<div class="text-center text-gray-500">No data available</div>';
        return;
    }

    // Extract values
    const values = Object.values(data).filter(v => v !== null);

    if (values.length === 0) {
        summaryEl.innerHTML = '<div class="text-center text-gray-500">No valid values found</div>';
        return;
    }

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Count states by market type
    const marketCounts = {
        'Strong Buyer\'s': values.filter(v => v <= 15).length,
        'Buyer\'s': values.filter(v => v > 15 && v <= 25).length,
        'Slight Buyer\'s': values.filter(v => v > 25 && v <= 35).length,
        'Balanced': values.filter(v => v > 35 && v <= 45).length,
        'Slight Seller\'s': values.filter(v => v > 45 && v <= 55).length,
        'Seller\'s': values.filter(v => v > 55 && v <= 65).length,
        'Strong Seller\'s': values.filter(v => v > 65 && v <= 75).length,
        'Extreme Seller\'s': values.filter(v => v > 75).length
    };

    // Find the dominant market type
    const dominantMarket = Object.entries(marketCounts)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    summaryEl.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">${currentView === 'student' ? 'Student' : 'AI'} Assessment Summary</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">States Analyzed:</span> ${values.length}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Average Score:</span> ${mean.toFixed(1)}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Median Score:</span> ${median.toFixed(1)}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Range:</span> ${min.toFixed(1)} - ${max.toFixed(1)}
                </div>
            </div>
        </div>
        <div>
            <h4 class="font-medium mb-2">Market Distribution</h4>
            <div class="space-y-1 text-sm">
                ${Object.entries(marketCounts)
                    .map(([market, count]) => `
                        <div class="flex justify-between items-center">
                            <span>${market}:</span>
                            <span class="font-medium">${count} states</span>
                        </div>
                    `).join('')}
            </div>
            <div class="mt-3 p-2 bg-blue-50 rounded">
                <span class="font-medium">Dominant Market:</span> ${dominantMarket}
            </div>
        </div>
    `;
}

// Update comparison statistics
function updateComparisonStats() {
    const summaryEl = document.getElementById('summaryStats');

    if (!processedMapData || !aiData ||
        Object.keys(processedMapData).length === 0 ||
        Object.keys(aiData).length === 0) {
        summaryEl.innerHTML = '<div class="text-center text-gray-500">Both student and AI data required for comparison</div>';
        return;
    }

    // Get all states that have both student and AI data
    const commonStates = Object.keys(processedMapData).filter(state =>
        processedMapData[state] !== null && aiData[state] !== null
    );

    if (commonStates.length === 0) {
        summaryEl.innerHTML = '<div class="text-center text-gray-500">No matching states found for comparison</div>';
        return;
    }

    // Calculate differences
    const differences = commonStates.map(state => ({
        state: state,
        diff: processedMapData[state] - aiData[state]
    }));

    // Sort by absolute difference
    differences.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    // Calculate statistics
    const avgDiff = differences.reduce((sum, d) => sum + d.diff, 0) / differences.length;
    const absDiffs = differences.map(d => Math.abs(d.diff));
    const maxAbsDiff = Math.max(...absDiffs);

    // Count agreement levels
    const agreementLevels = {
        'Strong Agreement (≤5)': differences.filter(d => Math.abs(d.diff) <= 5).length,
        'Moderate Agreement (5-10)': differences.filter(d => Math.abs(d.diff) > 5 && Math.abs(d.diff) <= 10).length,
        'Significant Difference (>10)': differences.filter(d => Math.abs(d.diff) > 10).length
    };

    summaryEl.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Assessment Comparison</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">States Compared:</span> ${commonStates.length}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Avg Difference:</span> ${avgDiff.toFixed(1)}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Max Difference:</span> ${maxAbsDiff.toFixed(1)}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                    <span class="font-medium">Direction:</span>
                    ${avgDiff > 0 ? 'Student Higher' : avgDiff < 0 ? 'AI Higher' : 'Equal'}
                </div>
            </div>
        </div>
        <div class="mb-4">
            <h4 class="font-medium mb-2">Agreement Levels</h4>
            <div class="space-y-1 text-sm">
                ${Object.entries(agreementLevels)
                    .map(([level, count]) => `
                        <div class="flex justify-between items-center">
                            <span>${level}:</span>
                            <span class="font-medium">${count} states</span>
                        </div>
                    `).join('')}
            </div>
        </div>
        <div>
            <h4 class="font-medium mb-2">Largest Differences</h4>
            <div class="text-sm space-y-1">
                ${differences.slice(0, 5).map(d => `
                    <div class="flex justify-between items-center">
                        <span>${d.state}:</span>
                        <span class="font-medium ${d.diff > 0 ? 'text-blue-600' : 'text-red-600'}">
                            ${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Export functions
window.dashboard = {
    initDashboard,
    processData,
    processAIData,
    updateMap,
    updateComparisonMap,
    showStatus,
    showAIStatus,
    parseExcel,
    showColumnSelection,
    setActiveView
};