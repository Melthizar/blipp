// World generation and management
const World = (() => {
    // Constants
    const TILE_SIZE = 32;
    const GRID_WIDTH = 31; // Increased width for wider view (1000px / 32px = ~31)
    const GRID_HEIGHT = 35; // Increased height for deeper underground exploration (700px / 32px = ~22 + extra for digging)
    
    // Layer types and their properties
    const LAYERS = [
        { name: 'surface', depth: 3, color: '#553', itemChance: 0.15, hasCaves: true },
        { name: 'dirt', depth: 7, color: '#642', itemChance: 0.2, hasCaves: true },
        { name: 'stone', depth: 8, color: '#555', itemChance: 0.25, hasCaves: true },
        { name: 'mineral', depth: 7, color: '#445', itemChance: 0.3, hasCaves: true },
        { name: 'lava', depth: 5, color: '#722', itemChance: 0.4, hasCaves: false }
    ];
    
    // Pocket types
    const POCKET_TYPES = [
        { name: 'gems', color: '#0af', size: [2, 4], rarity: 0.2, minDepth: 1, itemChance: 0.6 },
        { name: 'gold', color: '#fd3', size: [1, 3], rarity: 0.3, minDepth: 2, itemChance: 0.7 },
        { name: 'tech', color: '#57b', size: [2, 5], rarity: 0.15, minDepth: 3, itemChance: 0.8 },
        { name: 'alien', color: '#5d5', size: [3, 6], rarity: 0.05, minDepth: 4, itemChance: 0.9 }
    ];
    
    // World state
    let gameWorld = [];
    let worldOffset = 0;
    
    // Helper function to determine layer at a given depth
    function getLayerAtDepth(depth) {
        let currentDepth = GRID_HEIGHT - 4; // Start after initial air space
        
        for (let i = 0; i < LAYERS.length; i++) {
            currentDepth -= LAYERS[i].depth;
            if (depth >= currentDepth) {
                return LAYERS[i];
            }
        }
        // Default to the deepest layer if we go beyond defined layers
        return LAYERS[LAYERS.length - 1];
    }
    
    // Generate a pocket of special material
    function generatePocket(x, y, pocketType) {
        const size = Math.floor(Math.random() * 
            (pocketType.size[1] - pocketType.size[0] + 1)) + pocketType.size[0];
        
        for (let i = -Math.floor(size/2); i <= Math.floor(size/2); i++) {
            for (let j = -Math.floor(size/2); j <= Math.floor(size/2); j++) {
                // Elliptical shape check
                if ((i*i + j*j) <= (size*size/4)) {
                    const pocketX = x + i;
                    const pocketY = y + j;
                    
                    // Make sure we're not out of bounds
                    if (pocketX >= 0 && pocketX < gameWorld.length && 
                        pocketY >= 0 && pocketY < GRID_HEIGHT) {
                        // Only place pocket in ground tiles (not air or bedrock)
                        const tile = gameWorld[pocketX][pocketY];
                        if (tile && tile.type === 'ground') {
                            gameWorld[pocketX][pocketY] = {
                                type: 'pocket',
                                pocketType: pocketType.name,
                                color: pocketType.color,
                                hasItem: Math.random() < pocketType.itemChance
                            };
                        }
                    }
                }
            }
        }
    }
    
    // Helper to generate a single column of the world
    function generateWorldColumn(x) {
        gameWorld[x] = [];
        
        // Cave and pocket noise seeds for this column
        const caveSeed = x * 0.2;
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            // Top part is always air
            if (y < GRID_HEIGHT - 15) {
                gameWorld[x][y] = { type: 'air' };
                continue;
            }
            
            // Surface level has uneven terrain
            if (y === GRID_HEIGHT - 15) {
                let noise = Math.sin(x * 0.2) * 2;
                if (y + Math.floor(noise) >= GRID_HEIGHT - 15) {
                    gameWorld[x][y] = {
                        type: 'ground',
                        layer: 'surface',
                        color: LAYERS[0].color,
                        hasItem: Math.random() < LAYERS[0].itemChance
                    };
                } else {
                    gameWorld[x][y] = { type: 'air' };
                }
                continue;
            }
            
            // Bottom is always bedrock
            if (y === GRID_HEIGHT - 1) {
                gameWorld[x][y] = {
                    type: 'bedrock',
                    hasItem: false
                };
                continue;
            }
            
            // Determine layer based on depth
            const layer = getLayerAtDepth(y);
            
            // Generate caves with perlin-like noise
            const caveNoise = Math.sin(caveSeed + y * 0.3) + Math.cos(y * 0.7 + x * 0.2);
            
            if (layer.hasCaves && caveNoise > 1.5) {
                gameWorld[x][y] = { type: 'air' };
            } else {
                gameWorld[x][y] = {
                    type: 'ground',
                    layer: layer.name,
                    color: layer.color,
                    hasItem: Math.random() < layer.itemChance
                };
            }
        }
        
        // Add pockets of special materials
        for (const pocketType of POCKET_TYPES) {
            const layerIndex = pocketType.minDepth - 1;
            const layerStartY = GRID_HEIGHT - 15; // Surface starts here
            const layerDepth = LAYERS[Math.min(layerIndex, LAYERS.length - 1)].depth;
            
            if (Math.random() < pocketType.rarity) {
                const pocketY = layerStartY + layerDepth + Math.floor(Math.random() * 5);
                
                if (pocketY >= 0 && pocketY < GRID_HEIGHT) {
                    generatePocket(x, pocketY, pocketType);
                }
            }
        }
    }
    
    // Initialize world
    function init() {
        for (let x = 0; x < GRID_WIDTH * 3; x++) {
            generateWorldColumn(x);
        }
    }

    function extendWorld() {
        // Add more world to the right
        let startX = gameWorld.length;
        let endX = startX + GRID_WIDTH;
        
        for (let x = startX; x < endX; x++) {
            generateWorldColumn(x);
        }
    }
    
    function handleScrolling(robotX, robotWidth, canvasWidth) {
        // Scroll the world when robot approaches the edge
        if (robotX > canvasWidth * 0.7) {
            // Generate new world if needed
            if (worldOffset + canvasWidth > (gameWorld.length - GRID_WIDTH) * TILE_SIZE) {
                extendWorld();
            }
            
            // Move the world left
            worldOffset += 4;
            return -4; // Robot x adjustment
        } else if (robotX < canvasWidth * 0.3 && worldOffset > 0) {
            // Move the world right
            worldOffset -= 4;
            return 4; // Robot x adjustment
        }
        
        return 0; // No adjustment needed
    }

    function getTile(x, y) {
        if (x >= 0 && x < gameWorld.length && y >= 0 && y < GRID_HEIGHT) {
            return gameWorld[x][y];
        }
        return null;
    }

    function setTile(x, y, type, hasItem = false) {
        if (x >= 0 && x < gameWorld.length && y >= 0 && y < GRID_HEIGHT) {
            if (type === 'air') {
                gameWorld[x][y] = { type: 'air' };
            } else {
                // Preserve the layer or pocket information
                const oldTile = getTile(x, y);
                if (oldTile) {
                    const newTile = { type };
                    
                    if (oldTile.layer) {
                        newTile.layer = oldTile.layer;
                        newTile.color = oldTile.color;
                    }
                    
                    if (oldTile.pocketType) {
                        newTile.pocketType = oldTile.pocketType;
                        newTile.color = oldTile.color;
                    }
                    
                    newTile.hasItem = hasItem;
                    gameWorld[x][y] = newTile;
                } else {
                    gameWorld[x][y] = { type, hasItem };
                }
            }
        }
    }
    
    // Public API
    return {
        init,
        extendWorld,
        handleScrolling,
        getTile,
        setTile,
        TILE_SIZE,
        GRID_WIDTH,
        GRID_HEIGHT,
        get worldOffset() { return worldOffset; },
        get gameWorld() { return gameWorld; }
    };
})(); 