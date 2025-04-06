// Inventory system
const Inventory = (() => {
    // Constants
    const ITEM_NAME_PREFIXES = ["Ancient", "Rusty", "Glowing", "Mysterious", "Tiny", "Broken", "Golden", "Crystal", "Dark", "Alien"];
    const ITEM_NAME_OBJECTS = ["Gear", "Chip", "Circuit", "Battery", "Lens", "Key", "Orb", "Cube", "Shard", "Transmitter"];
    
    // DOM elements
    let inventoryListElement;
    
    // Initialize inventory system
    function init() {
        inventoryListElement = document.getElementById('inventory-list');
    }
    
    // Generate a random item name
    function generateItemName() {
        const prefix = ITEM_NAME_PREFIXES[Math.floor(Math.random() * ITEM_NAME_PREFIXES.length)];
        const object = ITEM_NAME_OBJECTS[Math.floor(Math.random() * ITEM_NAME_OBJECTS.length)];
        return `${prefix} ${object}`;
    }
    
    // Update the inventory display in the UI
    function updateDisplay(items) {
        // Clear current inventory display
        inventoryListElement.innerHTML = '';
        
        // Add each item
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            itemElement.textContent = item;
            inventoryListElement.appendChild(itemElement);
        });
    }
    
    // Public API
    return {
        init,
        generateItemName,
        updateDisplay
    };
})(); 