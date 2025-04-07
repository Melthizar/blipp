// Debug script to help identify rendering issues
window.addEventListener('load', function() {
    console.log('Debug script loaded');
    
    // Check if all required objects are defined
    console.log('World defined:', typeof World !== 'undefined');
    console.log('Robot defined:', typeof Robot !== 'undefined');
    console.log('Inventory defined:', typeof Inventory !== 'undefined');
    console.log('Renderer defined:', typeof Renderer !== 'undefined');
    
    // Check canvas element
    const canvas = document.getElementById('game-canvas');
    console.log('Canvas element:', canvas);
    console.log('Canvas dimensions:', canvas ? `${canvas.width}x${canvas.height}` : 'N/A');
    
    // Check if any errors occurred during initialization
    setTimeout(function() {
        console.log('Game state after initialization:');
        if (typeof Robot !== 'undefined' && Robot.state) {
            console.log('Robot state:', Robot.state);
        } else {
            console.log('Robot state not available');
        }
        
        if (typeof World !== 'undefined' && World.gameWorld) {
            console.log('World initialized:', World.gameWorld.length > 0);
        } else {
            console.log('World not properly initialized');
        }
        
        // Add visible debug info to the page
        const debugInfo = document.createElement('div');
        debugInfo.style.position = 'absolute';
        debugInfo.style.top = '10px';
        debugInfo.style.left = '10px';
        debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
        debugInfo.style.color = '#fff';
        debugInfo.style.padding = '10px';
        debugInfo.style.borderRadius = '5px';
        debugInfo.style.zIndex = '1000';
        debugInfo.style.maxWidth = '300px';
        debugInfo.style.fontSize = '12px';
        
        let debugText = '<strong>Debug Info:</strong><br>';
        debugText += `World defined: ${typeof World !== 'undefined'}<br>`;
        debugText += `Robot defined: ${typeof Robot !== 'undefined'}<br>`;
        debugText += `Inventory defined: ${typeof Inventory !== 'undefined'}<br>`;
        debugText += `Renderer defined: ${typeof Renderer !== 'undefined'}<br>`;
        debugText += `Canvas: ${canvas ? `${canvas.width}x${canvas.height}` : 'Not found'}<br>`;
        
        debugInfo.innerHTML = debugText;
        document.body.appendChild(debugInfo);
    }, 1000);
});
