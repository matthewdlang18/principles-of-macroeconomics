// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize the application
    await initializeApplication();
    
    // Set up step navigation
    setupStepNavigation();
});

async function initializeApplication() {
    try {
        // Load data
        const data = await DataLoader.loadAllData();
        
        if (!data || !data.geoData || !data.excelData || !data.excelData.countries) {
            throw new Error('Invalid data structure received');
        }
        
        // Initialize map with the loaded data
        const mapVisualizer = new MapVisualizer('map-container');
        await new Promise(resolve => setTimeout(resolve, 0)); // Ensure DOM is ready
        mapVisualizer.initialize();
        mapVisualizer.drawMap(data.geoData, data.excelData.countries);
        
        // Set up map type changes
        setupMapTypeChanges(mapVisualizer, data);
        
        // Initialize rankings table
        initializeRankingsTable(data.excelData.countries);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded';
        errorDiv.innerHTML = 'Error loading data. Please try refreshing the page.';
        document.getElementById('map-container').appendChild(errorDiv);
    }
}

function setupMapTypeChanges(mapVisualizer, data) {
    const gdpButton = document.getElementById('show-gdp');
    const hdiButton = document.getElementById('show-hdi');
    
    if (gdpButton) {
        gdpButton.addEventListener('click', function() {
            gdpButton.classList.add('bg-blue-600', 'text-white');
            gdpButton.classList.remove('bg-gray-200', 'text-gray-800');
            hdiButton.classList.add('bg-gray-200', 'text-gray-800');
            hdiButton.classList.remove('bg-blue-600', 'text-white');
            mapVisualizer.drawMap(data.geoData, data.excelData.countries, 'gdp');
        });
    }
    
    if (hdiButton) {
        hdiButton.addEventListener('click', function() {
            hdiButton.classList.add('bg-blue-600', 'text-white');
            hdiButton.classList.remove('bg-gray-200', 'text-gray-800');
            gdpButton.classList.add('bg-gray-200', 'text-gray-800');
            gdpButton.classList.remove('bg-blue-600', 'text-white');
            mapVisualizer.drawMap(data.geoData, data.excelData.countries, 'hdi');
        });
    }
}

function formatCurrency(number) {
    if (number === null || number === undefined || isNaN(number)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(number);
}

function initializeRankingsTable(countries) {
    if (!countries || !Array.isArray(countries)) {
        console.error('Invalid countries data');
        return;
    }

    const tableBody = document.querySelector('#rankings-table tbody');
    const tableHeaders = document.querySelectorAll('#rankings-table th');
    
    if (!tableBody || !tableHeaders) {
        console.error('Rankings table elements not found');
        return;
    }

    // Add sorting functionality to headers
    tableHeaders.forEach(header => {
        const sortKey = header.dataset.sort;
        if (!sortKey) return;
        
        header.style.cursor = 'pointer';
        header.addEventListener('click', () => sortTable(countries, sortKey));
        
        // Add sort direction indicator
        const indicator = document.createElement('span');
        indicator.className = 'ml-1 text-gray-400';
        indicator.textContent = '↕';
        header.appendChild(indicator);
    });

    // Initial sort by GDP per capita (descending)
    sortTable(countries, 'gdpPerCapita');
}

function sortTable(countries, sortKey) {
    const tableBody = document.querySelector('#rankings-table tbody');
    const headers = document.querySelectorAll('#rankings-table th');
    
    // Update header indicators
    headers.forEach(header => {
        const indicator = header.querySelector('span');
        if (indicator) {
            if (header.dataset.sort === sortKey) {
                const currentDirection = header.dataset.direction || 'desc';
                indicator.textContent = currentDirection === 'desc' ? '↓' : '↑';
                header.dataset.direction = currentDirection === 'desc' ? 'asc' : 'desc';
            } else {
                indicator.textContent = '↕';
                delete header.dataset.direction;
            }
        }
    });

    // Get current sort direction
    const header = Array.from(headers).find(h => h.dataset.sort === sortKey);
    const direction = header?.dataset.direction || 'desc';

    // Sort countries
    const sortedCountries = [...countries].sort((a, b) => {
        let aValue = a[sortKey];
        let bValue = b[sortKey];
        
        // Handle string comparison for names
        if (sortKey === 'name') {
            return direction === 'asc' 
                ? (aValue || '').localeCompare(bValue || '')
                : (bValue || '').localeCompare(aValue || '');
        }
        
        // Handle missing values
        if (aValue === undefined || aValue === null) aValue = direction === 'asc' ? Infinity : -Infinity;
        if (bValue === undefined || bValue === null) bValue = direction === 'asc' ? Infinity : -Infinity;
        
        // Sort numerically
        return direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
    });

    // Create color scales for GDP and HDI
    const gdpValues = countries
        .map(d => d.gdpPerCapita)
        .filter(v => v != null && !isNaN(v))
        .sort((a, b) => a - b);
    
    const hdiValues = countries
        .map(d => d.hdiValue)
        .filter(v => v != null && !isNaN(v))
        .sort((a, b) => a - b);
    
    const gdpQuantiles = [0, 0.2, 0.4, 0.6, 0.8, 1].map(q => 
        d3.quantile(gdpValues, q)
    );
    
    const hdiQuantiles = [0, 0.2, 0.4, 0.6, 0.8, 1].map(q => 
        d3.quantile(hdiValues, q)
    );
    
    const gdpColorScale = d3.scaleQuantile()
        .domain(gdpQuantiles)
        .range(['#fee5d9', '#fcae91', '#fb6a4a', '#addd8e', '#78c679', '#31a354']);
    
    const hdiColorScale = d3.scaleQuantile()
        .domain(hdiQuantiles)
        .range(['#fee5d9', '#fcae91', '#fb6a4a', '#addd8e', '#78c679', '#31a354']);

    // Update table
    tableBody.innerHTML = '';
    sortedCountries.forEach(country => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        // Add highlighting class for rank differences
        if (country.difference && Math.abs(country.difference) >= 5) {
            row.classList.add(country.difference > 0 ? 'bg-green-50' : 'bg-red-50');
        }
        
        // Create cells
        const nameCell = document.createElement('td');
        nameCell.textContent = country.name || 'Unknown';
        nameCell.className = 'px-4 py-2';
        
        const gdpPerCapitaCell = document.createElement('td');
        gdpPerCapitaCell.textContent = formatCurrency(country.gdpPerCapita);
        gdpPerCapitaCell.className = 'px-4 py-2 text-right';
        // Add background color based on GDP value
        if (country.gdpPerCapita != null && !isNaN(country.gdpPerCapita)) {
            gdpPerCapitaCell.style.backgroundColor = gdpColorScale(country.gdpPerCapita);
            // Add text color contrast for better readability
            gdpPerCapitaCell.style.color = getContrastColor(gdpColorScale(country.gdpPerCapita));
        }
        
        const gdpCell = document.createElement('td');
        gdpCell.textContent = country.gdpRank || 'N/A';
        gdpCell.className = 'px-4 py-2 text-center';
        
        const hdiValueCell = document.createElement('td');
        hdiValueCell.textContent = country.hdiValue ? country.hdiValue.toFixed(3) : 'N/A';
        hdiValueCell.className = 'px-4 py-2 text-right';
        // Add background color based on HDI value
        if (country.hdiValue != null && !isNaN(country.hdiValue)) {
            hdiValueCell.style.backgroundColor = hdiColorScale(country.hdiValue);
            // Add text color contrast for better readability
            hdiValueCell.style.color = getContrastColor(hdiColorScale(country.hdiValue));
        }
        
        const hdiRankCell = document.createElement('td');
        hdiRankCell.textContent = country.hdiRank || 'N/A';
        hdiRankCell.className = 'px-4 py-2 text-center';
        
        // Add cells to the row
        row.appendChild(nameCell);
        row.appendChild(gdpPerCapitaCell);
        row.appendChild(gdpCell);
        row.appendChild(hdiValueCell);
        row.appendChild(hdiRankCell);
        
        // Add the row to the table
        tableBody.appendChild(row);
    });
}

// Helper function to determine text color based on background color
function getContrastColor(backgroundColor) {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

function setupStepNavigation() {
    const stepButtons = document.querySelectorAll('.step-nav');
    const stepContents = document.querySelectorAll('.step-content');
    
    stepButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active state from all buttons
            stepButtons.forEach(b => {
                b.classList.remove('border-blue-600', 'text-blue-600');
                b.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Add active state to clicked button
            button.classList.remove('border-transparent', 'text-gray-500');
            button.classList.add('border-blue-600', 'text-blue-600');
            
            // Hide all step contents
            stepContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show selected step content
            const stepId = button.id.replace('nav-', 'step-');
            document.getElementById(stepId).classList.remove('hidden');
        });
    });
    
    // Make sure the second step is hidden by default
    // This ensures "Explore Measures" step is hidden initially
    document.getElementById('step-explore').classList.add('hidden');
}
