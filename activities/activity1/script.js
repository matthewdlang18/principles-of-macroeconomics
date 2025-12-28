// Global variables
let housingData = null;
let nationalData = null;
let priceChart, supplyChart, daysChart, saleToListChart, priceDropsChart;
let selectedState = '';
let timeRangeMonths = 60; // Default time range (5 years)
let showNationalData = true; // Default to showing national data
let expandedChart = null;
let originalContainer = null;
let statesGeoJson = null; // Add this to store the geojson data

// Function to load geojson data
async function loadGeoJsonData() {
    try {
        const response = await fetch('data/us-states.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        statesGeoJson = await response.json();
        return statesGeoJson;
    } catch (error) {
        console.error('Error loading geojson data:', error);
        throw error;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Load both national data and geojson data
        await Promise.all([
            loadNationalData(),
            loadGeoJsonData()
        ]);
        
        // Step navigation
        const navButtons = document.querySelectorAll('.step-nav');
        const stepContents = document.querySelectorAll('.step-content');
        
        function showStep(stepId) {
            // Hide all step contents
            stepContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Remove active class from all nav buttons
            navButtons.forEach(btn => {
                btn.classList.remove('border-blue-600', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Show the selected step content
            document.getElementById('step-' + stepId).classList.remove('hidden');
            
            // Add active class to the clicked nav button
            document.getElementById('nav-' + stepId).classList.add('border-blue-600', 'text-blue-600');
            document.getElementById('nav-' + stepId).classList.remove('border-transparent', 'text-gray-500');
        }
        
        // Add click event to nav buttons
        navButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const stepId = this.id.replace('nav-', '');
                showStep(stepId);
            });
        });
        
        // Navigation button events
        document.getElementById('next-upload').addEventListener('click', function() {
            showStep('upload');
        });
        
        document.getElementById('back-to-instructions').addEventListener('click', function() {
            showStep('instructions');
        });
        
        document.getElementById('next-to-analysis').addEventListener('click', function() {
            showStep('analysis');
            initCharts(); // Initialize charts when showing the analysis step
        });
        
        document.getElementById('back-to-upload').addEventListener('click', function() {
            showStep('upload');
        });
        
        document.getElementById('finish-activity').addEventListener('click', function() {
            showStep('ai-response');
        });
        
        document.getElementById('close-modal').addEventListener('click', function() {
            document.getElementById('completion-modal').classList.add('hidden');
            window.location.href = 'index.html';
        });

        // Add this handler for the submit button in step 4
        document.getElementById('submit-ai-response').addEventListener('click', function() {
            // Handle submission without showing modal
            alert('Analysis submitted successfully! Thank you for completing the activity.');
        });
        
        // Add modal close functionality
        document.getElementById('close-chart-modal').addEventListener('click', function() {
            document.getElementById('chart-modal').classList.add('hidden');
        });

        document.getElementById('back-to-analysis').addEventListener('click', function() {
            showStep('analysis');
        });
        
        // File upload handling
        document.getElementById('upload-btn').addEventListener('click', function() {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', async function() {
            if (this.files.length > 0) {
                const file = this.files[0];
                try {
                    // Display file as uploaded
                    document.getElementById('upload-area').classList.add('hidden');
                    document.getElementById('file-uploaded').classList.remove('hidden');
                    document.getElementById('filename').textContent = file.name;
                    document.getElementById('file-stats').textContent = 'Loading data...';
                    
                    // Read the file
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
                    
                    // Get the first sheet
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    housingData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    // Update file stats
                    document.getElementById('file-stats').textContent = 
                        `File loaded successfully: ${housingData.length} rows of data. Click "Next" to analyze the data.`;
                    
                    // Show data preview
                    document.getElementById('data-preview').classList.remove('hidden');
                    createDataPreview(housingData);
                    
                    // Enable the next button
                    document.getElementById('next-to-analysis').disabled = false;
                    
                    // Initialize charts immediately after data load
                    initCharts();
                    
                } catch (error) {
                    console.error('Error processing file:', error);
                    document.getElementById('file-stats').textContent = 
                        'Error processing file. Please make sure it is a valid Excel file from Redfin.';
                }
            }
        });
        
        document.getElementById('remove-file').addEventListener('click', function() {
            document.getElementById('file-input').value = '';
            document.getElementById('upload-area').classList.remove('hidden');
            document.getElementById('file-uploaded').classList.add('hidden');
            document.getElementById('data-preview').classList.add('hidden');
            housingData = null;
            document.getElementById('next-to-analysis').disabled = true;
        });
        
        // Analysis calculations
        const weightInputs = document.querySelectorAll('.weight-input');
        const valueInputs = document.querySelectorAll('.value-input');
        
        // Add validation for weight and value inputs
        weightInputs.forEach(input => {
            input.addEventListener('change', function() {
                // Enforce min and max values
                const min = parseInt(this.min) || 0;
                const max = parseInt(this.max) || 100;
                
                if (this.value === '' || isNaN(this.value)) {
                    this.value = 0;
                } else {
                    const value = parseInt(this.value);
                    if (value < min) this.value = min;
                    if (value > max) this.value = max;
                }
                
                updateWeightedValues();
            });
        });

        valueInputs.forEach(input => {
            input.addEventListener('change', function() {
                // Enforce min and max values
                const min = parseInt(this.min) || 1;
                const max = parseInt(this.max) || 100;
                
                if (this.value === '' || isNaN(this.value)) {
                    this.value = min;
                } else {
                    const value = parseInt(this.value);
                    if (value < min) this.value = min;
                    if (value > max) this.value = max;
                }
                
                updateWeightedValues();
            });
        });
        
        // Initialize weighted values on page load
        updateWeightedValues();

        // Add national data toggle handler
        document.getElementById('national-data-toggle').addEventListener('change', function() {
            showNationalData = this.checked;
            if (housingData) {
                processHousingData();
            }
        });

        // Add expand chart functionality
        document.querySelectorAll('.expand-chart').forEach(button => {
            button.addEventListener('click', function() {
                const chartType = this.dataset.chart;
                const container = this.closest('.chart-container');
                const canvas = container.querySelector('canvas');
                
                if (expandedChart === canvas) {
                    // Collapse - restore original height if saved, otherwise default to 250px
                    container.style.height = container.dataset.originalHeight || '250px';
                    container.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white', 'p-4');
                    expandedChart = null;
                } else {
                    // Expand
                    if (expandedChart) {
                        // Collapse any currently expanded chart
                        const expandedButton = expandedChart.parentElement.querySelector('.expand-chart');
                        expandedButton.click();
                    }
                    // Save original height before expanding
                    container.dataset.originalHeight = container.style.height;
                    container.style.height = '90vh';
                    container.classList.add('fixed', 'inset-0', 'z-50', 'bg-white', 'p-4');
                    expandedChart = canvas;
                }
                
                // Resize the chart
                const chart = Chart.getChart(canvas);
                if (chart) {
                    chart.resize();
                }
            });
        });
    } catch (error) {
        console.error('Error initializing:', error);
    }
});

// Helper Functions
function createDataPreview(data) {
    if (!data || data.length === 0) return;
    
    const previewTable = document.getElementById('preview-table');
    const headerRow = previewTable.querySelector('thead tr');
    const tbody = previewTable.querySelector('tbody');
    
    // Clear existing table
    headerRow.innerHTML = '';
    tbody.innerHTML = '';
    
    // Get the column names from the first row
    const columns = Object.keys(data[0]);
    
    // Add headers
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        th.className = 'p-2 border text-left';
        headerRow.appendChild(th);
    });
    
    // Add rows (just first 3 for preview)
    for (let i = 0; i < Math.min(3, data.length); i++) {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = data[i][column];
            td.className = 'p-2 border';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
}

function updateWeightedValues() {
    let totalWeight = 0;
    let totalWeightedValue = 0;
    
    const weightInputs = document.querySelectorAll('.weight-input');
    weightInputs.forEach(input => {
        const metric = input.dataset.metric;
        // Enforce min/max values during calculation
        let weight = parseFloat(input.value) || 0;
        weight = Math.max(0, Math.min(100, weight)); // Ensure weight is between 0-100
        
        const valueInput = document.querySelector(`.value-input[data-metric="${metric}"]`);
        let value = parseFloat(valueInput.value) || 0;
        value = Math.max(1, Math.min(100, value)); // Ensure value is between 1-100
        
        const weightedValue = (weight / 100) * value;
        
        // Update all weighted value displays for this metric
        document.querySelectorAll(`.weighted-value[data-metric="${metric}"]`).forEach(el => {
            el.textContent = weightedValue.toFixed(2);
        });
        
        totalWeight += weight;
        totalWeightedValue += weightedValue;
    });
    
    // Update totals
    document.getElementById('total-weight').textContent = totalWeight;
    document.getElementById('total-weighted-value').textContent = totalWeightedValue.toFixed(2);
    document.getElementById('final-score').textContent = totalWeightedValue.toFixed(2);
    document.getElementById('modal-score').textContent = totalWeightedValue.toFixed(2);
    
    // Update score marker position (0-100%)
    document.getElementById('score-marker').style.left = `${totalWeightedValue}%`;
    
    // Show/hide weight warning
    if (totalWeight !== 100) {
        document.getElementById('weight-warning').classList.remove('hidden');
    } else {
        document.getElementById('weight-warning').classList.add('hidden');
    }
    
    // Update market type
    const marketType = totalWeightedValue < 40 ? 'buyers' : totalWeightedValue > 60 ? 'sellers' : 'balanced';
    document.getElementById('market-type').textContent = marketType;
    document.getElementById('modal-market-type').textContent = marketType;
}

// Chart Functions
function initCharts() {
    const timeRangeSelect = document.getElementById('time-range');
    timeRangeMonths = parseInt(timeRangeSelect.value);
    
    // If we have data, process it
    if (housingData) {
        processHousingData();
    }
    
    // Add event listener for time range changes
    timeRangeSelect.addEventListener('change', function() {
        timeRangeMonths = parseInt(this.value);
        if (housingData) {
            processHousingData();
        }
    });
    
    // Add maximize buttons to all charts
    addMaximizeButtonsToCharts();
    
    // Update all charts to remove dots
    if (priceChart) updateChartConfig(priceChart);
    if (supplyChart) updateChartConfig(supplyChart);
    if (daysChart) updateChartConfig(daysChart);
    if (saleToListChart) updateChartConfig(saleToListChart);
    if (priceDropsChart) updateChartConfig(priceDropsChart);
}

// Helper function to find a column name from possible alternatives
function findColumn(row, possibleNames) {
    for (const name of possibleNames) {
        if (row.hasOwnProperty(name)) {
            return name;
        }
    }
    return null;
}

// Helper function to format dates consistently
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error("Invalid date string:", dateString);
            return dateString;
        }
        const options = { year: 'numeric', month: 'short' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Error formatting date:", e, dateString);
        return dateString;
    }
}

// Helper function to format currency
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US').format(value);
}

function processHousingData() {
    console.log("Processing housing data:", housingData);
    
    try {
        if (!housingData || housingData.length === 0) {
            console.error("No housing data available");
            return;
        }
        
        const firstRow = housingData[0];
        console.log("First data row:", firstRow);
        
        const columnMap = {
            date: findColumn(firstRow, ['Period Begin', 'Month of Period End', 'Date', 'Period End']),
            price: findColumn(firstRow, ['Median Sale Price', 'median_sale_price', 'MedianSalePrice']),
            days: findColumn(firstRow, ['Days on Market (Median)', 'Days on Market', 'median_days_on_market', 'DaysOnMarket']),
            saleToList: findColumn(firstRow, ['Average Sale To List', 'Sale-to-List', 'sale_to_list_ratio', 'SaleToList']),
            monthsSupply: findColumn(firstRow, ['Months of Supply', 'months_of_supply', 'MonthsSupply']),
            inventory: findColumn(firstRow, ['Inventory', 'inventory']),
            homesSold: findColumn(firstRow, ['Homes Sold', 'homes_sold', 'HomesSold']),
            priceDrops: findColumn(firstRow, ['Price Drops', 'price_drops_pct', 'Price Reduced', 'PriceDrops'])
        };
        
        console.log("Column mapping:", columnMap);
        
        if (!columnMap.date || !columnMap.price) {
            console.error("Required columns not found in data");
            return;
        }
        
        housingData.sort((a, b) => {
            const dateA = new Date(a[columnMap.date]);
            const dateB = new Date(b[columnMap.date]);
            return dateA - dateB;
        });
        
        let filteredData = [...housingData];
        if (timeRangeMonths !== 'all' && filteredData.length > timeRangeMonths) {
            filteredData = filteredData.slice(-timeRangeMonths);
        }
        
        console.log("Filtered data:", filteredData);
        
        const dates = filteredData.map(row => formatDate(row[columnMap.date]));
        const prices = filteredData.map(row => parseFloat(row[columnMap.price]) || 0);
        
        const daysOnMarket = filteredData.map(row => {
            return columnMap.days ? parseFloat(row[columnMap.days]) || 0 : null;
        });
        
        const saleToList = filteredData.map(row => {
            if (!columnMap.saleToList) return null;
            const value = parseFloat(row[columnMap.saleToList]) || 0;
            return value < 5 ? value * 100 : value;
        });
        
        const monthsSupply = filteredData.map(row => {
            if (columnMap.monthsSupply) {
                return parseFloat(row[columnMap.monthsSupply]) || 0;
            } else if (columnMap.inventory && columnMap.homesSold) {
                const inventory = parseFloat(row[columnMap.inventory]) || 0;
                const homesSold = parseFloat(row[columnMap.homesSold]) || 1;
                return inventory / homesSold;
            }
            return null;
        });
        
        const priceDrops = filteredData.map(row => {
            if (columnMap.priceDrops) {
                return parseFloat(row[columnMap.priceDrops]) || 0;
            }
            return null;
        });
        
        // Process national data if available
        let nationalDates = [], nationalPrices = [], nationalDaysOnMarket = [], 
            nationalSaleToList = [], nationalMonthsSupply = [], nationalPriceDrops = [];
            
        if (nationalData && nationalData.length > 0) {
            const nationalFirstRow = nationalData[0];
            const nationalColumnMap = {
                date: findColumn(nationalFirstRow, ['Period Begin', 'Month of Period End', 'Date', 'Period End']),
                price: findColumn(nationalFirstRow, ['Median Sale Price', 'median_sale_price', 'MedianSalePrice']),
                days: findColumn(nationalFirstRow, ['Days on Market (Median)', 'Days on Market', 'median_days_on_market', 'DaysOnMarket']),
                saleToList: findColumn(nationalFirstRow, ['Average Sale To List', 'Sale-to-List', 'sale_to_list_ratio', 'SaleToList']),
                monthsSupply: findColumn(nationalFirstRow, ['Months of Supply', 'months_of_supply', 'MonthsSupply']),
                inventory: findColumn(nationalFirstRow, ['Inventory', 'inventory']),
                homesSold: findColumn(nationalFirstRow, ['Homes Sold', 'homes_sold', 'HomesSold']),
                priceDrops: findColumn(nationalFirstRow, ['Price Drops', 'price_drops_pct', 'Price Reduced', 'PriceDrops'])
            };
            
            if (nationalColumnMap.date && nationalColumnMap.price) {
                nationalData.sort((a, b) => {
                    const dateA = new Date(a[nationalColumnMap.date]);
                    const dateB = new Date(b[nationalColumnMap.date]);
                    return dateA - dateB;
                });
                
                let filteredNationalData = [...nationalData];
                if (timeRangeMonths !== 'all' && filteredNationalData.length > timeRangeMonths) {
                    filteredNationalData = filteredNationalData.slice(-timeRangeMonths);
                }
                
                nationalDates = filteredNationalData.map(row => formatDate(row[nationalColumnMap.date]));
                nationalPrices = filteredNationalData.map(row => parseFloat(row[nationalColumnMap.price]) || 0);
                nationalDaysOnMarket = filteredNationalData.map(row => {
                    return nationalColumnMap.days ? parseFloat(row[nationalColumnMap.days]) || 0 : null;
                });
                nationalSaleToList = filteredNationalData.map(row => {
                    if (!nationalColumnMap.saleToList) return null;
                    const value = parseFloat(row[nationalColumnMap.saleToList]) || 0;
                    return value < 5 ? value * 100 : value;
                });
                nationalMonthsSupply = filteredNationalData.map(row => {
                    if (nationalColumnMap.monthsSupply) {
                        return parseFloat(row[nationalColumnMap.monthsSupply]) || 0;
                    } else if (nationalColumnMap.inventory && nationalColumnMap.homesSold) {
                        const inventory = parseFloat(row[nationalColumnMap.inventory]) || 0;
                        const homesSold = parseFloat(row[nationalColumnMap.homesSold]) || 1;
                        return inventory / homesSold;
                    }
                    return null;
                });
                nationalPriceDrops = filteredNationalData.map(row => {
                    if (nationalColumnMap.priceDrops) {
                        return parseFloat(row[nationalColumnMap.priceDrops]) || 0;
                    }
                    return null;
                });
            }
        }
        
        console.log("Extracted data series:", {
            dates,
            prices,
            daysOnMarket,
            saleToList,
            monthsSupply,
            priceDrops,
            nationalDates,
            nationalPrices,
            nationalDaysOnMarket,
            nationalSaleToList,
            nationalMonthsSupply,
            nationalPriceDrops
        });
        
        updateMedianPriceChart(dates, prices, nationalDates, nationalPrices);
        
        if (monthsSupply.some(value => value !== null)) {
            updateMonthsSupplyChart(dates, monthsSupply, nationalDates, nationalMonthsSupply);
        }
        
        if (daysOnMarket.some(value => value !== null)) {
            updateDaysOnMarketChart(dates, daysOnMarket, nationalDates, nationalDaysOnMarket);
        }
        
        if (saleToList.some(value => value !== null)) {
            updateSaleToListChart(dates, saleToList, nationalDates, nationalSaleToList);
        }
        
        if (priceDrops.some(value => value !== null)) {
            updatePriceDropsChart(dates, priceDrops, nationalDates, nationalPriceDrops);
        }
        
        if (filteredData.length > 0) {
            const latestData = filteredData[filteredData.length - 1];
            
            const currentPrice = parseFloat(latestData[columnMap.price]) || 0;
            document.getElementById('price-value').textContent = formatCurrency(currentPrice);
            
            if (filteredData.length > 12) {
                const yearAgoIndex = Math.max(0, filteredData.length - 13);
                const yearAgoPrice = parseFloat(filteredData[yearAgoIndex][columnMap.price]) || 0;
                if (yearAgoPrice > 0) {
                    const growthRate = ((currentPrice / yearAgoPrice) - 1) * 100;
                    document.getElementById('price-growth').textContent = growthRate.toFixed(1) + '%';
                }
            }
            
            if (columnMap.days) {
                const daysValue = parseFloat(latestData[columnMap.days]) || 0;
                document.getElementById('days-value').textContent = daysValue.toFixed(0);
            }
            
            if (columnMap.saleToList) {
                let saleToListValue = parseFloat(latestData[columnMap.saleToList]) || 0;
                if (saleToListValue < 5) saleToListValue *= 100;
                document.getElementById('sale-to-list-value').textContent = saleToListValue.toFixed(1) + '%';
            }
            
            let supplyValue = 0;
            if (columnMap.monthsSupply) {
                supplyValue = parseFloat(latestData[columnMap.monthsSupply]) || 0;
            } else if (columnMap.inventory && columnMap.homesSold) {
                const inventory = parseFloat(latestData[columnMap.inventory]) || 0;
                const homesSold = parseFloat(latestData[columnMap.homesSold]) || 1;
                supplyValue = inventory / homesSold;
            }
            document.getElementById('supply-value').textContent = supplyValue.toFixed(1);
            
            if (columnMap.priceDrops) {
                const dropValue = parseFloat(latestData[columnMap.priceDrops]) || 0;
                document.getElementById('price-drops-value').textContent = dropValue.toFixed(1) + '%';
            }
        }
        
    } catch (error) {
        console.error('Error processing housing data:', error);
    }
}

function updateMedianPriceChart(dates, prices, nationalDates, nationalPrices) {
    console.log("Updating median price chart with:", { dates, prices, nationalDates, nationalPrices });
    
    const ctx = document.getElementById('priceChart');
    if (!ctx) {
        console.error("Price chart canvas element not found");
        return;
    }
    
    if (!dates.length || !prices.length) {
        console.error("No data available for price chart");
        return;
    }
    
    if (priceChart) {
        priceChart.destroy();
    }
    
    const numericPrices = prices.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    const numericNationalPrices = nationalPrices.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    
    const balancedGrowthMin = [];
    const balancedGrowthMax = [];
    
    if (numericPrices.length > 0 && numericPrices[0] > 0) {
        const startPrice = numericPrices[0];
        for (let i = 0; i < dates.length; i++) {
            balancedGrowthMin.push(startPrice * Math.pow(1.0025, i));
            balancedGrowthMax.push(startPrice * Math.pow(1.004, i));
        }
    }
    
    const balancedAreaData = numericPrices.map((_, i) => {
        if (i < balancedGrowthMin.length && i < balancedGrowthMax.length) {
            return balancedGrowthMax[i];
        }
        return null;
    });
    
    try {
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Balanced Range (3-5% Growth)',
                        data: balancedAreaData,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        pointRadius: 0,
                        fill: '+1',
                        order: 4
                    },
                    {
                        label: 'Balanced Min (3% Growth)',
                        data: balancedGrowthMin,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    },
                    {
                        label: 'Balanced Max (5% Growth)',
                        data: balancedGrowthMax,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '-1',
                        order: 2
                    },
                    {
                        label: `Median Sale Price ($)`,
                        data: numericPrices,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { 
                                        style: 'currency', 
                                        currency: 'USD',
                                        maximumFractionDigits: 0
                                    }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Add national data if available and toggle is on
        if (showNationalData && nationalDates.length > 0 && nationalPrices.length > 0) {
            priceChart.data.datasets.push({
                label: 'National Median Sale Price ($)',
                data: numericNationalPrices,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            });
            priceChart.update();
        }
        
        console.log("Price chart created successfully");
    } catch (error) {
        console.error("Error creating price chart:", error);
    }
}

function updateMonthsSupplyChart(dates, monthsSupply, nationalDates, nationalMonthsSupply) {
    const ctx = document.getElementById('supplyChart');
    if (!ctx) {
        console.error("Supply chart canvas element not found");
        return;
    }
    
    if (!dates.length || !monthsSupply.some(value => value !== null)) {
        console.error("No data available for months supply chart");
        return;
    }
    
    if (supplyChart) {
        supplyChart.destroy();
    }
    
    const numericData = monthsSupply.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    const numericNationalData = nationalMonthsSupply.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    
    const balancedMin = Array(dates.length).fill(4);
    const balancedMax = Array(dates.length).fill(6);
    const balancedAreaData = balancedMax.slice();
    
    try {
        supplyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Balanced Range (4-6 months)',
                        data: balancedAreaData,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        pointRadius: 0,
                        fill: '+1',
                        order: 4
                    },
                    {
                        label: 'Balanced Min (4 months)',
                        data: balancedMin,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 3
                    },
                    {
                        label: 'Balanced Max (6 months)',
                        data: balancedMax,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '-1',
                        order: 2
                    },
                    {
                        label: 'Months of Supply',
                        data: numericData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1) + ' months';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Months'
                        }
                    }
                }
            }
        });
        
        // Add national data if available and toggle is on
        if (showNationalData && nationalDates.length > 0 && nationalMonthsSupply.some(value => value !== null)) {
            supplyChart.data.datasets.push({
                label: 'National Months of Supply',
                data: numericNationalData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            });
            supplyChart.update();
        }
        
        console.log("Months supply chart created successfully");
    } catch (error) {
        console.error("Error creating months supply chart:", error);
    }
}

function updateDaysOnMarketChart(dates, daysOnMarket, nationalDates, nationalDaysOnMarket) {
    const ctx = document.getElementById('daysChart');
    if (!ctx) {
        console.error("Days chart canvas element not found");
        return;
    }
    
    if (!dates.length || !daysOnMarket.some(value => value !== null)) {
        console.error("No data available for days on market chart");
        return;
    }
    
    if (daysChart) {
        daysChart.destroy();
    }
    
    const numericData = daysOnMarket.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    const numericNationalData = nationalDaysOnMarket.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    
    const balancedMin = Array(dates.length).fill(30);
    const balancedMax = Array(dates.length).fill(60);
    const balancedAreaData = balancedMax.slice();
    
    try {
        daysChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Balanced Range (30-60 days)',
                        data: balancedAreaData,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        pointRadius: 0,
                        fill: '+1',
                        order: 3
                    },
                    {
                        label: 'Balanced Min (30 days)',
                        data: balancedMin,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 2
                    },
                    {
                        label: 'Balanced Max (60 days)',
                        data: balancedMax,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '-1',
                        order: 1
                    },
                    {
                        label: 'Days on Market',
                        data: numericData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(0) + ' days';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Days'
                        }
                    }
                }
            }
        });
        
        // Add national data if available and toggle is on
        if (showNationalData && nationalDates.length > 0 && nationalDaysOnMarket.some(value => value !== null)) {
            daysChart.data.datasets.push({
                label: 'National Days on Market',
                data: numericNationalData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            });
            daysChart.update();
        }
        
        console.log("Days on market chart created successfully");
    } catch (error) {
        console.error("Error creating days on market chart:", error);
    }
}

function updateSaleToListChart(dates, saleToList, nationalDates, nationalSaleToList) {
    const ctx = document.getElementById('saleToListChart');
    if (!ctx) {
        console.error("Sale-to-list chart canvas element not found");
        return;
    }
    
    if (!dates.length || !saleToList.some(value => value !== null)) {
        console.error("No data available for sale-to-list chart");
        return;
    }
    
    if (saleToListChart) {
        saleToListChart.destroy();
    }
    
    const numericData = saleToList.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    const numericNationalData = nationalSaleToList.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    
    const balancedMin = Array(dates.length).fill(98);
    const balancedMax = Array(dates.length).fill(102);
    const balancedAreaData = balancedMax.slice();
    
    try {
        saleToListChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Balanced Range (98-102%)',
                        data: balancedAreaData,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        pointRadius: 0,
                        fill: '+1',
                        order: 3
                    },
                    {
                        label: 'Balanced Min (98%)',
                        data: balancedMin,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 2
                    },
                    {
                        label: 'Balanced Max (102%)',
                        data: balancedMax,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '-1',
                        order: 1
                    },
                    {
                        label: 'Sale-to-List Ratio',
                        data: numericData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Percentage'
                        }
                    }
                }
            }
        });
        
        // Add national data if available and toggle is on
        if (showNationalData && nationalDates.length > 0 && nationalSaleToList.some(value => value !== null)) {
            saleToListChart.data.datasets.push({
                label: 'National Sale-to-List Ratio',
                data: numericNationalData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            });
            saleToListChart.update();
        }
        
        console.log("Sale-to-list chart created successfully");
    } catch (error) {
        console.error("Error creating sale-to-list chart:", error);
    }
}

function updatePriceDropsChart(dates, priceDrops, nationalDates, nationalPriceDrops) {
    const ctx = document.getElementById('priceDropsChart');
    if (!ctx) {
        console.error("Price drops chart canvas element not found");
        return;
    }
    
    if (!dates.length || !priceDrops.some(value => value !== null)) {
        console.error("No data available for price drops chart");
        return;
    }
    
    if (priceDropsChart) {
        priceDropsChart.destroy();
    }
    
    const numericData = priceDrops.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    const numericNationalData = nationalPriceDrops.map(p => typeof p === 'number' ? p : parseFloat(p) || 0);
    
    const balancedMin = Array(dates.length).fill(10);
    const balancedMax = Array(dates.length).fill(20);
    const balancedAreaData = balancedMax.slice();
    
    try {
        priceDropsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: 'Balanced Range (10-20%)',
                        data: balancedAreaData,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        pointRadius: 0,
                        fill: '+1',
                        order: 3
                    },
                    {
                        label: 'Balanced Min (10%)',
                        data: balancedMin,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                        order: 2
                    },
                    {
                        label: 'Balanced Max (20%)',
                        data: balancedMax,
                        borderColor: 'rgba(34, 197, 94, 0.7)',
                        borderWidth: 1,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: '-1',
                        order: 1
                    },
                    {
                        label: 'Price Drops',
                        data: numericData,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        order: 0
                    }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false,
                        position: 'top'
                    },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toFixed(1) + '%';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percentage'
                        }
                    }
                }
            }
        });
        
        // Add national data if available and toggle is on
        if (showNationalData && nationalDates.length > 0 && nationalPriceDrops.some(value => value !== null)) {
            priceDropsChart.data.datasets.push({
                label: 'National Price Drops',
                data: numericNationalData,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                order: 1
            });
            priceDropsChart.update();
        }
        
        console.log("Price drops chart created successfully");
    } catch (error) {
        console.error("Error creating price drops chart:", error);
    }
}

// Add this after the DOMContentLoaded event listener
async function loadNationalData() {
    try {
        const response = await fetch('nationaldata.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        nationalData = XLSX.utils.sheet_to_json(firstSheet);
        console.log("National data loaded successfully:", nationalData);
    } catch (error) {
        console.error("Error loading national data:", error);
    }
}

// Add this function to handle chart expansion
function toggleChartExpansion(chart, container) {
    if (expandedChart === chart) {
        // If this chart is already expanded, restore it
        container.classList.remove('w-full', 'h-full', 'fixed', 'inset-0', 'z-50');
        container.classList.add('w-full', 'h-64');
        expandedChart = null;
        originalContainer = null;
    } else {
        // If another chart is expanded, restore it first
        if (expandedChart) {
            const oldContainer = document.getElementById(`chart-container-${expandedChart.id}`);
            oldContainer.classList.remove('w-full', 'h-full', 'fixed', 'inset-0', 'z-50');
            oldContainer.classList.add('w-full', 'h-64');
        }
        
        // Expand this chart
        container.classList.remove('w-full', 'h-64');
        container.classList.add('w-full', 'h-full', 'fixed', 'inset-0', 'z-50');
        expandedChart = chart;
        originalContainer = container;
    }
}

function addMaximizeButtonsToCharts() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartId = container.id.replace('chart-container-', '');
        const chart = Chart.getChart(chartId);
        if (chart) {
            const maximizeBtn = document.createElement('button');
            maximizeBtn.className = 'absolute top-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer';
            maximizeBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>';
            maximizeBtn.onclick = () => toggleChartExpansion(chart, container);
            container.appendChild(maximizeBtn);
        }
    });
}

// Update chart configurations to remove dots
function updateChartConfig(chart) {
    chart.options.elements.point.radius = 0;
    chart.options.elements.point.hoverRadius = 0;
    chart.update();
}