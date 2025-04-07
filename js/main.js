// Main game initialization and loop
window.onload = function() {
    // Initialize game components
    World.init();
    Robot.init();
    Inventory.init();
    Renderer.init();
    
    // Expose Robot state to Renderer
    Robot.state = Robot.getState();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Game loop function
    function gameLoop() {
        // Update game state
        Robot.update(Renderer.canvas.width, Renderer.canvas.height);
        
        // Make sure Robot state is accessible for rendering
        Robot.state = Robot.getState();
        
        // Render the current frame
        Renderer.render();
        
        // Request the next frame
        requestAnimationFrame(gameLoop);
    }
};