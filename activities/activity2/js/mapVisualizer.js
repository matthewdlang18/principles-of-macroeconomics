class MapVisualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.wrapper = document.getElementById(containerId + '-wrapper');
        
        if (!this.container) {
            console.error('Map container not found:', containerId);
            return;
        }
        
        // Debug container dimensions
        console.log('Container dimensions:', {
            clientWidth: this.container.clientWidth,
            clientHeight: this.container.clientHeight,
            offsetWidth: this.container.offsetWidth,
            offsetHeight: this.container.offsetHeight
        });

        this.width = this.container.offsetWidth || 960;
        this.height = this.wrapper ? this.wrapper.offsetHeight - 20 : 500; // Subtract height of resize handle
        this.currentType = 'gdp';
        this.geoData = null;
        this.countryData = null;
        
        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'absolute hidden bg-white p-2 rounded shadow-lg text-sm';
        this.tooltip.style.pointerEvents = 'none';
        document.body.appendChild(this.tooltip);
        
        // Add resize event listener to handle container resizing
        this.setupResizeHandling();
    }
    
    setupResizeHandling() {
        // Add resize observer to detect container size changes
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === this.wrapper) {
                    // Update dimensions and redraw map
                    this.width = this.container.offsetWidth;
                    this.height = this.wrapper.offsetHeight - 20; // Subtract height of resize handle
                    
                    if (this.width > 0 && this.height > 0 && this.geoData && this.countryData) {
                        this.drawMap(this.geoData, this.countryData, this.currentType);
                    }
                }
            }
        });
        
        if (this.wrapper) {
            resizeObserver.observe(this.wrapper);
            
            // Add manual resize handler for the resize handle
            const resizeHandle = this.wrapper.querySelector('.resize-handle');
            if (resizeHandle) {
                let startY, startHeight;
                
                const startResize = (e) => {
                    startY = e.clientY;
                    startHeight = parseInt(document.defaultView.getComputedStyle(this.wrapper).height, 10);
                    document.documentElement.addEventListener('mousemove', resize, false);
                    document.documentElement.addEventListener('mouseup', stopResize, false);
                };
                
                const resize = (e) => {
                    const newHeight = startHeight + e.clientY - startY;
                    if (newHeight >= 200 && newHeight <= 800) {
                        this.wrapper.style.height = `${newHeight}px`;
                    }
                };
                
                const stopResize = () => {
                    document.documentElement.removeEventListener('mousemove', resize, false);
                    document.documentElement.removeEventListener('mouseup', stopResize, false);
                };
                
                resizeHandle.addEventListener('mousedown', startResize, false);
            }
        }
    }
    
    initialize() {
        console.log('Initializing map with dimensions:', {
            width: this.width,
            height: this.height
        });

        // Clear container
        this.container.innerHTML = '';
        
        // Create SVG with explicit dimensions
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .style('background-color', '#f8fafc') // Light gray background
            .style('border', '1px solid #e2e8f0'); // Subtle border
            
        // Create a container group for the map and another for controls
        this.mapGroup = this.svg.append('g').attr('class', 'map-group');
        this.controlsGroup = this.svg.append('g').attr('class', 'controls-group');
            
        // Add zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => {
                this.mapGroup.attr('transform', event.transform);
            });
            
        this.svg.call(this.zoom);
        
        // Set up zoom button handlers
        const zoomIn = document.getElementById('zoom-in');
        const zoomOut = document.getElementById('zoom-out');
        
        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                this.svg.transition()
                    .duration(300)
                    .call(this.zoom.scaleBy, 1.5);
            });
        }
        
        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                this.svg.transition()
                    .duration(300)
                    .call(this.zoom.scaleBy, 0.75);
            });
        }
            
        console.log('SVG created:', this.svg.node());
    }
    
    drawMap(geoData, countryData, type = 'gdp') {
        console.log('Drawing map...');
        if (!this.svg) {
            console.error('SVG not initialized');
            return;
        }

        this.currentType = type;
        this.geoData = geoData;
        this.countryData = countryData;

        console.log('Map data:', { 
            geoFeatures: geoData.features.length,
            countryData: countryData.length,
            type: type,
            svgWidth: this.width,
            svgHeight: this.height
        });

        // Clear existing paths but keep controls
        this.mapGroup.selectAll('*').remove();
        
        // Update SVG dimensions
        this.svg.attr('width', this.width)
               .attr('height', this.height);
        
        // Create projection
        const projection = d3.geoMercator()
            .fitSize([this.width, this.height], geoData);
            
        // Create path generator
        const path = d3.geoPath().projection(projection);
        
        // Get values based on the selected type (GDP or HDI)
        let values;
        if (type === 'gdp') {
            values = countryData
                .map(d => d.gdpPerCapita)
                .filter(v => v != null && !isNaN(v))
                .sort((a, b) => a - b);
        } else {
            values = countryData
                .map(d => d.hdiValue)
                .filter(v => v != null && !isNaN(v))
                .sort((a, b) => a - b);
        }
        
        const quantiles = [0, 0.2, 0.4, 0.6, 0.8, 1].map(q => 
            d3.quantile(values, q)
        );
        
        // Create color scale from red (low) to green (high)
        const colorScale = d3.scaleQuantile()
            .domain(quantiles)
            .range(['#fee5d9', '#fcae91', '#fb6a4a', '#addd8e', '#78c679', '#31a354']);

        // Draw countries
        this.mapGroup.selectAll('path')
            .data(geoData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'country')
            .attr('fill', d => {
                const countryInfo = countryData.find(c => c.id === d.id);
                return this.getColor(countryInfo, type, colorScale);
            })
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5)
            .on('mouseover', (event, d) => {
                const countryInfo = countryData.find(c => c.id === d.id);
                if (countryInfo) {
                    this.tooltip.classList.remove('hidden');
                    this.tooltip.style.left = (event.pageX + 10) + 'px';
                    this.tooltip.style.top = (event.pageY + 10) + 'px';
                    
                    // Show appropriate information based on type
                    if (type === 'gdp') {
                        this.tooltip.innerHTML = `
                            <div class="font-bold">${countryInfo.name}</div>
                            <div>GDP per Capita: ${this.formatCurrency(countryInfo.gdpPerCapita)}</div>
                            <div>GDP Rank: ${countryInfo.gdpRank || 'N/A'}</div>
                        `;
                    } else {
                        this.tooltip.innerHTML = `
                            <div class="font-bold">${countryInfo.name}</div>
                            <div>HDI Value: ${countryInfo.hdiValue?.toFixed(3) || 'N/A'}</div>
                            <div>HDI Rank: ${countryInfo.hdiRank || 'N/A'}</div>
                        `;
                    }
                }
            })
            .on('mouseout', () => {
                this.tooltip.classList.add('hidden');
            });

        // Add legend
        const legendWidth = 200;
        const legendHeight = 10;
        
        // Remove existing legend if any
        this.controlsGroup.selectAll('.legend').remove();
        
        const legend = this.controlsGroup.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.width - legendWidth - 20}, ${this.height - 60})`);

        const legendScale = d3.scaleLinear()
            .domain([d3.min(values), d3.max(values)])
            .range([0, legendWidth]);

        // Format tick values based on type
        const tickFormat = type === 'gdp' 
            ? d => this.formatCurrency(d)
            : d => d.toFixed(3);

        const legendAxis = d3.axisBottom(legendScale)
            .tickFormat(tickFormat)
            .ticks(5);

        // Add white background for legend
        legend.append('rect')
            .attr('x', -10)
            .attr('y', -25)
            .attr('width', legendWidth + 20)
            .attr('height', 50)
            .attr('fill', 'white')
            .attr('rx', 6)
            .style('opacity', '0.9');

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .selectAll('text')
            .style('font-size', '10px');

        const legendGradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', `legend-gradient-${type}`) // Make ID unique for each type
            .attr('x1', '0%')
            .attr('x2', '100%')
            .attr('y1', '0%')
            .attr('y2', '0%');

        legendGradient.selectAll('stop')
            .data(colorScale.range())
            .enter()
            .append('stop')
            .attr('offset', (d, i) => (i / (colorScale.range().length - 1)) * 100 + '%')
            .attr('stop-color', d => d);

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', `url(#legend-gradient-${type})`);

        // Update legend title based on type
        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .text(type === 'gdp' ? 'GDP per Capita' : 'Human Development Index (HDI)')
            .style('font-size', '12px');

        console.log('Map drawing completed');
    }
    
    updateMap(countryData, type) {
        if (this.geoData) {
            this.drawMap(this.geoData, countryData, type);
        }
    }
    
    formatCurrency(number) {
        if (number === null || number === undefined || isNaN(number)) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
        }).format(number);
    }
    
    getColor(countryInfo, type, colorScale) {
        if (!countryInfo) return '#eee';
        
        const value = type === 'gdp' ? countryInfo.gdpPerCapita : countryInfo.hdiValue;
        if (value === null || value === undefined || isNaN(value)) return '#eee';
        
        return colorScale(value);
    }
}
