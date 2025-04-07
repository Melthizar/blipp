// Database communication module
const Database = (() => {
    // API endpoint
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Status tracking
    let isConnected = false;
    let connectionError = null;
    let reconnectInterval = null;
    let statusListeners = [];
    
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
        // Log the connection attempt with full URL for debugging
        console.log(`Checking database connection to: ${API_BASE_URL}/health`);
        
        if (window.DebugPanel && DebugPanel.log) {
            DebugPanel.log(`Checking database connection to: ${API_BASE_URL}/health`, 'info');
        }
        
        // Use the health endpoint for quick status check
        return fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            },
            // Add cache busting to prevent cached responses
            cache: 'no-cache',
            // Set a shorter timeout for quicker failure detection
            signal: AbortSignal.timeout(3000)
        })
        .then(response => {
            if (response.ok) {
                setConnectionStatus(true);
                // After confirming basic health, get detailed server status
                getServerStatus();
                return true;
            } else {
                throw new Error('Server returned an error: ' + response.status);
            }
        })
        .catch(error => {
            setConnectionStatus(false, error);
            
            // Enhanced error logging
            console.error('Database connection error:', error);
            
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Database connection error: ${error.message}`, 'error');
                
                // Add helpful troubleshooting information
                DebugPanel.log('To fix this issue:', 'info');
                DebugPanel.log('1. Make sure the database server is running', 'info');
                DebugPanel.log('2. Try running start_db_server.bat manually', 'info');
                DebugPanel.log('3. Check the debug panel for more details', 'info');
            }
            return false;
        });
    }
    
    // Get detailed server status
    function getServerStatus() {
        fetch(`${API_BASE_URL}/server/status`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Server uptime: ${data.uptime}`, 'info');
                DebugPanel.log(`Database items: ${data.database_stats?.inventory_items || 'unknown'}`, 'info');
            }
        })
        .catch(error => {
            console.warn('Error fetching server status:', error);
        });
    }
    
    // Set connection status and notify listeners
    function setConnectionStatus(connected, error = null) {
        const wasConnected = isConnected;
        isConnected = connected;
        connectionError = error;
        
        // Notify status change
        if (wasConnected !== connected) {
            console.log(`Database connection status: ${connected ? 'Connected' : 'Disconnected'}`);
            if (error) {
                console.error('Connection error:', error);
            }
            
            // Notify all listeners
            statusListeners.forEach(listener => {
                try {
                    listener(connected, error);
                } catch (e) {
                    console.error('Error in status listener:', e);
                }
            });
            
            // Start reconnection attempts if disconnected
            if (!connected && !reconnectInterval) {
                startReconnecting();
            } else if (connected && reconnectInterval) {
                stopReconnecting();
            }
        }
    }
    
    // Start reconnection attempts
    function startReconnecting() {
        if (reconnectInterval) return;
        
        console.log('Starting automatic reconnection attempts...');
        reconnectInterval = setInterval(() => {
            console.log('Attempting to reconnect to database...');
            checkServerStatus();
        }, 5000); // Try every 5 seconds
    }
    
    // Stop reconnection attempts
    function stopReconnecting() {
        if (reconnectInterval) {
            console.log('Stopping reconnection attempts - connection restored');
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    }
    
    // Add a connection status listener
    function addStatusListener(listener) {
        if (typeof listener === 'function') {
            statusListeners.push(listener);
            // Immediately notify with current status
            listener(isConnected, connectionError);
        }
    }
    
    // Remove a connection status listener
    function removeStatusListener(listener) {
        const index = statusListeners.indexOf(listener);
        if (index !== -1) {
            statusListeners.splice(index, 1);
        }
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
        openDashboard,
        addStatusListener,
        removeStatusListener,
        isConnected: () => isConnected,
        getConnectionError: () => connectionError,
        getApiUrl: () => API_BASE_URL
    };
})();
