// Main game initialization and loop
window.onload = function() {
    // Initialize game components
    World.init();
    Robot.init();
    Inventory.init();
    Renderer.init();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Game loop function
    function gameLoop() {
        // Update game state
        Robot.update(Renderer.canvas.width, Renderer.canvas.height);
        
        // Render the current frame
        Renderer.render();
        
        // Request the next frame
        requestAnimationFrame(gameLoop);
    }
    
};