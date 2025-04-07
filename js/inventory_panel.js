/**
 * Inventory Panel for Blipp Robot Game
 * Displays and manages the robot's inventory items from the database
 */

const InventoryPanel = (function() {
    // DOM elements
    let panel;
    let itemList;
    let statsSection;
    
    // State
    let items = [];
    let isInitialized = false;
    
    // Initialize the inventory panel
    function init() {
        if (isInitialized) return;
        
        // Create panel elements if they don't exist
        createPanel();
        
        // Add event listeners
        document.getElementById('refresh-inventory').addEventListener('click', refreshInventory);
        document.getElementById('add-random-item').addEventListener('click', addRandomItem);
        
        // Initial inventory load
        refreshInventory();
        
        isInitialized = true;
        
        if (window.DebugPanel && DebugPanel.log) {
            DebugPanel.log('Inventory Panel initialized', 'info');
        }
    }
    
    // Create the inventory panel DOM elements
    function createPanel() {
        // Use existing inventory panel if available
        panel = document.getElementById('inventory-panel');
        
        // If no panel exists, create a new one
        if (!panel) {
            console.log('Creating new database inventory panel');
            
            // Create main panel
            panel = document.createElement('div');
            panel.id = 'database-inventory-panel';
            panel.className = 'game-panel';
            
            // Panel header
            const header = document.createElement('div');
            header.className = 'panel-header';
            header.innerHTML = '<h2>Database Items</h2>';
            
            // Controls
            const controls = document.createElement('div');
            controls.className = 'panel-controls';
            controls.innerHTML = `
                <button id="refresh-inventory" class="panel-button">Refresh</button>
                <button id="add-random-item" class="panel-button">Find Item</button>
            `;
            
            // Stats section
            statsSection = document.createElement('div');
            statsSection.className = 'inventory-stats';
            statsSection.innerHTML = '<p>Items: 0</p>';
            
            // Item list
            itemList = document.createElement('div');
            itemList.className = 'inventory-items';
            
            // Assemble panel
            panel.appendChild(header);
            panel.appendChild(controls);
            panel.appendChild(statsSection);
            panel.appendChild(itemList);
            
            // Add to document
            document.body.appendChild(panel);
        } else {
            console.log('Using existing inventory panel');
            // Use existing panel elements
            statsSection = panel.querySelector('.inventory-stats') || document.createElement('div');
            itemList = panel.querySelector('.inventory-list') || document.createElement('div');
        }
        
        // Add CSS if not already added
        if (!document.getElementById('inventory-panel-css')) {
            const style = document.createElement('style');
            style.id = 'inventory-panel-css';
            style.textContent = `
                #database-inventory-panel {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 300px;
                    max-height: 500px;
                    background-color: rgba(0, 0, 0, 0.8);
                    color: white;
                    border-radius: 8px;
                    padding: 10px;
                    z-index: 1000;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                
                .panel-header {
                    border-bottom: 1px solid #444;
                    margin-bottom: 10px;
                }
                
                .panel-header h2 {
                    margin: 0;
                    padding: 5px 0;
                    font-size: 18px;
                }
                
                .panel-controls {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .panel-button {
                    background-color: #555;
                    border: none;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .panel-button:hover {
                    background-color: #777;
                }
                
                .inventory-stats {
                    font-size: 14px;
                    margin-bottom: 10px;
                    color: #aaa;
                }
                
                .inventory-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    overflow-y: auto;
                }
                
                .inventory-item {
                    display: flex;
                    align-items: center;
                    padding: 8px;
                    background-color: rgba(50, 50, 50, 0.7);
                    border-radius: 4px;
                }
                
                .item-icon {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    margin-right: 10px;
                    font-size: 18px;
                }
                
                .item-details {
                    flex: 1;
                }
                
                .item-name {
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                
                .item-description {
                    font-size: 12px;
                    color: #aaa;
                }
                
                .item-rarity {
                    font-size: 11px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    text-transform: uppercase;
                }
                
                .rarity-common {
                    background-color: #777;
                    color: white;
                }
                
                .rarity-uncommon {
                    background-color: #5a5;
                    color: white;
                }
                
                .rarity-rare {
                    background-color: #55f;
                    color: white;
                }
                
                .rarity-epic {
                    background-color: #a5c;
                    color: white;
                }
                
                .rarity-legendary {
                    background-color: #fa0;
                    color: black;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Refresh inventory from database
    function refreshInventory() {
        if (window.DebugPanel && DebugPanel.log) {
            DebugPanel.log('Refreshing inventory...', 'info');
        }
        
        // Get inventory stats
        fetch(`${API_BASE_URL}/api/inventory/stats`, { mode: 'cors' })
            .then(response => response.json())
            .then(stats => {
                updateStats(stats);
            })
            .catch(error => {
                console.error('Error fetching inventory stats:', error);
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log(`Error fetching inventory stats: ${error.message}`, 'error');
                }
            });
        
        // Get inventory items
        fetch(`${API_BASE_URL}/api/inventory/items?limit=10`, { mode: 'cors' })
            .then(response => response.json())
            .then(data => {
                items = data;
                renderItems();
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log(`Loaded ${items.length} inventory items`, 'info');
                }
            })
            .catch(error => {
                console.error('Error fetching inventory items:', error);
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log(`Error fetching inventory items: ${error.message}`, 'error');
                }
            });
    }
    
    // Add a random item to the inventory
    function addRandomItem() {
        if (window.DebugPanel && DebugPanel.log) {
            DebugPanel.log('Finding a new item...', 'info');
        }
        
        // Get a random item from the database
        fetch(`${API_BASE_URL}/api/inventory/random`, { mode: 'cors' })
            .then(response => response.json())
            .then(item => {
                // If we got a real item (not the default)
                if (item.name !== 'Mystery Item') {
                    if (window.DebugPanel && DebugPanel.log) {
                        DebugPanel.log(`Found: ${item.prefix} ${item.name}`, 'success');
                    }
                    
                    // Add animation effect
                    showItemFoundAnimation(item);
                    
                    // Refresh the inventory
                    setTimeout(refreshInventory, 1500);
                } else {
                    // Create a new random item
                    const newItem = generateRandomItem();
                    
                    // Add to database
                    fetch(`${API_BASE_URL}/api/inventory/add`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(newItem),
                        mode: 'cors'
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.status === 'success') {
                            if (window.DebugPanel && DebugPanel.log) {
                                DebugPanel.log(`Found new item: ${newItem.prefix} ${newItem.name}`, 'success');
                            }
                            
                            // Add animation effect
                            showItemFoundAnimation(newItem);
                            
                            // Refresh the inventory
                            setTimeout(refreshInventory, 1500);
                        }
                    })
                    .catch(error => {
                        console.error('Error adding item:', error);
                        if (window.DebugPanel && DebugPanel.log) {
                            DebugPanel.log(`Error adding item: ${error.message}`, 'error');
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error getting random item:', error);
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log(`Error getting random item: ${error.message}`, 'error');
                }
            });
    }
    
    // Generate a random item (fallback if database has no items)
    function generateRandomItem() {
        const categories = ['mineral', 'tech', 'artifact', 'fossil', 'crystal', 'tool'];
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const rarityWeights = [60, 25, 10, 4, 1];
        
        // Select category and rarity
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Weighted random selection for rarity
        let rarityIndex = 0;
        const rarityRoll = Math.random() * 100;
        let cumulativeWeight = 0;
        
        for (let i = 0; i < rarityWeights.length; i++) {
            cumulativeWeight += rarityWeights[i];
            if (rarityRoll <= cumulativeWeight) {
                rarityIndex = i;
                break;
            }
        }
        
        const rarity = rarities[rarityIndex];
        
        // Generate item properties based on category and rarity
        const item = {
            name: generateItemName(category),
            type: category,
            prefix: generatePrefix(rarity),
            color: generateColor(rarity),
            symbol: generateSymbol(category),
            rarity: rarity,
            description: generateDescription(category),
            category: category,
            timestamp: new Date().toISOString()
        };
        
        return item;
    }
    
    // Helper functions for random item generation
    function generateItemName(category) {
        const names = {
            mineral: ['Iron Ore', 'Copper Ore', 'Gold Nugget', 'Silver Chunk', 'Coal', 'Uranium'],
            tech: ['Circuit Board', 'Power Cell', 'Memory Chip', 'Quantum Processor', 'Nano Fabricator'],
            artifact: ['Ancient Tablet', 'Strange Device', 'Alien Relic', 'Lost Technology', 'Time Capsule'],
            fossil: ['Dinosaur Bone', 'Amber', 'Petrified Wood', 'Ancient Shell', 'Trilobite'],
            crystal: ['Quartz', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Diamond'],
            tool: ['Wrench', 'Hammer', 'Screwdriver', 'Drill', 'Saw']
        };
        
        return names[category][Math.floor(Math.random() * names[category].length)];
    }
    
    function generatePrefix(rarity) {
        const prefixes = {
            common: ['Basic', 'Simple', 'Crude', 'Plain', 'Ordinary'],
            uncommon: ['Decent', 'Solid', 'Sturdy', 'Refined', 'Quality'],
            rare: ['Superior', 'Exceptional', 'Remarkable', 'Excellent', 'Valuable'],
            epic: ['Exquisite', 'Magnificent', 'Astounding', 'Wondrous', 'Mythical'],
            legendary: ['Ancient', 'Legendary', 'Divine', 'Celestial', 'Transcendent']
        };
        
        return prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
    }
    
    function generateColor(rarity) {
        const colors = {
            common: ['#aaaaaa', '#cccccc', '#dddddd'],
            uncommon: ['#55cc55', '#77dd77', '#88ee88'],
            rare: ['#5555ff', '#7777ff', '#8888ff'],
            epic: ['#aa55cc', '#bb66dd', '#cc77ee'],
            legendary: ['#ffaa00', '#ffbb33', '#ffcc55']
        };
        
        return colors[rarity][Math.floor(Math.random() * colors[rarity].length)];
    }
    
    function generateSymbol(category) {
        const symbols = {
            mineral: ['⛏', '🪨', '💎'],
            tech: ['⚙️', '🔌', '🔋'],
            artifact: ['📜', '🔮', '👽'],
            fossil: ['🦴', '🐚', '🦖'],
            crystal: ['💎', '✨', '🔷'],
            tool: ['🔧', '🔨', '⚒️']
        };
        
        return symbols[category][Math.floor(Math.random() * symbols[category].length)];
    }
    
    function generateDescription(category) {
        const descriptions = {
            mineral: ['A valuable resource', 'Used in manufacturing', 'Can be refined into metal', 'Extracted from the earth'],
            tech: ['Advanced technology', 'Electronic component', 'Highly sophisticated device', 'Cutting-edge hardware'],
            artifact: ['Ancient technology', 'Of unknown origin', 'Mysterious purpose', 'Historical significance'],
            fossil: ['Prehistoric remains', 'Millions of years old', 'Well-preserved specimen', 'Scientific importance'],
            crystal: ['Beautiful gemstone', 'Refracts light brilliantly', 'Perfectly formed', 'Rare mineral formation'],
            tool: ['Useful implement', 'Well-crafted tool', 'Precision instrument', 'Durable equipment']
        };
        
        return descriptions[category][Math.floor(Math.random() * descriptions[category].length)];
    }
    
    // Update stats display
    function updateStats(stats) {
        if (!stats) return;
        
        statsSection.innerHTML = `
            <p>Items: ${stats.total_items || 0}</p>
            <p>Categories: ${stats.categories?.length || 0}</p>
            <p>Rarest: ${stats.rarest_item?.rarity || 'None'}</p>
        `;
    }
    
    // Render items in the panel
    function renderItems() {
        // Clear the list
        itemList.innerHTML = '';
        
        // If no items, show message
        if (!items || items.length === 0) {
            itemList.innerHTML = '<p class="no-items">No items found. Click "Find Item" to discover something!</p>';
            return;
        }
        
        // Add each item to the list
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            
            const icon = document.createElement('div');
            icon.className = 'item-icon';
            icon.style.backgroundColor = item.color || '#aaa';
            icon.textContent = item.symbol || '?';
            
            const details = document.createElement('div');
            details.className = 'item-details';
            
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = `${item.prefix} ${item.name}`;
            
            const description = document.createElement('div');
            description.className = 'item-description';
            description.textContent = item.description || '';
            
            const rarity = document.createElement('span');
            rarity.className = `item-rarity rarity-${item.rarity}`;
            rarity.textContent = item.rarity;
            
            details.appendChild(name);
            details.appendChild(description);
            
            itemElement.appendChild(icon);
            itemElement.appendChild(details);
            itemElement.appendChild(rarity);
            
            itemList.appendChild(itemElement);
        });
    }
    
    // Show animation when item is found
    function showItemFoundAnimation(item) {
        // Create animation overlay
        const overlay = document.createElement('div');
        overlay.className = 'item-found-overlay';
        overlay.innerHTML = `
            <div class="item-found-container">
                <div class="item-found-icon" style="background-color: ${item.color || '#aaa'}">${item.symbol || '?'}</div>
                <div class="item-found-name">${item.prefix} ${item.name}</div>
                <div class="item-found-rarity ${item.rarity}">${item.rarity}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Add animation CSS if not already added
        if (!document.getElementById('item-found-css')) {
            const style = document.createElement('style');
            style.id = 'item-found-css';
            style.textContent = `
                .item-found-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 2000;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                .item-found-container {
                    background-color: rgba(30, 30, 30, 0.9);
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
                    animation: scaleIn 0.5s ease-in-out;
                }
                
                .item-found-icon {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    animation: pulse 1s infinite;
                }
                
                .item-found-name {
                    color: white;
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                
                .item-found-rarity {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 15px;
                    text-transform: uppercase;
                    font-weight: bold;
                }
                
                .common {
                    background-color: #777;
                    color: white;
                }
                
                .uncommon {
                    background-color: #5a5;
                    color: white;
                }
                
                .rare {
                    background-color: #55f;
                    color: white;
                }
                
                .epic {
                    background-color: #a5c;
                    color: white;
                }
                
                .legendary {
                    background-color: #fa0;
                    color: black;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after animation
        setTimeout(() => {
            overlay.style.animation = 'fadeIn 0.3s ease-in-out reverse';
            setTimeout(() => {
                document.body.removeChild(overlay);
            }, 300);
        }, 2000);
    }
    
    // Public API
    return {
        init,
        refreshInventory,
        addRandomItem
    };
})();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure the database connection is established
    setTimeout(function() {
        InventoryPanel.init();
    }, 1000);
});
