class IndexManager {
    constructor() {
        this.selectedVariables = new Map();
        this.countryData = null;
        this.mapVisualizer = null;
        this.tableVisualizer = null;
        
        // Initialize everything
        this.init();
    }
    
    async init() {
        try {
            // Load data
            this.countryData = await this.loadData();
            
            // Initialize visualizations
            this.initializeVisualizations();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Index Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing Index Manager:', error);
        }
    }
    
    async loadData() {
        try {
            const response = await fetch('data/country_data.json');
            if (!response.ok) throw new Error('Failed to fetch country data');
            return await response.json();
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }
    
    initializeVisualizations() {
        // Initialize map visualization
        const mapContainer = document.getElementById('index-map');
        if (mapContainer) {
            this.mapVisualizer = new MapVisualizer('index-map');
        }
        
        // Initialize table visualization
        this.tableVisualizer = new IndexTableVisualizer('index-table');
    }
    
    setupEventListeners() {
        // Remove old event listeners by cloning and replacing
        const container = document.querySelector('.variable-option')?.parentElement;
        if (container) {
            const clone = container.cloneNode(true);
            container.parentNode.replaceChild(clone, container);
        }
        
        // Add variable selection listeners
        document.querySelectorAll('.variable-option').forEach(option => {
            option.addEventListener('click', () => {
                const id = option.dataset.id;
                const category = option.dataset.category;
                const name = option.dataset.name;
                const description = option.dataset.description;
                
                if (this.selectedVariables.has(id)) {
                    this.removeVariable(id);
                    option.classList.remove('selected');
                } else if (this.selectedVariables.size < 7) {
                    this.addVariable(id, category, name, description);
                    option.classList.add('selected');
                } else {
                    this.showMaxVariablesWarning();
                }
            });
        });
    }
    
    addVariable(id, category, name, description) {
        if (this.selectedVariables.size >= 7) return;
        
        this.selectedVariables.set(id, {
            category,
            name,
            description,
            weight: 1
        });
        
        this.createVariableWeightInput(id, name);
        this.updateWeightWarning();
        this.updateIndex();
    }
    
    removeVariable(id) {
        this.selectedVariables.delete(id);
        
        const container = document.getElementById('selected-variables-container');
        const weightInput = container?.querySelector(`div[data-id="${id}"]`);
        if (weightInput) {
            weightInput.remove();
        }
        
        this.updateNoVariablesMessage();
        this.updateWeightWarning();
        this.updateIndex();
    }
    
    createVariableWeightInput(id, name) {
        const container = document.getElementById('selected-variables-container');
        const noVarsMessage = document.getElementById('no-variables-message');
        
        if (container && noVarsMessage) {
            noVarsMessage.classList.add('hidden');
            container.classList.remove('hidden');
            
            const weightInput = document.createElement('div');
            weightInput.dataset.id = id;
            weightInput.className = 'mb-4 p-4 bg-gray-50 rounded-lg';
            weightInput.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <label class="font-medium text-gray-700">${name}</label>
                    <button class="text-red-600 hover:text-red-800" onclick="window.indexManager.removeVariable('${id}')">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center gap-4">
                    <input type="range" min="0" max="100" value="100" 
                           class="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                           oninput="this.nextElementSibling.value = this.value">
                    <input type="number" value="100" min="0" max="100" 
                           class="w-16 px-2 py-1 text-sm border rounded"
                           oninput="this.previousElementSibling.value = this.value">
                </div>
            `;
            
            const rangeInput = weightInput.querySelector('input[type="range"]');
            const numberInput = weightInput.querySelector('input[type="number"]');
            
            const updateWeight = (value) => {
                const variable = this.selectedVariables.get(id);
                if (variable) {
                    variable.weight = parseInt(value) / 100;
                    this.updateIndex();
                }
            };
            
            rangeInput.addEventListener('input', (e) => updateWeight(e.target.value));
            numberInput.addEventListener('input', (e) => updateWeight(e.target.value));
            
            container.appendChild(weightInput);
        }
    }
    
    updateNoVariablesMessage() {
        const noVarsMessage = document.getElementById('no-variables-message');
        const container = document.getElementById('selected-variables-container');
        
        if (this.selectedVariables.size === 0) {
            if (noVarsMessage) noVarsMessage.classList.remove('hidden');
            if (container) container.classList.add('hidden');
        }
    }
    
    showMaxVariablesWarning() {
        const warning = document.getElementById('weight-warning');
        if (warning) {
            warning.classList.remove('hidden');
            warning.innerHTML = `
                <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Maximum of 7 variables allowed. Remove a variable to add another.
            `;
            setTimeout(() => warning.classList.add('hidden'), 3000);
        }
    }
    
    updateWeightWarning() {
        const nextButton = document.getElementById('next-to-compare');
        if (nextButton) {
            nextButton.disabled = this.selectedVariables.size === 0;
        }
    }
    
    updateIndex() {
        if (this.selectedVariables.size === 0 || !this.countryData) return;
        
        // Calculate index scores for each country
        const indexedCountries = this.countryData.map(country => {
            let weightedSum = 0;
            let totalWeight = 0;
            
            // Calculate weighted sum of z-scores
            for (const [id, variable] of this.selectedVariables) {
                if (country.zScores && country.zScores[id] !== undefined) {
                    weightedSum += country.zScores[id] * variable.weight;
                    totalWeight += Math.abs(variable.weight);
                }
            }
            
            // Calculate final index value
            const indexValue = totalWeight > 0 ? weightedSum / totalWeight : null;
            
            return {
                name: country.name,
                code: country.code,
                indexValue: indexValue !== null ? Number(indexValue.toFixed(3)) : null,
                rank: null
            };
        });
        
        // Filter out countries with null values and sort by index value
        const validCountries = indexedCountries
            .filter(c => c.indexValue !== null)
            .sort((a, b) => b.indexValue - a.indexValue);
        
        // Assign ranks
        validCountries.forEach((country, index) => {
            country.rank = index + 1;
        });
        
        // Update visualizations
        if (this.mapVisualizer) {
            this.mapVisualizer.updateMap(validCountries);
        }
        
        if (this.tableVisualizer) {
            this.tableVisualizer.updateTable(validCountries);
        }
    }
}

// Export the class
window.IndexManager = IndexManager;

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.indexManager = new IndexManager();
});
