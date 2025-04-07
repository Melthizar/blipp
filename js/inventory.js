// Inventory system
const Inventory = (() => {
    // Constants
    const ITEM_NAME_PREFIXES = ["Ancient", "Rusty", "Glowing", "Mysterious", "Tiny", "Broken", "Golden", "Crystal", "Dark", "Alien"];
    const ITEM_NAME_OBJECTS = ["Gear", "Chip", "Circuit", "Battery", "Lens", "Key", "Orb", "Cube", "Shard", "Transmitter"];
    
    // Item visual properties - maps item types to colors and symbols
    const ITEM_VISUALS = {
        "Gear": { color: "#ddd", symbol: "⚙" },
        "Chip": { color: "#0d8", symbol: "▯" },
        "Circuit": { color: "#0af", symbol: "⌘" },
        "Battery": { color: "#fd6", symbol: "▮" },
        "Lens": { color: "#8df", symbol: "◎" },
        "Key": { color: "#fc6", symbol: "✧" },
        "Orb": { color: "#f9f", symbol: "●" },
        "Cube": { color: "#aaf", symbol: "◼" },
        "Shard": { color: "#faa", symbol: "◆" },
        "Transmitter": { color: "#8f8", symbol: "⌥" }
    };
    
    // Prefix modifiers - how each prefix affects item colors
    const PREFIX_MODIFIERS = {
        "Ancient": { hueShift: -30, saturationMult: 0.7, lightnessMult: 0.8 },
        "Rusty": { hueShift: 15, saturationMult: 0.5, lightnessMult: 0.7 },
        "Glowing": { hueShift: 0, saturationMult: 1.3, lightnessMult: 1.3 },
        "Mysterious": { hueShift: 40, saturationMult: 0.9, lightnessMult: 0.7 },
        "Tiny": { hueShift: -10, saturationMult: 0.8, lightnessMult: 1.1 },
        "Broken": { hueShift: -20, saturationMult: 0.4, lightnessMult: 0.9 },
        "Golden": { hueShift: 30, saturationMult: 1.2, lightnessMult: 1.2 },
        "Crystal": { hueShift: 10, saturationMult: 1.4, lightnessMult: 1.1 },
        "Dark": { hueShift: 0, saturationMult: 1.1, lightnessMult: 0.5 },
        "Alien": { hueShift: 70, saturationMult: 1.5, lightnessMult: 1.0 }
    };
    
    // DOM elements
    let inventoryListElement;
    let inventoryCount;
    let inventoryToggle;
    let latestItemContent;
    
    // Item tracking
    let itemsCollection = [];
    let newItemTimer = 0;
    let isInventoryExpanded = false;
    
    // Initialize inventory system
    function init() {
        // Get DOM elements
        inventoryListElement = document.getElementById('inventory-list');
        inventoryCount = document.getElementById('inventory-count');
        inventoryToggle = document.getElementById('inventory-toggle');
        latestItemContent = document.querySelector('.latest-item-content');
        
        // Set up toggle functionality
        const inventoryHeader = document.getElementById('inventory-header');
        inventoryHeader.addEventListener('click', toggleInventory);
        
        // Add animation keyframes for new items
        addAnimationStyles();
    }
    
    // Toggle inventory list visibility
    function toggleInventory() {
        isInventoryExpanded = !isInventoryExpanded;
        
        if (isInventoryExpanded) {
            inventoryListElement.classList.remove('collapsed');
            inventoryToggle.textContent = '▼';
            inventoryToggle.style.transform = 'rotate(0deg)';
        } else {
            inventoryListElement.classList.add('collapsed');
            inventoryToggle.textContent = '▲';
            inventoryToggle.style.transform = 'rotate(180deg)';
        }
    }
    
    // Add necessary CSS animations dynamically
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes newItemGlow {
                0% { transform: translateY(10px); opacity: 0; }
                20% { transform: translateY(0); opacity: 1; }
                80% { background-color: rgba(255, 255, 100, 0.2); }
                100% { background-color: transparent; }
            }
            
            .inventory-item {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                padding: 5px;
                border-bottom: 1px dotted #444;
                transition: all 0.3s ease;
            }
            
            .inventory-item:hover {
                background-color: rgba(100, 200, 255, 0.1);
            }
            
            .item-new {
                animation: newItemGlow 3s ease-out;
            }
            
            .item-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                margin-right: 8px;
                border-radius: 4px;
                text-shadow: 0 0 3px rgba(0,0,0,0.5);
                font-size: 14px;
            }
            
            .inventory-count {
                text-align: center;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #666;
                font-size: 12px;
                color: #aaa;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Generate a random item name
    function generateItemName() {
        const prefix = ITEM_NAME_PREFIXES[Math.floor(Math.random() * ITEM_NAME_PREFIXES.length)];
        const object = ITEM_NAME_OBJECTS[Math.floor(Math.random() * ITEM_NAME_OBJECTS.length)];
        return `${prefix} ${object}`;
    }
    
    // Fetch a random item from the database
    async function fetchRandomItem() {
        try {
            const response = await fetch(`${Database.API_BASE_URL}/random-item`);
            const item = await response.json();
            
            if (item.status === 'not_found') {
                // Fallback to local generation if no items in database
                return null;
            }
            
            return item;
        } catch (error) {
            console.error('Error fetching random item:', error);
            return null;
        }
    }
    
    // Create an item object with visual properties
    function createItem(name) {
        const parts = name.split(' ');
        const prefix = parts[0];
        const type = parts[1];
        
        // Get base item visual properties
        const baseVisual = ITEM_VISUALS[type] || { color: "#fff", symbol: "◌" };
        const prefixMod = PREFIX_MODIFIERS[prefix] || { hueShift: 0, saturationMult: 1, lightnessMult: 1 };
        
        // Apply prefix modifiers to create unique item appearance
        const itemColor = modifyColor(baseVisual.color, prefixMod);
        
        return {
            name: name,
            type: type,
            prefix: prefix,
            color: itemColor,
            symbol: baseVisual.symbol,
            timestamp: Date.now()
        };
    }
    
    // Modify a hex color based on prefix modifiers
    function modifyColor(hexColor, modifiers) {
        // Convert hex to HSL
        let r = parseInt(hexColor.slice(1, 3), 16) / 255;
        let g = parseInt(hexColor.slice(3, 5), 16) / 255;
        let b = parseInt(hexColor.slice(5, 7), 16) / 255;
        
        // RGB to HSL conversion
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        // Apply modifiers
        h = (h * 360 + modifiers.hueShift) % 360;
        if (h < 0) h += 360;
        h /= 360;
        
        s = Math.min(1, Math.max(0, s * modifiers.saturationMult));
        l = Math.min(1, Math.max(0, l * modifiers.lightnessMult));
        
        // HSL to RGB conversion
        let r1, g1, b1;
        
        if (s === 0) {
            r1 = g1 = b1 = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r1 = hue2rgb(p, q, h + 1/3);
            g1 = hue2rgb(p, q, h);
            b1 = hue2rgb(p, q, h - 1/3);
        }
        
        // Convert back to hex
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
    }
    
    // Update the inventory display in the UI
    function updateDisplay(items) {
        // Store the items with visual properties
        itemsCollection = items.map(item => {
            // If the item is just a string, convert it to a full item object
            if (typeof item === 'string') {
                return createItem(item);
            }
            return item;
        });
        
        // Update the count display
        inventoryCount.textContent = `${itemsCollection.length} item${itemsCollection.length !== 1 ? 's' : ''}`;
        
        // Sort items by timestamp (newest first)
        const sortedItems = [...itemsCollection].sort((a, b) => b.timestamp - a.timestamp);
        
        // Update latest item display
        if (sortedItems.length > 0) {
            const latestItem = sortedItems[0];
            updateLatestItemDisplay(latestItem);
        }
        
        // Clear current inventory display
        inventoryListElement.innerHTML = '';
        
        // Add each item with visual effects
        sortedItems.forEach(item => {
            const isNew = Date.now() - item.timestamp < 3000;
            
            // Create item container
            const itemElement = document.createElement('div');
            itemElement.className = 'inventory-item';
            if (isNew) itemElement.classList.add('item-new');
            
            // Create icon
            const iconElement = document.createElement('span');
            iconElement.className = 'item-icon';
            iconElement.textContent = item.symbol;
            iconElement.style.backgroundColor = item.color;
            
            // Create name
            const nameElement = document.createElement('span');
            nameElement.textContent = item.name;
            
            // Add rarity if available
            if (item.rarity) {
                const rarityElement = document.createElement('span');
                rarityElement.className = `item-rarity rarity-${item.rarity}`;
                rarityElement.textContent = item.rarity;
                nameElement.appendChild(document.createElement('br'));
                nameElement.appendChild(rarityElement);
            }
            
            // Assemble item
            itemElement.appendChild(iconElement);
            itemElement.appendChild(nameElement);
            inventoryListElement.appendChild(itemElement);
        });
    }
    
    // Update the latest item display
    function updateLatestItemDisplay(item) {
        if (!item) return;
        
        // Clear previous content
        latestItemContent.innerHTML = '';
        
        // Create icon
        const iconElement = document.createElement('span');
        iconElement.className = 'item-icon';
        iconElement.textContent = item.symbol;
        iconElement.style.backgroundColor = item.color;
        
        // Create name container
        const nameContainer = document.createElement('div');
        nameContainer.style.marginLeft = '8px';
        
        // Add item name
        const nameElement = document.createElement('div');
        nameElement.textContent = item.name;
        nameContainer.appendChild(nameElement);
        
        // Add rarity if available
        if (item.rarity) {
            const rarityElement = document.createElement('div');
            rarityElement.className = `item-rarity rarity-${item.rarity}`;
            rarityElement.textContent = item.rarity;
            rarityElement.style.fontSize = '10px';
            rarityElement.style.display = 'inline-block';
            rarityElement.style.padding = '2px 5px';
            rarityElement.style.borderRadius = '3px';
            rarityElement.style.marginTop = '3px';
            nameContainer.appendChild(rarityElement);
        }
        
        // Assemble latest item display
        latestItemContent.appendChild(iconElement);
        latestItemContent.appendChild(nameContainer);
        
        // Add pulse animation to latest item
        latestItemContent.classList.add('pulse-animation');
        setTimeout(() => {
            latestItemContent.classList.remove('pulse-animation');
        }, 2000);
    }
    
    // Add an item to the inventory and update display
    async function addItem(name) {
        let item;
        
        if (name) {
            // If a specific name is provided, create that item
            item = createItem(name);
        } else {
            // Try to fetch a random item from the database first
            const dbItem = await fetchRandomItem();
            
            if (dbItem) {
                // If we got an item from the database, use it
                const baseVisual = ITEM_VISUALS[dbItem.type] || 
                                  ITEM_VISUALS[dbItem.type.split(' ')[0]] || 
                                  { color: "#fff", symbol: "◌" };
                
                const prefixMod = PREFIX_MODIFIERS[dbItem.prefix] || 
                                 PREFIX_MODIFIERS[dbItem.prefix.split(' ')[0]] || 
                                 { hueShift: 0, saturationMult: 1, lightnessMult: 1 };
                
                // Apply prefix modifiers to create unique item appearance
                const itemColor = modifyColor(baseVisual.color, prefixMod);
                
                item = {
                    name: dbItem.name,
                    type: dbItem.type,
                    prefix: dbItem.prefix,
                    color: itemColor,
                    symbol: baseVisual.symbol,
                    rarity: dbItem.rarity,
                    description: dbItem.description,
                    category: dbItem.category,
                    timestamp: Date.now()
                };
            } else {
                // Fallback to local generation if database fetch failed
                item = createItem(generateItemName());
            }
        }
        
        // Add to collection
        itemsCollection.push(item);
        
        // Update the display
        updateDisplay(itemsCollection);
        
        // Send to database if available
        if (typeof Database !== 'undefined') {
            Database.addInventoryItem(item);
        }
        
        return item;
    }
    
    // Public API
    return {
        init,
        generateItemName,
        createItem,
        updateDisplay,
        addItem,
        get items() { return [...itemsCollection]; }
    };
})();