/**
 * Chart Expander
 * Handles expanding charts to full screen modal view
 */

document.addEventListener('DOMContentLoaded', function() {
    // Portfolio Chart Expansion
    const expandPortfolioBtn = document.getElementById('expand-portfolio-chart');
    const portfolioChartModal = document.getElementById('portfolio-chart-modal');
    const closePortfolioModal = document.getElementById('close-portfolio-modal');
    const portfolioChartExpanded = document.getElementById('portfolio-chart-expanded');
    
    // Comparative Chart Expansion
    const expandComparativeBtn = document.getElementById('expand-comparative-chart');
    const comparativeChartModal = document.getElementById('comparative-chart-modal');
    const closeComparativeModal = document.getElementById('close-comparative-modal');
    const comparativeChartExpanded = document.getElementById('comparative-chart-expanded');
    
    // Portfolio Chart Expansion
    if (expandPortfolioBtn && portfolioChartModal) {
        expandPortfolioBtn.addEventListener('click', function() {
            portfolioChartModal.style.display = 'block';
            
            // Clone the chart configuration and render in the modal
            if (window.portfolioChart) {
                if (window.expandedPortfolioChart) {
                    window.expandedPortfolioChart.destroy();
                }
                
                // Create a new chart with the same configuration
                window.expandedPortfolioChart = new Chart(
                    portfolioChartExpanded.getContext('2d'),
                    JSON.parse(JSON.stringify(window.portfolioChart.config))
                );
            }
        });
    }
    
    // Close Portfolio Modal
    if (closePortfolioModal) {
        closePortfolioModal.addEventListener('click', function() {
            portfolioChartModal.style.display = 'none';
        });
    }
    
    // Comparative Chart Expansion
    if (expandComparativeBtn && comparativeChartModal) {
        expandComparativeBtn.addEventListener('click', function() {
            comparativeChartModal.style.display = 'block';
            
            // Clone the chart configuration and render in the modal
            if (window.comparativeChart) {
                if (window.expandedComparativeChart) {
                    window.expandedComparativeChart.destroy();
                }
                
                // Create a new chart with the same configuration
                window.expandedComparativeChart = new Chart(
                    comparativeChartExpanded.getContext('2d'),
                    JSON.parse(JSON.stringify(window.comparativeChart.config))
                );
            }
        });
    }
    
    // Close Comparative Modal
    if (closeComparativeModal) {
        closeComparativeModal.addEventListener('click', function() {
            comparativeChartModal.style.display = 'none';
        });
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === portfolioChartModal) {
            portfolioChartModal.style.display = 'none';
        }
        if (event.target === comparativeChartModal) {
            comparativeChartModal.style.display = 'none';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            portfolioChartModal.style.display = 'none';
            comparativeChartModal.style.display = 'none';
        }
    });
});
