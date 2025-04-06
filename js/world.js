// World generation and management
const World = (() => {
    // Constants
    const TILE_SIZE = 32;
    const GRID_WIDTH = 25;
    const GRID_HEIGHT = 18;
    
    // World state
    let gameWorld = [];
    let worldOffset = 0;
    
    // Initialize world
    function init() {
        for (let x = 0; x < GRID_WIDTH * 3; x++) {
            gameWorld[x] = [];
            for (let y = 0; y < GRID_HEIGHT; y++) {
                // Base solid layer at bottom of screen
                if (y === GRID_HEIGHT - 1) {
                    gameWorld[x][y] = {
                        type: 'bedrock',
                        hasItem: false
                    };
                }
                // Ground level
                else if (y >= GRID_HEIGHT - 4) {
                    // Create uneven terrain
                    let noise = Math.sin(x * 0.2) * 2;
                    if (y >= GRID_HEIGHT - 4 + Math.floor(noise)) {
                        gameWorld[x][y] = {
                            type: 'ground',
                            hasItem: Math.random() < 0.3
                        };
                    } else {
                        gameWorld[x][y] = { type: 'air' };
                    }
                } else if (y >= GRID_HEIGHT - 8 && Math.random() < 0.1) {
                    // Random platforms
                    gameWorld[x][y] = { 
                        type: 'ground',
                        hasItem: Math.random() < 0.2
                    };
                } else {
                    gameWorld[x][y] = { type: 'air' };
                }
            }
        }
    }

    function extendWorld() {
        // Add more world to the right
        let startX = gameWorld.length;
        let endX = startX + GRID_WIDTH;
        
        for (let x = startX; x < endX; x++) {
            gameWorld[x] = [];
            for (let y = 0; y < GRID_HEIGHT; y++) {
                // Base solid layer at bottom of screen
                if (y === GRID_HEIGHT - 1) {
                    gameWorld[x][y] = {
                        type: 'bedrock',
                        hasItem: false
                    };
                }
                // Ground level
                else if (y >= GRID_HEIGHT - 4) {
                    // Create uneven terrain
                    let noise = Math.sin(x * 0.2) * 2;
                    if (y >= GRID_HEIGHT - 4 + Math.floor(noise)) {
                        gameWorld[x][y] = {
                            type: 'ground',
                            hasItem: Math.random() < 0.3
                        };
                    } else {
                        gameWorld[x][y] = { type: 'air' };
                    }
                } else if (y >= GRID_HEIGHT - 8 && Math.random() < 0.1) {
                    // Random platforms
                    gameWorld[x][y] = { 
                        type: 'ground',
                        hasItem: Math.random() < 0.2
                    };
                } else {
                    gameWorld[x][y] = { type: 'air' };
                }
            }
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
            gameWorld[x][y] = { type, hasItem };
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