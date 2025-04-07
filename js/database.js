// Database communication module
const Database = (() => {
    // API endpoint
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Flag to enable/disable database logging
    let loggingEnabled = true;
    
    // Update robot state in database
    function updateRobotState(robot) {
        if (!loggingEnabled) return;
        
        fetch(`${API_BASE_URL}/robot/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                x: robot.x,
                y: robot.y,
                direction: robot.direction,
                isDigging: robot.isDigging,
                isJumping: robot.isJumping
            })
        })
        .catch(error => console.error('Error updating robot state:', error));
    }
    
    // Add item to inventory in database
    function addInventoryItem(item) {
        if (!loggingEnabled) return;
        
        fetch(`${API_BASE_URL}/inventory/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        })
        .catch(error => console.error('Error adding inventory item:', error));
    }
    
    // Toggle database logging
    function toggleLogging() {
        loggingEnabled = !loggingEnabled;
        console.log(`Database logging ${loggingEnabled ? 'enabled' : 'disabled'}`);
        return loggingEnabled;
    }
    
    // Check if database server is running
    function checkServerStatus() {
        return fetch(`${API_BASE_URL}/robot/state`)
            .then(response => {
                if (response.ok) {
                    console.log('Database server is running');
                    return true;
                } else {
                    throw new Error('Server returned an error');
                }
            })
            .catch(error => {
                console.error('Database server is not running:', error);
                return false;
            });
    }
    
    // Open dashboard in a new window
    function openDashboard() {
        window.open(`${API_BASE_URL}/dashboard`, '_blank');
    }
    
    // Public API
    return {
        updateRobotState,
        addInventoryItem,
        toggleLogging,
        checkServerStatus,
        openDashboard
    };
})();
