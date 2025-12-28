let countryData = [];
let variables = [];
let map;
let geojson;
let info;
let legend;
let countryScores = [];
let gdpRankings = {};  // Store GDP rankings
let hdiRankings = {};  // Store HDI rankings

// Parse CSV string into array of arrays
function parseCSV(str) {
    const arr = [];
    let quote = false;
    let col = '';
    let row = [];

    for (let char of str) {
        if (char === '"') {
            quote = !quote;
        } else if (char === ',' && !quote) {
            row.push(col.trim());
            col = '';
        } else if (char === '\n' && !quote) {
            row.push(col.trim());
            arr.push(row);
            row = [];
            col = '';
        } else {
            col += char;
        }
    }
    if (col) {
        row.push(col.trim());
    }
    if (row.length) {
        arr.push(row);
    }
    return arr;
}

// Fetch and process the CSV data
async function loadData() {
    const [csvResponse, geoJsonResponse] = await Promise.all([
        fetch('./data/country_averages.csv'),
        fetch('./data/countries.geo.json')
    ]);
    
    const csvText = await csvResponse.text();
    const rows = parseCSV(csvText);
    
    // Get headers and remove quotes
    const headers = rows[0].map(h => h.replace(/"/g, '').trim());
    
    // Convert rows to objects
    countryData = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = row[i] === '' ? null : 
                isNaN(row[i]) ? row[i].trim() : parseFloat(row[i]);
        });
        return obj;
    });

    // Use GDP and HDI rankings from CSV
    gdpRankings = {};
    hdiRankings = {};
    countryData.forEach(country => {
        if (country['GDP per Capita Rank'] != null) {
            gdpRankings[country.id] = country['GDP per Capita Rank'];
        }
        if (country['HDI Rank'] != null) {
            hdiRankings[country.id] = country['HDI Rank'];
        }
    });
    
    // Get variable names (excluding metadata columns)
    variables = headers.filter(h => !['Country Name', 'id', 'GDP per Capita Rank', 'HDI Rank'].includes(h));
    
    // Populate variable selector
    const select = $('#variables');
    variables.forEach(variable => {
        select.append(new Option(variable, variable));
    });
    
    // Initialize map
    initializeMap(await geoJsonResponse.json());
}

function initializeMap(geoJsonData) {
    // Initialize the map
    map = L.map('map').setView([20, 0], 2);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: ' OpenStreetMap contributors'
    }).addTo(map);

    // Add info control
    info = L.control();
    info.onAdd = function() {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    info.update = function(props) {
        this._div.innerHTML = '<h4>Index Score</h4>' + 
            (props ? '<b>' + props.name + '</b><br />' + 
            (props.score !== undefined ? props.score.toFixed(3) : 'No data')
            : 'Hover over a country');
    };
    info.addTo(map);

    // Store GeoJSON data for later use
    window.geoJsonData = geoJsonData;
}

function updateMap(countryScores) {
    if (geojson) {
        map.removeLayer(geojson);
    }
    if (legend) {
        map.removeControl(legend);
    }

    // Create a scores lookup object
    const scoreLookup = {};
    countryScores.forEach(score => {
        scoreLookup[score.id] = score.indexScore;
    });

    // Update GeoJSON features with scores
    const features = window.geoJsonData.features.map(feature => {
        // Find the country data using the ID instead of name
        const countryScore = countryScores.find(score => {
            const countryData = score.countryData;
            return countryData && countryData.id === feature.id;
        });
        
        return {
            ...feature,
            properties: {
                ...feature.properties,
                score: countryScore ? countryScore.indexScore : null
            }
        };
    });

    // Get color based on score
    function getColor(score) {
        return score > 1.5 ? '#1a9850' :   // Dark green
               score > 1.0 ? '#66bd63' :   // Medium green
               score > 0.5 ? '#a6d96a' :   // Light green
               score > 0 ? '#d9ef8b' :     // Yellow-green
               score > -0.5 ? '#fee08b' :  // Light yellow
               score > -1.0 ? '#fdae61' :  // Orange
               score > -1.5 ? '#f46d43' :  // Light red
                            '#d73027';      // Dark red
    }

    function style(feature) {
        return {
            fillColor: getColor(feature.properties.score),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight
        });
    }

    // Add GeoJSON layer
    geojson = L.geoJson({
        type: 'FeatureCollection',
        features: features
    }, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

    // Create legend
    if (legend) {
        map.removeControl(legend);
    }
    legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5];
        const labels = [];

        // Add CSS styles directly to the legend
        div.style.width = '200px';
        div.style.padding = '10px';
        div.style.backgroundColor = 'white';
        div.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
        div.style.borderRadius = '4px';

        div.innerHTML = '<h4 style="margin-top: 0; margin-bottom: 10px;">Z-Score</h4>';

        // Loop through our intervals and generate a label with a colored square for each interval
        for (let i = 0; i < grades.length; i++) {
            const from = grades[i];
            const to = grades[i + 1];

            labels.push(
                '<div style="margin-bottom: 5px;">' +
                '<i style="background:' + getColor(from + 0.1) + '; width: 30px; height: 18px; float: left; margin-right: 8px; opacity: 0.7;"></i> ' +
                '<span style="line-height: 18px;">' +
                (to ? from + ' to ' + to : from + '+') +
                '</span>' +
                '<div style="clear: both;"></div>' +
                '</div>'
            );
        }

        div.innerHTML += labels.join('');
        return div;
    };
    legend.addTo(map);
}

// Calculate z-scores for a given variable
function calculateZScores(variable) {
    // Filter out null values and non-numeric values
    const values = countryData
        .map(country => country[variable])
        .filter(val => val !== null && typeof val === 'number' && !isNaN(val));
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
    
    return countryData.map(country => ({
        id: country.id,
        indexScore: (country[variable] === null || typeof country[variable] !== 'number' || isNaN(country[variable])) 
            ? null 
            : (country[variable] - mean) / std
    }));
}

// Initialize the page
$(document).ready(async function() {
    await loadData();
    
    // Create variable boxes
    const variableBoxes = $('#variable-boxes');
    variables.forEach(variable => {
        const box = $(`
            <div class="variable-box cursor-pointer p-2 border rounded hover:bg-blue-50 relative group" data-variable="${variable}">
                <div class="text-sm font-medium">${variable}</div>
                <div class="hidden group-hover:block absolute z-10 bg-white border rounded-lg shadow-lg p-4 w-72 text-sm -translate-y-full top-0 left-1/2 transform -translate-x-1/2">
                    <div class="font-medium mb-1">${variable}</div>
                    <div class="text-gray-600">${getVariableDescription(variable)}</div>
                </div>
                <div class="weight-input hidden mt-2">
                    <input type="number" class="w-full px-2 py-1 border rounded text-sm" 
                           value="1" min="0" max="100" step="0.1">
                </div>
            </div>
        `);
        
        box.click(function(e) {
            // Don't toggle selection if clicking on the input or its spinner buttons
            if ($(e.target).is('input') || $(e.target).closest('.weight-input').length > 0) {
                return;
            }
            
            const selectedBoxes = $('.variable-box.selected');
            if (!$(this).hasClass('selected') && selectedBoxes.length >= 8) {
                alert('You can select up to 8 variables');
                return;
            }
            
            $(this).toggleClass('selected bg-blue-100');
            $(this).find('.weight-input').toggleClass('hidden');
            updateWeights();
        });
        
        variableBoxes.append(box);
    });
    
    // Handle calculate button click
    $('#calculate').click(function() {
        const selectedBoxes = $('.variable-box.selected');
        
        // Check if any variables are selected
        if (selectedBoxes.length === 0) {
            alert('Please select at least one variable.');
            return;
        }
        
        // Check if weights sum to 100
        let totalWeight = 0;
        selectedBoxes.each(function() {
            totalWeight += parseFloat($(this).find('input').val()) || 0;
        });
        
        if (Math.abs(totalWeight - 100) > 0.01) {
            alert('Weights must sum to 100%.');
            return;
        }
        
        // Get weights for each variable
        const weights = {};
        selectedBoxes.each(function() {
            const variable = $(this).data('variable');
            weights[variable] = parseFloat($(this).find('input').val()) || 1;
        });
        
        // Calculate z-scores for each country and variable
        countryScores = countryData.map(country => {
            const scores = {};
            let totalWeight = 0;
            let weightedSum = 0;
            let validScores = 0;
            
            selectedBoxes.each(function() {
                const variable = $(this).data('variable');
                if (!isNaN(country[variable])) {
                    const zScores = calculateZScores(variable);
                    const countryZScore = zScores.find(z => z.id === country.id)?.indexScore;
                    if (countryZScore !== null) {
                        scores[variable] = countryZScore;
                        weightedSum += countryZScore * weights[variable];
                        totalWeight += weights[variable];
                        validScores++;
                    }
                }
            });
            
            // Only include countries with data for all selected variables
            if (validScores === selectedBoxes.length) {
                return {
                    country: country['Country Name'],
                    id: country.id,
                    countryData: country,
                    indexScore: weightedSum / totalWeight,
                    componentScores: scores,
                    gdpPerCapita: country['GDP per Capita'],
                    hdi: country['HDI']
                };
            }
            return null;
        }).filter(score => score !== null);
        
        // Sort countries by index score
        countryScores.sort((a, b) => b.indexScore - a.indexScore);
        
        // Show download button and results
        $('#download-section').show();
        $('#results').show();
        
        // Update map with scores
        updateMap(countryScores);
        
        // Update results table
        const tbody = $('#results-table tbody');
        tbody.empty();
        
        // Sort countries by GDP and HDI for rankings
        const gdpOrder = [...countryScores].sort((a, b) => b.gdpPerCapita - a.gdpPerCapita);
        const hdiOrder = [...countryScores].sort((a, b) => b.hdi - a.hdi);
        
        countryScores.forEach((score, index) => {
            const componentScores = Object.entries(score.componentScores)
                .map(([variable, value]) => `${variable}: ${value.toFixed(3)}`)
                .join(', ');
            
            const gdpRank = gdpOrder.findIndex(s => s.id === score.id) + 1;
            const hdiRank = hdiOrder.findIndex(s => s.id === score.id) + 1;
            
            tbody.append(`
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${index + 1}. ${score.country}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${score.indexScore.toFixed(3)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${gdpRank}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${hdiRank}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                        ${componentScores}
                    </td>
                </tr>
            `);
        });
        
        map.invalidateSize();
    });

    // Add download button handler
    $('#download-btn').click(function() {
        if (!countryScores || !countryScores.length) {
            alert('Please calculate your index first before downloading.');
            return;
        }

        const indexName = prompt('Please enter a name for your development index:');
        if (!indexName) return;
        
        // Create CSV content
        let csvContent = 'Country,Index Score\n';
        countryScores.forEach(score => {
            // Escape country names that contain commas by wrapping in quotes
            const escapedCountry = score.country.includes(',') ? `"${score.country}"` : score.country;
            csvContent += `${escapedCountry},${score.indexScore.toFixed(3)}\n`;
        });
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${indexName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rankings.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Add start over button handler
    $('#start-over-btn').click(function() {
        // Clear selected variables
        $('.variable-box').removeClass('selected bg-blue-100');
        $('.weight-input').addClass('hidden');
        
        // Hide results
        $('#download-section').hide();
        $('#results').hide();
        
        // Clear the map
        if (geojson) {
            map.removeLayer(geojson);
        }
        if (legend) {
            map.removeControl(legend);
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

function updateWeights() {
    const selectedBoxes = $('.variable-box.selected');
    const totalInputs = selectedBoxes.length;
    if (totalInputs > 0) {
        const equalWeight = (100 / totalInputs).toFixed(1);
        selectedBoxes.find('input').val(equalWeight);
    }
}

// Helper function to get variable descriptions
function getVariableDescription(variable) {
    const descriptions = {
        'GDP per Capita': 'Total economic output divided by population, measuring average economic prosperity.',
        'HDI': 'Composite measure of health, education, and income dimensions of development.',
        'Gini Index': 'Measures income inequality from 0 (perfect equality) to 100 (perfect inequality).',
        'Unemployment Rate': 'Percentage of labor force that is without work but available and seeking employment.',
        'Life expectancy at Birth': 'Average number of years a newborn is expected to live.',
        'Infant Mortality rate per 1000': 'Number of infants dying before reaching age one per 1,000 live births.',
        'Current Health Expenditure (% of GDP)': 'Total health spending as a percentage of GDP.',
        'School enrollment tertiary': 'Percentage of the population enrolled in higher education.',
        'Government expenditure on education total (% of GDP)': 'Public spending on education as a percentage of GDP.',
        'Carbon dioxide (CO2) emissions': 'Total CO2 emissions from burning fossil fuels and manufacturing per capita.',
        'Renewable energy consumption': 'Share of renewable sources in the total energy consumption.',
        'PM2.5 air pollution': 'Average annual exposure to fine particulate matter of 2.5 micrometers or less.',
        'Forest area': 'Land spanning more than 0.5 hectares with trees higher than 5 meters.',
        'Control of Corruption': 'Perceptions of corruption in public power for private gain. (Higher is better - indicates stronger control over corruption)',
        'Government Effectiveness': 'Quality of public services, civil service, and policy implementation. (Higher is better - indicates more effective governance)',
        'Voice and Accountability': 'Citizens\' ability to participate in selecting their government and freedom of expression. (Higher is better - indicates stronger democratic processes)',
        'Political Stability': 'Likelihood of political instability or politically-motivated violence. (Higher is better - indicates greater stability and less violence)',
        'Individuals using the Internet': 'Percentage of population with internet access.',
        'High-technology exports': 'Exports of products with high R&D intensity as a percentage of manufactured exports.',
        'Patent applications': 'Number of patent applications filed by residents and non-residents.',
        'Access to electricity': 'Percentage of population with access to electricity.',
        'People using safely managed drinking water services': 'Percentage of population using improved water sources.',
        'Fixed broadband subscriptions per 100 people': 'Number of fixed broadband subscriptions per 100 people.',
        'Terrestrial and marine protected areas': 'Percentage of total territorial area that is protected.',
        'Physicians per 1000 people': 'Number of medical doctors per 1,000 people.',
        'Prevalence of undernourishment': 'Percentage of population whose food intake is insufficient'
    };
    return descriptions[variable] || 'Description not available';
}
