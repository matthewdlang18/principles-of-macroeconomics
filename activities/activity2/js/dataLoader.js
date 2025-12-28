// Data loading and processing functions
class DataLoader {
    static async loadAllData() {
        try {
            console.log('Starting data load...');
            
            // Load GeoJSON
            const geoJsonResponse = await fetch('./data/countries.geo.json');
            if (!geoJsonResponse.ok) {
                throw new Error(`GeoJSON HTTP error! status: ${geoJsonResponse.status}`);
            }
            const geoData = await geoJsonResponse.json();
            console.log('GeoJSON loaded successfully');

            // Load CSV file
            const csvResponse = await fetch('./data/UNHDIGDPData.csv');
            if (!csvResponse.ok) {
                throw new Error(`CSV HTTP error! status: ${csvResponse.status}`);
            }
            const csvText = await csvResponse.text();
            
            // Debug: Show raw CSV data for first few rows
            console.log('First 5 rows of raw CSV:');
            csvText.split('\n').slice(0, 5).forEach(row => console.log(row));

            // Parse CSV data
            const rows = csvText.split('\n').map(row => {
                const cols = row.split(',');
                return cols;
            });
            
            if (!rows || rows.length < 2) {
                throw new Error('CSV file is empty or missing data');
            }

            // Convert to array of objects with strict validation
            const processedData = {
                countries: []
            };

            // Skip header row and process data
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length < 8) continue;

                const countryName = row[0]?.trim() || '';
                const countryId = row[1]?.trim().toUpperCase() || '';
                const hdi = this.parseNumber(row[2]);
                const gdpPerCapitaStr = row[7]?.trim();
                
                if (!gdpPerCapitaStr || !countryName || !countryId) continue;
                
                // Parse GDP, removing any quotes and commas
                const gdpPerCapita = this.parseNumber(gdpPerCapitaStr);
                if (isNaN(gdpPerCapita)) continue;
                
                // Debug: Log each processed country
                if (i <= 5) {
                    console.log('Processing country:', {
                        name: countryName,
                        id: countryId,
                        gdpPerCapita: gdpPerCapita,
                        hdi: hdi
                    });
                }

                processedData.countries.push({
                    id: countryId,
                    name: countryName,
                    gdpPerCapita: gdpPerCapita,
                    hdiValue: hdi
                });
            }

            // Sort countries by GDP per capita (descending)
            const gdpSorted = [...processedData.countries].sort((a, b) => {
                if (!a.gdpPerCapita && !b.gdpPerCapita) return 0;
                if (!a.gdpPerCapita) return 1;
                if (!b.gdpPerCapita) return -1;
                return b.gdpPerCapita - a.gdpPerCapita;
            });

            // Debug: Show top 5 by GDP
            console.log('\nTop 5 by GDP per capita:');
            gdpSorted.slice(0, 5).forEach((country, index) => {
                console.log(`${index + 1}. ${country.name}: ${country.gdpPerCapita} (ID: ${country.id})`);
            });

            // Assign GDP ranks
            gdpSorted.forEach((country, index) => {
                const originalCountry = processedData.countries.find(c => c.id === country.id);
                if (originalCountry) {
                    originalCountry.gdpRank = index + 1;
                }
            });

            // Sort countries by HDI (descending)
            const hdiSorted = [...processedData.countries].sort((a, b) => {
                if (!a.hdiValue && !b.hdiValue) return 0;
                if (!a.hdiValue) return 1;
                if (!b.hdiValue) return -1;
                return b.hdiValue - a.hdiValue;
            });

            // Assign HDI ranks
            hdiSorted.forEach((country, index) => {
                const originalCountry = processedData.countries.find(c => c.id === country.id);
                if (originalCountry) {
                    originalCountry.hdiRank = index + 1;
                    // Calculate rank difference (positive means HDI rank is better than GDP rank)
                    if (originalCountry.gdpRank && originalCountry.hdiRank) {
                        originalCountry.difference = originalCountry.gdpRank - originalCountry.hdiRank;
                    }
                }
            });

            // Debug: Show sample of final data
            console.log('\nSample of processed data:');
            processedData.countries.slice(0, 5).forEach(country => {
                console.log(`${country.name} (${country.id}):`, {
                    gdpPerCapita: country.gdpPerCapita,
                    gdpRank: country.gdpRank,
                    hdiValue: country.hdiValue,
                    hdiRank: country.hdiRank,
                    difference: country.difference
                });
            });

            return {
                geoData: geoData,
                excelData: processedData
            };
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    static parseNumber(value) {
        if (!value) return null;
        // Remove any quotes, commas, and spaces
        const cleanValue = value.toString().replace(/[",\s]/g, '');
        const number = parseFloat(cleanValue);
        return isNaN(number) ? null : number;
    }
}
