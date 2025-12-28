class IndexMapVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Map container not found:', containerId);
            return;
        }
        
        // Set dimensions
        this.width = this.container.offsetWidth;
        this.height = Math.max(300, Math.min(500, this.width * 0.6));
        
        // Initialize map components
        this.initialize();
        
        // Load world map data
        this.loadMapData();
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    async loadMapData() {
        try {
            const response = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
            if (!response.ok) throw new Error('Failed to fetch map data');
            
            const topology = await response.json();
            this.worldData = topojson.feature(topology, topology.objects.countries);
            
            // Create map path
            this.updateMap([]);
        } catch (error) {
            console.error('Error loading map data:', error);
        }
    }
    
    initialize() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create SVG
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', '#f8fafc');
        
        // Create map group
        this.mapGroup = this.svg.append('g');
        
        // Create tooltip
        this.tooltip = d3.select(this.container)
            .append('div')
            .attr('class', 'absolute hidden bg-white p-2 rounded shadow-lg text-sm')
            .style('pointer-events', 'none');
        
        // Create color legend
        this.createLegend();
        
        // Setup projection
        this.projection = d3.geoMercator()
            .scale((this.width + 1) / 2 / Math.PI)
            .translate([this.width / 2, this.height / 1.5]);
        
        this.path = d3.geoPath().projection(this.projection);
    }
    
    createLegend() {
        const legendWidth = 200;
        const legendHeight = 10;
        const margin = { top: 20, right: 20 };
        
        // Create legend group
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - legendWidth - margin.right}, ${margin.top})`);
        
        // Create gradient
        const gradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');
        
        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#fee2e2');
            
        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', '#ef4444');
            
        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#7f1d1d');
        
        // Create legend rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)');
        
        // Create legend scale
        this.legendScale = d3.scaleLinear()
            .range([0, legendWidth]);
        
        this.legendAxis = d3.axisBottom(this.legendScale)
            .ticks(5)
            .tickSize(5);
        
        // Add legend axis
        legend.append('g')
            .attr('class', 'legend-axis')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(this.legendAxis)
            .selectAll('text')
            .style('font-size', '10px');
    }
    
    updateMap(countries) {
        if (!this.worldData) return;
        
        // Create color scale
        const colorScale = d3.scaleSequential(d3.interpolateReds)
            .domain(d3.extent(countries, d => d.indexValue));
        
        // Update legend scale
        if (countries.length > 0) {
            this.legendScale.domain(d3.extent(countries, d => d.indexValue));
            this.svg.select('.legend-axis').call(this.legendAxis);
        }
        
        // Create lookup for country data
        const countryData = new Map(countries.map(d => [d.code, d]));
        
        // Draw map
        const paths = this.mapGroup.selectAll('path')
            .data(this.worldData.features);
        
        // Enter
        paths.enter()
            .append('path')
            .merge(paths)
            .attr('d', this.path)
            .attr('fill', d => {
                const country = countryData.get(d.id);
                return country ? colorScale(country.indexValue) : '#e5e7eb';
            })
            .attr('stroke', '#d1d5db')
            .attr('stroke-width', 0.5)
            .on('mouseover', (event, d) => {
                const country = countryData.get(d.id);
                if (country) {
                    this.tooltip
                        .html(`
                            <div class="font-medium">${country.name}</div>
                            <div>Rank: ${country.rank}</div>
                            <div>Score: ${country.indexValue.toFixed(3)}</div>
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px')
                        .classed('hidden', false);
                }
            })
            .on('mouseout', () => {
                this.tooltip.classed('hidden', true);
            });
        
        // Exit
        paths.exit().remove();
    }
    
    handleResize() {
        // Update dimensions
        this.width = this.container.offsetWidth;
        this.height = Math.max(300, Math.min(500, this.width * 0.6));
        
        // Update SVG size
        this.svg
            .attr('width', this.width)
            .attr('height', this.height);
        
        // Update projection
        this.projection
            .scale((this.width + 1) / 2 / Math.PI)
            .translate([this.width / 2, this.height / 1.5]);
        
        // Update path generator
        this.path = d3.geoPath().projection(this.projection);
        
        // Redraw map
        this.mapGroup.selectAll('path')
            .attr('d', this.path);
    }
}

// Export the class
window.IndexMapVisualizer = IndexMapVisualizer;
