// Main game initialization and loop
window.onload = function() {
    // Initialize game components
    World.init();
    Robot.init();
    Inventory.init();
    Renderer.init();
    
    // Check if database server is running
    Database.checkServerStatus()
        .then(isRunning => {
            if (isRunning) {
                console.log('Connected to game database');
                // Add database controls to the UI
                addDatabaseControls();
            } else {
                console.log('Database server not running - tracking disabled');
            }
        });
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
    // Track the last time we updated the database (we don't need to update every frame)
    let lastDatabaseUpdate = 0;
    const DATABASE_UPDATE_INTERVAL = 500; // ms
    
    // Game loop function
    function gameLoop() {
        // Update game state
        Robot.update(Renderer.canvas.width, Renderer.canvas.height);
        
        // Update database periodically
        const currentTime = Date.now();
        if (currentTime - lastDatabaseUpdate > DATABASE_UPDATE_INTERVAL) {
            Database.updateRobotState(Robot.state);
            lastDatabaseUpdate = currentTime;
        }
        
        // Render the current frame
        Renderer.render();
        
        // Request the next frame
        requestAnimationFrame(gameLoop);
    }
    
    // Add database control buttons to the UI
    function addDatabaseControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.style.position = 'absolute';
        controlsDiv.style.bottom = '10px';
        controlsDiv.style.right = '10px';
        controlsDiv.style.zIndex = '1000';
        
        // Toggle logging button
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Toggle DB Logging';
        toggleButton.style.marginRight = '10px';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.backgroundColor = '#4CAF50';
        toggleButton.style.color = 'white';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.onclick = function() {
            const isEnabled = Database.toggleLogging();
            this.style.backgroundColor = isEnabled ? '#4CAF50' : '#f44336';
        };
        
        // Dashboard button
        const dashboardButton = document.createElement('button');
        dashboardButton.textContent = 'Open Dashboard';
        dashboardButton.style.padding = '5px 10px';
        dashboardButton.style.backgroundColor = '#2196F3';
        dashboardButton.style.color = 'white';
        dashboardButton.style.border = 'none';
        dashboardButton.style.borderRadius = '4px';
        dashboardButton.style.cursor = 'pointer';
        dashboardButton.onclick = function() {
            Database.openDashboard();
        };
        
        controlsDiv.appendChild(toggleButton);
        controlsDiv.appendChild(dashboardButton);
        document.body.appendChild(controlsDiv);
    }
};