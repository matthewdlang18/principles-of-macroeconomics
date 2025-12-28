class IndexTableVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Table container not found:', containerId);
            return;
        }
        
        this.initialize();
    }
    
    initialize() {
        // Create table structure
        this.container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Index Score</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="${this.container.id}-body">
                        <tr>
                            <td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">
                                Select variables to see country rankings
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    updateTable(countries) {
        const tbody = document.getElementById(`${this.container.id}-body`);
        if (!tbody) return;
        
        if (!countries || countries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="px-6 py-4 text-sm text-gray-500 text-center">
                        No data available
                    </td>
                </tr>
            `;
            return;
        }
        
        // Generate table rows
        tbody.innerHTML = countries.map(country => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${country.rank}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${country.name}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${country.indexValue.toFixed(3)}
                </td>
            </tr>
        `).join('');
    }
}

// Export the class
window.IndexTableVisualizer = IndexTableVisualizer;
