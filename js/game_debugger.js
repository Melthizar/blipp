/**
 * Game Debugger - Helps diagnose rendering issues
 */

const GameDebugger = (function() {
    // Store original methods for later restoration
    const originalMethods = {};
    
    function init() {
        console.log('Game Debugger initialized');
        
        // Check if canvas exists
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Game canvas not found!');
            return;
        }
        
        console.log('Canvas found:', canvas);
        console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
        
        // Check if context is available
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context!');
            return;
        }
        
        console.log('Canvas context obtained successfully');
        
        // Check if game modules are loaded
        checkModule('World');
        checkModule('Robot');
        checkModule('Renderer');
        checkModule('Inventory');
        
        // Patch the renderer to log rendering calls
        patchRenderer();
        
        // Force a redraw
        drawTestOverlay();
    }
    
    function checkModule(moduleName) {
        if (window[moduleName]) {
            console.log(`Module ${moduleName} is loaded`);
            
            // Check for init method
            if (typeof window[moduleName].init === 'function') {
                console.log(`Module ${moduleName} has init method`);
            } else {
                console.warn(`Module ${moduleName} is missing init method`);
            }
        } else {
            console.error(`Module ${moduleName} is not loaded!`);
        }
    }
    
    function patchRenderer() {
        if (!window.Renderer) {
            console.error('Cannot patch Renderer - not found');
            return;
        }
        
        // Store original render method
        originalMethods.render = Renderer.render;
        
        // Patch render method to log calls
        Renderer.render = function() {
            console.log('Renderer.render called');
            
            // Call original method
            const result = originalMethods.render.apply(this, arguments);
            
            // Log after rendering
            console.log('Rendering complete');
            
            return result;
        };
        
        console.log('Renderer patched successfully');
    }
    
    function drawTestOverlay() {
        const canvas = document.getElementById('game-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        // Draw a semi-transparent overlay to verify canvas is working
        ctx.save();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('Debug', 20, 50);
        ctx.restore();
        
        console.log('Drew test overlay');
    }
    
    function restoreOriginalMethods() {
        // Restore original render method
        if (window.Renderer && originalMethods.render) {
            Renderer.render = originalMethods.render;
            console.log('Restored original Renderer.render method');
        }
    }
    
    // Public API
    return {
        init,
        drawTestOverlay,
        restoreOriginalMethods
    };
})();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure all game modules are loaded
    setTimeout(function() {
        GameDebugger.init();
    }, 2000);
});
