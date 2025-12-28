// Sections Cache for Economics Games
// This script provides caching for TA sections data to improve performance

// Initialize the cache
const SectionsCache = {
    // Cache data
    sections: null,
    lastFetched: null,
    cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    
    // Initialize the cache
    init: function() {
        console.log('Initializing sections cache');
        // Try to load from localStorage
        try {
            const cachedData = localStorage.getItem('sections-cache');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                this.sections = parsedData.sections;
                this.lastFetched = parsedData.lastFetched;
                
                console.log(`Loaded ${this.sections.length} sections from cache, last fetched: ${new Date(this.lastFetched).toLocaleString()}`);
            }
        } catch (error) {
            console.error('Error loading sections cache:', error);
        }
    },
    
    // Get all sections (from cache if available, otherwise fetch from Firebase)
    getAllSections: async function(forceRefresh = false) {
        // Check if cache is valid
        const now = Date.now();
        const cacheValid = this.sections && this.lastFetched && (now - this.lastFetched < this.cacheExpiry);
        
        if (cacheValid && !forceRefresh) {
            console.log('Using cached sections data');
            return { success: true, data: this.sections };
        }
        
        // Cache is invalid or force refresh, fetch from Firebase
        console.log('Fetching sections from Firebase');
        try {
            // Check if Service is available
            if (typeof window.Service === 'undefined' || typeof window.Service.getAllSections !== 'function') {
                console.error('Service.getAllSections not available');
                return { success: false, error: 'Service not available' };
            }
            
            // Fetch from Firebase
            const result = await window.Service.getAllSections();
            
            if (result.success) {
                // Update cache
                this.sections = result.data;
                this.lastFetched = now;
                
                // Save to localStorage
                localStorage.setItem('sections-cache', JSON.stringify({
                    sections: this.sections,
                    lastFetched: this.lastFetched
                }));
                
                console.log(`Fetched ${this.sections.length} sections from Firebase and updated cache`);
                return result;
            } else {
                console.error('Failed to fetch sections from Firebase:', result.error);
                return result;
            }
        } catch (error) {
            console.error('Error fetching sections from Firebase:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get a specific section by ID
    getSection: async function(sectionId) {
        // Try to get from cache first
        if (this.sections) {
            const section = this.sections.find(s => s.id === sectionId);
            if (section) {
                console.log('Found section in cache:', section);
                return { success: true, data: section };
            }
        }
        
        // Not in cache, fetch from Firebase
        console.log('Section not in cache, fetching from Firebase');
        try {
            // Check if Service is available
            if (typeof window.Service === 'undefined' || typeof window.Service.getSection !== 'function') {
                console.error('Service.getSection not available');
                return { success: false, error: 'Service not available' };
            }
            
            // Fetch from Firebase
            return await window.Service.getSection(sectionId);
        } catch (error) {
            console.error('Error fetching section from Firebase:', error);
            return { success: false, error: error.message };
        }
    }
};

// Initialize the cache when the script loads
document.addEventListener('DOMContentLoaded', function() {
    SectionsCache.init();
    
    // Make SectionsCache available globally
    window.SectionsCache = SectionsCache;
    
    console.log('Sections cache initialized and ready');
});
