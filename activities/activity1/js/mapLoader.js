// mapLoader.js
// Handles loading and managing the map data

let map;
let geojsonLayer;
let statesData = null;

// Function to load GeoJSON data
async function loadGeoJsonData() {
    try {
        const response = await fetch('data/us-states.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        statesData = await response.json();
        return statesData;
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
        throw error;
    }
}

// Function to initialize the map
async function initializeMap() {
    try {
        // Load GeoJSON data first
        await loadGeoJsonData();
        
        // Initialize the map
        map = L.map('mapContainer').setView([37.8, -96], 4);
        
        // Add the tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Create the GeoJSON layer
        geojsonLayer = L.geoJson(statesData, {
            style: function(feature) {
                return {
                    fillColor: '#ccc',
                    weight: 2,
                    opacity: 1,
                    color: '#666',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: function(feature, layer) {
                // Get state name from GeoJSON
                const stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE_NAME;
                if (stateName) {
                    layer.bindPopup(stateName);
                    layer.on({
                        mouseover: function(e) {
                            const layer = e.target;
                            layer.setStyle({
                                fillOpacity: 0.9
                            });
                        },
                        mouseout: function(e) {
                            geojsonLayer.resetStyle(e.target);
                        }
                    });
                }
            }
        }).addTo(map);

        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        throw error;
    }
}

// Function to update the map with new data
function updateMap(data, viewType) {
    if (!statesData) return;
    
    // Clear existing GeoJSON layer
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    
    // Create the GeoJSON layer with new data
    geojsonLayer = L.geoJson(statesData, {
        style: function(feature) {
            // Get state name from GeoJSON
            const stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE_NAME;
            
            // Try to find the value for this state
            let value = data[stateName];
            
            // If not found, try with normalized name
            if (value === undefined) {
                value = data[normalizeStateName(stateName)];
            }
            
            return {
                fillColor: value !== undefined ? getColor(value) : '#cccccc',
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            // Get state name from GeoJSON
            const stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE_NAME;
            
            // Try to find the value for this state
            let value = data[stateName];
            
            // If not found, try with normalized name
            if (value === undefined) {
                value = data[normalizeStateName(stateName)];
            }
            
            // Add properties to the layer for the info box
            layer.properties = {
                name: stateName,
                value: value,
                viewType: viewType
            };
            
            // Add hover events
            layer.on({
                mouseover: function(e) {
                    const layer = e.target;
                    layer.setStyle({
                        weight: 2,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.9
                    });
                    
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        layer.bringToFront();
                    }
                    
                    info.update(layer.properties);
                },
                mouseout: function(e) {
                    geojsonLayer.resetStyle(e.target);
                    info.update();
                }
            });
        }
    }).addTo(map);
}

// Function to update the map with comparison data
function updateComparisonMap(data) {
    if (!statesData) return;
    
    // Clear existing GeoJSON layer
    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
    }
    
    // Create the GeoJSON layer for comparison
    geojsonLayer = L.geoJson(statesData, {
        style: function(feature) {
            // Get state name from GeoJSON
            const stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE_NAME;
            
            // Try to find data for this state
            const normalizedName = normalizeStateName(stateName);
            const stateData = data[normalizedName];
            
            // Determine color based on difference
            let fillColor = '#cccccc';
            if (stateData && stateData.difference !== null) {
                fillColor = getDifferenceColor(stateData.difference);
            }
            
            return {
                fillColor: fillColor,
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        },
        onEachFeature: function(feature, layer) {
            // Get state name from GeoJSON
            const stateName = feature.properties.name || feature.properties.NAME || feature.properties.STATE_NAME;
            
            // Try to find data for this state
            const normalizedName = normalizeStateName(stateName);
            const stateData = data[normalizedName];
            
            // Add properties for the info box
            layer.properties = {
                name: stateName,
                studentValue: stateData ? stateData.studentValue : null,
                aiValue: stateData ? stateData.aiValue : null,
                difference: stateData ? stateData.difference : null,
                viewType: 'comparison'
            };
            
            // Add hover events
            layer.on({
                mouseover: function(e) {
                    const layer = e.target;
                    layer.setStyle({
                        weight: 2,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.9
                    });
                    
                    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                        layer.bringToFront();
                    }
                    
                    info.update(layer.properties);
                },
                mouseout: function(e) {
                    geojsonLayer.resetStyle(e.target);
                    info.update();
                }
            });
            
            // Add marker for significant differences
            if (stateData && stateData.difference !== null && Math.abs(stateData.difference) > 10) {
                const center = layer.getBounds().getCenter();
                
                // Create icon to show direction of difference
                const isDifferencePositive = stateData.difference > 0;
                const iconHtml = `
                    <div style="width:24px; height:24px; 
                         background:white; border-radius:12px; 
                         text-align:center; line-height:24px; 
                         box-shadow:0 0 5px rgba(0,0,0,0.3);">
                        ${isDifferencePositive ? '▲' : '▼'}
                    </div>`;
                
                const icon = L.divIcon({
                    html: iconHtml,
                    className: '',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                
                // Add the indicator marker
                L.marker(center, {icon: icon}).addTo(map);
            }
        }
    }).addTo(map);
}

// Helper function to normalize state names
function normalizeStateName(name) {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Helper function to get color based on value
function getColor(value) {
    if (value === undefined || value === null) return '#cccccc';
    
    if (value <= 15) return '#1E3F66'; // Strong blue
    if (value <= 25) return '#2B6EBF'; // Medium blue
    if (value <= 35) return '#85C1E9'; // Light blue
    if (value <= 45) return '#ABEBC6'; // Light green
    if (value <= 55) return '#239B56'; // Dark green
    if (value <= 65) return '#F7DC6F'; // Yellow
    if (value <= 75) return '#F39C12'; // Orange
    if (value <= 85) return '#E74C3C'; // Red
    return '#8B0000'; // Dark red
}

// Helper function to get color based on difference
function getDifferenceColor(diff) {
    if (diff === null) return '#cccccc';
    
    // Use a diverging color scale: blue for student higher, red for AI higher
    if (diff > 15) return '#1E3F66'; // Strong blue - student much higher
    if (diff > 10) return '#3498DB'; // Medium blue - student moderately higher
    if (diff > 5) return '#85C1E9';  // Light blue - student slightly higher
    if (diff > -5) return '#ABEBC6'; // Green - similar values
    if (diff > -10) return '#F5B041'; // Light orange - AI slightly higher
    if (diff > -15) return '#E67E22'; // Medium orange - AI moderately higher
    return '#C0392B'; // Red - AI much higher
}

// Function to get the map instance
function getMap() {
    return map;
}

// Export functions
window.mapLoader = {
    initializeMap,
    updateMap,
    updateComparisonMap,
    getMap
}; 