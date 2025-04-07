/**
 * Game Fix - Restores original game visuals while keeping database integration
 */

// Wait for the page to load
window.addEventListener('load', function() {
    console.log('Game fix script loaded');
    
    // Remove any debug overlay
    const existingOverlay = document.querySelector('.debug-overlay');
    if (existingOverlay && existingOverlay.parentNode) {
        existingOverlay.parentNode.removeChild(existingOverlay);
    }
    
    // Give everything a moment to initialize
    setTimeout(function() {
        // Check if canvas exists
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Game canvas not found!');
            return;
        }
        
        // Make sure canvas is properly sized
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            // Set explicit dimensions
            canvas.width = 1000;
            canvas.height = 700;
            console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
            
            // Make sure canvas is visible and positioned correctly
            canvas.style.display = 'block';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '1';
        }
        
        // Clear any existing game loop
        if (window.gameLoopId) {
            cancelAnimationFrame(window.gameLoopId);
        }
        
        // Reinitialize game components in the correct order
        if (window.World) {
            console.log('Reinitializing World');
            World.init();
        }
        
        if (window.Robot) {
            console.log('Reinitializing Robot');
            Robot.init();
        }
        
        if (window.Renderer) {
            console.log('Reinitializing Renderer');
            Renderer.init();
        }
        
        // Create a clean game loop function
        window.gameLoop = function() {
            // Update game state
            if (window.Robot) {
                Robot.update(canvas.width, canvas.height);
            }
            
            // Render the current frame
            if (window.Renderer) {
                Renderer.render();
            }
            
            // Request the next frame
            window.gameLoopId = requestAnimationFrame(gameLoop);
        };
        
        // Start the game loop
        console.log('Starting clean game loop');
        window.gameLoopId = requestAnimationFrame(gameLoop);
        
        // Make sure inventory panel doesn't overlap with game
        const databasePanel = document.getElementById('database-inventory-panel');
        if (databasePanel) {
            databasePanel.style.top = '20px';
            databasePanel.style.left = '20px';
            databasePanel.style.zIndex = '100';
        }
    }, 1000);
});
