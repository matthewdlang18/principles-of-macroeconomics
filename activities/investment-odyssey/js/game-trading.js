// Trading Functions for Investment Odyssey

// Sync local playerState with PortfolioManager
function syncPlayerState() {
    if (typeof PortfolioManager !== 'undefined') {
        console.log('Syncing local playerState with PortfolioManager');
        playerState = PortfolioManager.getPlayerState();
        console.log('Synced playerState:', playerState);
    } else {
        console.warn('PortfolioManager not available for syncing');
    }
}

// Update PortfolioManager with local playerState
function updatePortfolioManager() {
    if (typeof PortfolioManager !== 'undefined') {
        console.log('Updating PortfolioManager with local playerState');
        // Copy local playerState properties to PortfolioManager.playerState
        PortfolioManager.playerState.cash = playerState.cash;
        PortfolioManager.playerState.portfolio = JSON.parse(JSON.stringify(playerState.portfolio));
        PortfolioManager.playerState.tradeHistory = JSON.parse(JSON.stringify(playerState.tradeHistory));

        // Calculate portfolio value and update totalValue
        if (typeof PortfolioManager.getPortfolioValue === 'function') {
            const portfolioValue = PortfolioManager.getPortfolioValue();
            PortfolioManager.playerState.totalValue = playerState.cash + portfolioValue;
        } else {
            // If getPortfolioValue is not available, just use the cash value
            PortfolioManager.playerState.totalValue = playerState.cash;
        }

        console.log('Updated PortfolioManager.playerState:', PortfolioManager.playerState);
    } else {
        console.warn('PortfolioManager not available for updating');
    }
}

// Set amount based on percentage of available cash or asset quantity
function setAmountPercentage(percentage) {
    const cashDisplay = document.getElementById('cash-display');
    const amountInput = document.getElementById('amount-input');
    const quantityInput = document.getElementById('quantity-input');
    const actionSelect = document.getElementById('action-select');
    const assetSelect = document.getElementById('asset-select');

    if (!cashDisplay || !amountInput || !actionSelect || !assetSelect) return;

    const action = actionSelect.value;
    const asset = assetSelect.value;
    const cash = parseFloat(cashDisplay.innerText.replace(/,/g, '')) || 0;

    // Sync with PortfolioManager to ensure we have the latest state
    syncPlayerState();

    if (action === 'buy' && cash > 0) {
        // For buying, calculate based on available cash
        const amount = Math.floor(cash * (percentage / 100));
        amountInput.value = amount;
        // Trigger the input event to update related fields
        amountInput.dispatchEvent(new Event('input'));
    } else if (action === 'sell' && asset) {
        // For selling, calculate based on asset quantity
        const currentQuantity = playerState.portfolio[asset] || 0;

        if (currentQuantity > 0) {
            // Calculate quantity to sell based on percentage of owned asset
            const quantityToSell = currentQuantity * (percentage / 100);

            // Update quantity input
            quantityInput.value = quantityToSell.toFixed(6);

            // Trigger the input event to update related fields (including amount)
            quantityInput.dispatchEvent(new Event('input'));

            console.log(`Selling ${percentage}% of ${asset}: ${quantityToSell.toFixed(6)} units`);
        } else {
            console.log(`No ${asset} available to sell`);
        }
    }
}

// Execute trade
function executeTrade() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');

    if (!assetSelect || !actionSelect || !quantityInput) return;

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    if (!asset || quantity <= 0) {
        console.log('Please select an asset and enter a valid quantity');
        return;
    }

    // Always use the latest prices from MarketSimulator
    const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
    const price = latestMarketData.assetPrices[asset] || 0;

    if (price <= 0) {
        console.log('Invalid asset price');
        return;
    }

    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    if (action === 'buy') {
        // Check if player has enough cash
        const cost = price * quantity;

        if (playerState.cash < cost) {
            console.log('Not enough cash to complete this purchase');
            return;
        }

        // Update player state
        playerState.cash -= cost;

        if (!playerState.portfolio[asset]) {
            playerState.portfolio[asset] = 0;
        }

        playerState.portfolio[asset] += quantity;

        // Add to trade history
        playerState.tradeHistory.push({
            asset: asset,
            action: 'buy',
            quantity: quantity,
            price: price,
            cost: cost,
            timestamp: new Date()
        });
    } else {
        // Check if player has enough of the asset
        const currentQuantity = playerState.portfolio[asset] || 0;

        if (currentQuantity < quantity) {
            console.log('Not enough of this asset to sell');
            return;
        }

        // Calculate value
        const value = price * quantity;

        // Update player state
        playerState.cash += value;
        playerState.portfolio[asset] -= quantity;

        // Remove asset from portfolio if quantity is 0
        if (playerState.portfolio[asset] <= 0) {
            delete playerState.portfolio[asset];
        }

        // Add to trade history
        playerState.tradeHistory.push({
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            value: value,
            timestamp: new Date()
        });
    }

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Reset form
    quantityInput.value = '';
    updateTotalCost();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after trade');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }
}

// Buy all assets
function buyAllAssets() {
    try {
        console.log('Buying all assets evenly...');

        // Sync with PortfolioManager first to ensure we have the latest state
        syncPlayerState();

        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Always use the latest prices from MarketSimulator
        const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
        // Filter out 'Cash' from the asset names if it exists
        const assetNames = Object.keys(latestMarketData.assetPrices).filter(asset => asset !== 'Cash');

        if (assetNames.length === 0) {
            console.log('No assets available to buy.');
            if (typeof showNotification === 'function') {
                showNotification('No assets available to buy.', 'warning');
            }
            return;
        }

        // Check if player has cash
        if (playerState.cash <= 0) {
            console.log('No cash available to buy assets.');
            if (typeof showNotification === 'function') {
                showNotification('No cash available to buy assets.', 'warning');
            }
            return;
        }

        // Calculate amount per asset
        const amountPerAsset = playerState.cash / assetNames.length;

        if (amountPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('Not enough cash to distribute.', 'warning');
            }
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${assetNames.length} assets ($${amountPerAsset.toFixed(2)} per asset)`);

        // Buy assets
        for (const asset of assetNames) {
            // Always use the latest price from MarketSimulator
            const price = latestMarketData.assetPrices[asset];
            if (!price || price <= 0) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            // Calculate quantity
            const quantity = amountPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${amountPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                if (!playerState.portfolio[asset]) {
                    playerState.portfolio[asset] = 0;
                }

                playerState.portfolio[asset] += quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    cost: amountPerAsset,
                    timestamp: new Date()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update PortfolioManager with our changes
        updatePortfolioManager();

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save player state to database
        if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
            console.log('Saving player state to database after trade');
            PortfolioManager.savePlayerState().then(() => {
                console.log('Player state saved successfully');
            }).catch(error => {
                console.error('Error saving player state:', error);
            });
        } else {
            console.warn('PortfolioManager not available, falling back to saveGameState');
            saveGameState();
        }

        console.log('Distributed cash evenly across all assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        if (typeof showNotification === 'function') {
            showNotification('Distributed cash evenly across all assets.', 'success');
        }
    } catch (error) {
        console.error('Error in buyAllAssets:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error buying all assets. Please try again.', 'danger');
        }
    }
}

// Buy selected assets evenly
function buySelectedAssets() {
    try {
        console.log('Buying selected assets evenly...');

        // Sync with PortfolioManager first to ensure we have the latest state
        syncPlayerState();

        console.log(`Current cash: ${playerState.cash}`);
        console.log(`Current portfolio:`, playerState.portfolio);

        // Get selected assets
        const checkboxes = document.querySelectorAll('.diversify-asset:checked');
        let selectedAssets = Array.from(checkboxes)
            .map(checkbox => checkbox.value)
            .filter(asset => asset !== 'Cash'); // Filter out 'Cash' if it exists

        // If no checkboxes are found or none are checked, use the currently selected asset
        if (selectedAssets.length === 0) {
            const assetSelect = document.getElementById('asset-select');
            if (assetSelect && assetSelect.value) {
                selectedAssets.push(assetSelect.value);
                console.log(`No assets selected for diversification, using current selected asset: ${assetSelect.value}`);
            } else {
                console.log('No assets selected for diversification.');
                if (typeof showNotification === 'function') {
                    showNotification('Please select at least one asset for diversification.', 'warning');
                }
                return;
            }
        }

        console.log(`Selected assets for diversification: ${selectedAssets.join(', ')}`);

        // Sort assets alphabetically for consistency
        selectedAssets.sort();

        // Check if we have cash first
        if (playerState.cash <= 0) {
            console.log('No cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('No cash to distribute.', 'warning');
            }
            return;
        }

        // Calculate cash per asset
        const cashPerAsset = playerState.cash / selectedAssets.length;

        if (cashPerAsset <= 0) {
            console.log('Not enough cash to distribute.');
            if (typeof showNotification === 'function') {
                showNotification('Not enough cash to distribute.', 'warning');
            }
            return;
        }

        console.log(`Distributing $${playerState.cash.toFixed(2)} across ${selectedAssets.length} selected assets ($${cashPerAsset.toFixed(2)} per asset)`);

        // Always use the latest prices from MarketSimulator
        const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
        // Buy each selected asset
        for (const asset of selectedAssets) {
            // Use the latest price for this asset
            const price = latestMarketData.assetPrices[asset];
            if (!price) {
                console.log(`Price not available for ${asset}, skipping.`);
                continue;
            }

            const quantity = cashPerAsset / price;

            console.log(`Buying ${asset}: Price=${price}, Quantity=${quantity.toFixed(4)}, Cost=${cashPerAsset.toFixed(2)}`);

            if (quantity > 0) {
                // Update player state
                if (!playerState.portfolio[asset]) {
                    playerState.portfolio[asset] = 0;
                }
                playerState.portfolio[asset] += quantity;

                // Add to trade history
                playerState.tradeHistory.push({
                    asset: asset,
                    action: 'buy',
                    quantity: quantity,
                    price: price,
                    cost: cashPerAsset,
                    timestamp: new Date()
                });
            }
        }

        // Set cash to 0
        playerState.cash = 0;

        // Update PortfolioManager with our changes
        updatePortfolioManager();

        // Update UI
        updateUI();

        // Update trade history list
        updateTradeHistoryList();

        // Save player state to database
        if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
            console.log('Saving player state to database after trade');
            PortfolioManager.savePlayerState().then(() => {
                console.log('Player state saved successfully');
            }).catch(error => {
                console.error('Error saving player state:', error);
            });
        } else {
            console.warn('PortfolioManager not available, falling back to saveGameState');
            saveGameState();
        }

        console.log('Distributed cash evenly across selected assets');
        console.log(`Updated cash: ${playerState.cash}`);
        console.log(`Updated portfolio:`, playerState.portfolio);

        if (typeof showNotification === 'function') {
            showNotification(`Distributed cash evenly across ${selectedAssets.length} selected assets.`, 'success');
        }
    } catch (error) {
        console.error('Error buying selected assets:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error buying selected assets. Please try again.', 'danger');
        }
    }
}

// Sell all assets
function sellAllAssets() {
    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    // Check if there are assets to sell
    const assetNames = Object.keys(playerState.portfolio);

    if (assetNames.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('No assets in portfolio to sell.', 'warning');
        }
        return;
    }

    // Always use the latest prices from MarketSimulator
    const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;

    // Batch update: accumulate all changes before updating UI
    let totalCashFromSales = 0;
    const tradeHistoryUpdates = [];

    for (const asset of assetNames) {
        const quantity = playerState.portfolio[asset];
        const price = latestMarketData.assetPrices[asset];
        if (quantity <= 0 || !price || price <= 0) continue;
        const value = price * quantity;
        totalCashFromSales += value;
        tradeHistoryUpdates.push({
            asset: asset,
            action: 'sell',
            quantity: quantity,
            price: price,
            value: value,
            timestamp: new Date()
        });
    }

    // Apply all updates at once
    playerState.cash += totalCashFromSales;
    playerState.tradeHistory = playerState.tradeHistory.concat(tradeHistoryUpdates);
    playerState.portfolio = {};

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Only update the UI after all state changes are complete (prevents flicker)
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after trade');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }

    // Show notification
    if (typeof showNotification === 'function') {
        showNotification('All assets sold successfully.', 'success');
    }
}

// Update trade history list
function updateTradeHistoryList() {
    const tradeHistoryList = document.getElementById('trade-history-list');
    if (!tradeHistoryList) return;

    // Clear existing items
    tradeHistoryList.innerHTML = '';

    // Check if there are trades
    if (playerState.tradeHistory.length === 0) {
        tradeHistoryList.innerHTML = `
            <div class="list-group-item text-center text-muted">
                No trades yet
            </div>
        `;
        return;
    }

    // Add items for each trade (most recent first)
    for (let i = playerState.tradeHistory.length - 1; i >= 0; i--) {
        const trade = playerState.tradeHistory[i];

        const tradeItem = document.createElement('div');
        tradeItem.className = `list-group-item trade-history-item trade-${trade.action}`;

        // Use round number instead of timestamp for simplicity
        const formattedTime = `Round ${gameState.roundNumber}`;

        if (trade.action === 'buy') {
            tradeItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Bought ${trade.quantity.toFixed(2)} ${trade.asset}</strong>
                        <div class="text-muted small">${formattedTime}</div>
                    </div>
                    <div class="text-right">
                        <div>$${trade.price.toFixed(2)} per unit</div>
                        <div class="font-weight-bold">Total: $${trade.cost.toFixed(2)}</div>
                    </div>
                </div>
            `;
        } else {
            tradeItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Sold ${trade.quantity.toFixed(2)} ${trade.asset}</strong>
                        <div class="text-muted small">${formattedTime}</div>
                    </div>
                    <div class="text-right">
                        <div>$${trade.price.toFixed(2)} per unit</div>
                        <div class="font-weight-bold">Total: $${trade.value.toFixed(2)}</div>
                    </div>
                </div>
            `;
        }

        tradeHistoryList.appendChild(tradeItem);
    }
}

// Update total cost
function updateTotalCost() {
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    const amountInput = document.getElementById('amount-input');
    const totalCostDisplay = document.getElementById('total-cost-display');
    const currentPriceDisplay = document.getElementById('current-price-display');
    const quantityDisplay = document.getElementById('quantity-display');
    const availableCashDisplay = document.getElementById('available-cash-display');

    if (!assetSelect || !actionSelect || !quantityInput || !totalCostDisplay || !currentPriceDisplay) return;

    const asset = assetSelect.value;
    const action = actionSelect.value;
    const quantity = parseFloat(quantityInput.value) || 0;

    // Get current price
    const price = gameState.assetPrices[asset] || 0;
    currentPriceDisplay.textContent = formatCurrency(price);

    // Calculate total cost
    const totalCost = price * quantity;
    totalCostDisplay.textContent = formatCurrency(totalCost);

    // Update quantity display
    if (quantityDisplay) {
        quantityDisplay.textContent = quantity.toFixed(6);
    }

    // Update available cash display
    if (availableCashDisplay) {
        availableCashDisplay.textContent = formatCurrency(playerState.cash);
    }

    // If amount input is changed, update quantity
    if (amountInput && price > 0) {
        const amount = parseFloat(amountInput.value) || 0;
        if (action === 'buy' && amountInput === document.activeElement) {
            // Only update quantity if amount input is focused
            const calculatedQuantity = amount / price;
            quantityInput.value = calculatedQuantity.toFixed(6);
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return amount.toFixed(2);
}

// Buy an asset
function buyAsset(asset, quantity, price) {
    console.log(`Buying ${quantity} ${asset} at $${price}`);

    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    // Calculate cost
    const cost = price * quantity;

    // Check if player has enough cash
    if (playerState.cash < cost) {
        console.error('Not enough cash to complete this purchase');
        return false;
    }

    // Update player state
    playerState.cash -= cost;

    if (!playerState.portfolio[asset]) {
        playerState.portfolio[asset] = 0;
    }

    playerState.portfolio[asset] += quantity;

    // Add to trade history
    if (!playerState.tradeHistory) {
        playerState.tradeHistory = [];
    }

    playerState.tradeHistory.push({
        asset: asset,
        action: 'buy',
        quantity: quantity,
        price: price,
        cost: cost,
        timestamp: new Date()
    });

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after buying asset');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }

    return true;
}

// Sell an asset
function sellAsset(asset, quantity, price) {
    console.log(`Selling ${quantity} ${asset} at $${price}`);

    // Sync with PortfolioManager first to ensure we have the latest state
    syncPlayerState();

    // Check if player has enough of the asset
    const currentQuantity = playerState.portfolio[asset] || 0;

    if (currentQuantity < quantity) {
        console.error(`Not enough ${asset} to sell`);
        return false;
    }

    // Calculate value
    const value = price * quantity;

    // Update player state
    playerState.cash += value;
    playerState.portfolio[asset] -= quantity;

    // Remove asset from portfolio if quantity is 0
    if (playerState.portfolio[asset] <= 0) {
        delete playerState.portfolio[asset];
    }

    // Add to trade history
    if (!playerState.tradeHistory) {
        playerState.tradeHistory = [];
    }

    playerState.tradeHistory.push({
        asset: asset,
        action: 'sell',
        quantity: quantity,
        price: price,
        value: value,
        timestamp: new Date()
    });

    // Update PortfolioManager with our changes
    updatePortfolioManager();

    // Update UI
    updateUI();

    // Update trade history list
    updateTradeHistoryList();

    // Save player state to database
    if (typeof PortfolioManager !== 'undefined' && PortfolioManager.savePlayerState) {
        console.log('Saving player state to database after selling asset');
        PortfolioManager.savePlayerState().then(() => {
            console.log('Player state saved successfully');
        }).catch(error => {
            console.error('Error saving player state:', error);
        });
    } else {
        console.warn('PortfolioManager not available, falling back to saveGameState');
        saveGameState();
    }

    return true;
}

// Execute a trade
function executeTrade() {
    console.log('Executing trade');

    // Get form elements
    const assetSelect = document.getElementById('asset-select');
    const actionSelect = document.getElementById('action-select');
    const quantityInput = document.getElementById('quantity-input');
    const amountInput = document.getElementById('amount-input');

    if (!assetSelect || !actionSelect || !quantityInput) {
        console.error('Missing form elements');
        return;
    }

    // Get values
    const asset = assetSelect.value;
    const action = actionSelect.value;
    let quantity = parseFloat(quantityInput.value);

    // Validate inputs
    if (!asset) {
        alert('Please select an asset');
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity');
        return;
    }

    // Always use the latest prices from MarketSimulator
    const latestMarketData = (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) ? MarketSimulator.getMarketData() : gameState;
    const price = latestMarketData.assetPrices[asset] || 0;

    if (price <= 0) {
        alert('Invalid price for ' + asset);
        return;
    }

    // Calculate total cost/value
    const totalAmount = price * quantity;

    // Execute buy or sell
    if (action === 'buy') {
        // Check if player has enough cash
        if (totalAmount > playerState.cash) {
            alert('Not enough cash to complete this purchase');
            return;
        }

        // Buy the asset
        buyAsset(asset, quantity, price);

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Bought ${quantity.toFixed(6)} ${asset} for $${totalAmount.toFixed(2)}`, 'success');
        } else {
            alert(`Bought ${quantity.toFixed(6)} ${asset} for $${totalAmount.toFixed(2)}`);
        }
    } else {
        // Check if player has enough of the asset
        const currentQuantity = playerState.portfolio[asset] || 0;
        if (quantity > currentQuantity) {
            alert(`You only have ${currentQuantity.toFixed(6)} ${asset} to sell`);
            return;
        }

        // Sell the asset
        sellAsset(asset, quantity, price);

        // Show notification
        if (typeof showNotification === 'function') {
            showNotification(`Sold ${quantity.toFixed(6)} ${asset} for $${totalAmount.toFixed(2)}`, 'success');
        } else {
            alert(`Sold ${quantity.toFixed(6)} ${asset} for $${totalAmount.toFixed(2)}`);
        }
    }

    // Reset form
    quantityInput.value = '';
    if (amountInput) amountInput.value = '';

    // Update UI
    updateUI();
}

// Initialize player state from PortfolioManager when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing game-trading.js');

    // Wait a short time to ensure PortfolioManager is initialized
    setTimeout(function() {
        console.log('Syncing initial player state from PortfolioManager');
        syncPlayerState();

        // === FIELD SYNC LOGIC FOR GAME CONTROLS ===
        const amountInput = document.getElementById('amount-input');
        const quantityInput = document.getElementById('quantity-input');
        const assetSelect = document.getElementById('asset-select');
        const actionSelect = document.getElementById('action-select');

        // Helper to get the latest price for the selected asset
        function getCurrentAssetPrice() {
            const asset = assetSelect && assetSelect.value;
            if (!asset) return 0;
            if (typeof MarketSimulator !== 'undefined' && MarketSimulator.getMarketData) {
                const md = MarketSimulator.getMarketData();
                return md.assetPrices[asset] || 0;
            }
            return gameState.assetPrices[asset] || 0;
        }

        // Amount input updates quantity
        if (amountInput && quantityInput) {
            amountInput.addEventListener('input', function() {
                const price = getCurrentAssetPrice();
                const amount = parseFloat(amountInput.value) || 0;
                if (price > 0) {
                    quantityInput.value = (amount / price).toFixed(4);
                } else {
                    quantityInput.value = '';
                }
            });
        }

        // Quantity input updates amount
        if (quantityInput && amountInput) {
            quantityInput.addEventListener('input', function() {
                const price = getCurrentAssetPrice();
                const quantity = parseFloat(quantityInput.value) || 0;
                if (price > 0) {
                    amountInput.value = (quantity * price).toFixed(2);
                } else {
                    amountInput.value = '';
                }
            });
        }

        // Amount percentage buttons update amount (and trigger input event)
        const amountPercentBtns = document.querySelectorAll('.amount-percent-btn');
        amountPercentBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const percent = parseFloat(btn.dataset.percent);
                if (!isNaN(percent)) {
                    setAmountPercentage(percent);
                }
            });
        });

        // Quantity percentage buttons update quantity (and trigger input event)
        const quantityPercentBtns = document.querySelectorAll('.quantity-percent-btn');
        quantityPercentBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const percent = parseFloat(btn.dataset.percent);
                if (!isNaN(percent)) {
                    setAmountPercentage(percent); // Reuse the same function
                }
            });
        });

        // Amount slider updates amount
        const amountSlider = document.getElementById('amount-slider');
        if (amountSlider) {
            amountSlider.addEventListener('input', function() {
                const percent = parseFloat(amountSlider.value);
                if (!isNaN(percent)) {
                    setAmountPercentage(percent);
                }
            });
        }

        // Quantity slider updates quantity
        const quantitySlider = document.getElementById('quantity-slider');
        if (quantitySlider) {
            quantitySlider.addEventListener('input', function() {
                const percent = parseFloat(quantitySlider.value);
                if (!isNaN(percent)) {
                    setAmountPercentage(percent);
                }
            });
        }

        // Amount percentage input updates amount
        const amountPercentageInput = document.getElementById('amount-percentage');
        if (amountPercentageInput) {
            amountPercentageInput.addEventListener('input', function() {
                const percent = parseFloat(amountPercentageInput.value);
                if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                    setAmountPercentage(percent);
                }
            });
        }

        // Quantity percentage input updates quantity
        const quantityPercentageInput = document.getElementById('quantity-percentage');
        if (quantityPercentageInput) {
            quantityPercentageInput.addEventListener('input', function() {
                const percent = parseFloat(quantityPercentageInput.value);
                if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                    setAmountPercentage(percent);
                }
            });
        }

        // If asset or action changes, recalc quantity/amount and reset sliders
        if (assetSelect && amountInput && quantityInput) {
            assetSelect.addEventListener('change', function() {
                // Reset sliders and percentage inputs
                if (amountSlider) amountSlider.value = 0;
                if (quantitySlider) quantitySlider.value = 0;
                if (amountPercentageInput) amountPercentageInput.value = 0;
                if (quantityPercentageInput) quantityPercentageInput.value = 0;

                // Recalculate values
                amountInput.dispatchEvent(new Event('input'));
            });
        }
        if (actionSelect && amountInput && quantityInput) {
            actionSelect.addEventListener('change', function() {
                // Reset sliders and percentage inputs
                if (amountSlider) amountSlider.value = 0;
                if (quantitySlider) quantitySlider.value = 0;
                if (amountPercentageInput) amountPercentageInput.value = 0;
                if (quantityPercentageInput) quantityPercentageInput.value = 0;

                // Recalculate values
                amountInput.dispatchEvent(new Event('input'));
            });
        }
        // === END FIELD SYNC LOGIC ===
    }, 1000);
});
