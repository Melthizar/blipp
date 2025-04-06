// Main game initialization and loop
(function() {
    // Initialize game components
    function initGame() {
        // Initialize all modules in the correct order
        Inventory.init();
        World.init();
        Renderer.init();
        Robot.init();
        
        // Start the game loop
        requestAnimationFrame(gameLoop);
    }
    
    // Main game loop
    function gameLoop() {
        // Update game state
        Robot.update(Renderer.canvas.width, Renderer.canvas.height);
        
        // Render the current frame
        Renderer.render();
        
        // Continue the loop
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game when the page loads
    window.addEventListener('load', initGame);
})(); 