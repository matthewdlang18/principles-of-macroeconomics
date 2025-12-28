// Data loading and processing functions for the index creation step
class IndexDataLoader {
    static async loadAllData() {
        try {
            console.log('Starting data load for index creation...');
            
            // Load GeoJSON
            const geoJsonResponse = await fetch('./data/countries.geo.json');
            if (!geoJsonResponse.ok) {
                throw new Error(`GeoJSON HTTP error! status: ${geoJsonResponse.status}`);
            }
            const geoData = await geoJsonResponse.json();
            console.log('GeoJSON loaded successfully');

            // Load country averages CSV
            const csvResponse = await fetch('./data/country_averages.csv');
            if (!csvResponse.ok) {
                throw new Error(`CSV HTTP error! status: ${csvResponse.status}`);
            }
            const csvText = await csvResponse.text();
            
            // Parse CSV data using Papa Parse
            const rows = Papa.parse(csvText, {
                header: false,
                skipEmptyLines: true
            }).data;
            
            if (!rows || rows.length < 2) {
                throw new Error('CSV file is empty or missing data');
            }

            // Get header row
            const headers = rows[0];
            
            // Process data rows and calculate z-scores
            const countryData = [];
            const numericData = {};
            
            // Initialize arrays for numeric columns
            headers.forEach(header => {
                if (header !== 'Country Name' && header !== 'id') {
                    numericData[header] = [];
                }
            });
            
            // Collect numeric data for z-score calculation
            rows.slice(1).forEach(row => {
                headers.forEach((header, index) => {
                    if (header !== 'Country Name' && header !== 'id') {
                        const value = row[index].trim();
                        if (value) {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                                numericData[header].push(numValue);
                            }
                        }
                    }
                });
            });
            
            // Calculate means and standard deviations
            const stats = {};
            Object.keys(numericData).forEach(header => {
                const values = numericData[header];
                if (values.length > 0) {
                    const mean = values.reduce((a, b) => a + b) / values.length;
                    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
                    const stdDev = Math.sqrt(variance);
                    stats[header] = { mean, stdDev };
                }
            });
            
            // Process each country's data
            rows.slice(1).forEach(row => {
                if (row.length === headers.length) {
                    const country = {
                        name: row[headers.indexOf('Country Name')],
                        code: row[headers.indexOf('id')],
                        indexValue: null,
                        rank: null
                    };
                    
                    // Add both raw values and z-scores for each variable
                    headers.forEach((header, index) => {
                        if (header !== 'Country Name' && header !== 'id') {
                            const value = row[index].trim();
                            const rawValue = value ? parseFloat(value) : null;
                            country[header] = rawValue;
                            
                            // Calculate z-score if we have valid data
                            if (rawValue !== null && stats[header]) {
                                const { mean, stdDev } = stats[header];
                                country[header + '_zscore'] = stdDev !== 0 ? (rawValue - mean) / stdDev : 0;
                            } else {
                                country[header + '_zscore'] = null;
                            }
                        }
                    });
                    
                    countryData.push(country);
                }
            });
            
            console.log('Data processed successfully:', countryData.length, 'countries');
            return { geoData, countryData };
            
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
}

// Export the class
window.IndexDataLoader = IndexDataLoader;
