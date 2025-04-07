// Database Server Launcher
const DbLauncher = (() => {
    // Configuration
    const DB_SERVER_PATH = 'game_db.py';
    const SERVER_PORT = 5000;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // ms
    
    // State tracking
    let serverProcess = null;
    let isServerRunning = false;
    let connectionRetries = 0;
    let statusElement = null;
    
    // Initialize the launcher
    function init() {
        // Create status indicator
        createStatusIndicator();
        
        // Try to connect to existing server first
        checkConnection()
            .then(running => {
                if (running) {
                    updateStatus('connected');
                    isServerRunning = true;
                } else {
                    // Start the server if not running
                    startServer();
                }
            });
    }
    
    // Create a status indicator (now hidden, using debug panel instead)
    function createStatusIndicator() {
        // Create a non-visible element to track status internally
        statusElement = document.createElement('div');
        statusElement.id = 'db-status';
        statusElement.style.display = 'none'; // Hide the element
        updateStatus('connecting');
        
        document.body.appendChild(statusElement);
        
        // Log status to debug panel if available
        if (window.DebugPanel && DebugPanel.log) {
            DebugPanel.log('Database launcher initialized', 'info');
        }
    }
    
    // Update the status indicator and log to debug panel
    function updateStatus(status) {
        if (!statusElement) return;
        
        // Store status in the hidden element
        statusElement.dataset.status = status;
        
        // Log to debug panel if available
        if (window.DebugPanel && DebugPanel.log) {
            switch(status) {
                case 'connecting':
                    DebugPanel.log('🔄 DB: Connecting to database server...', 'info');
                    break;
                case 'connected':
                    DebugPanel.log('✅ DB: Connected to database server', 'success');
                    break;
                case 'error':
                    DebugPanel.log('❌ DB: Error connecting to database server', 'error');
                    break;
                case 'starting':
                    DebugPanel.log('🚀 DB: Starting database server...', 'info');
                    break;
            }
        } else {
            // Fallback to console if debug panel not available
            console.log(`Database status: ${status}`);
        }
    }
    
    // Check if the database server is running
    async function checkConnection() {
        try {
            // Log the attempt with the full URL for debugging
            const fullUrl = `http://localhost:${SERVER_PORT}/api/health`;
            console.log(`Attempting to connect to database server at: ${fullUrl}`);
            
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Checking connection to: ${fullUrl}`, 'info');
            }
            
            // Use the health endpoint for a faster check
            const response = await fetch(fullUrl, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                },
                // Add cache busting
                cache: 'no-cache',
                // Set a shorter timeout
                signal: AbortSignal.timeout(2000)
            });
            
            if (response.ok) {
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log('Database server is responding', 'success');
                }
                return true;
            } else {
                throw new Error(`Server returned status ${response.status}`);
            }
        } catch (error) {
            console.log('Database server not responding:', error);
            
            // More detailed error logging
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Database server not responding: ${error.message}`, 'error');
                
                // Provide helpful troubleshooting tips
                DebugPanel.log('Troubleshooting tips:', 'info');
                DebugPanel.log('1. Make sure the database server is running', 'info');
                DebugPanel.log('2. Try running start_db_server.bat manually', 'info');
                DebugPanel.log(`3. Check if port ${SERVER_PORT} is available`, 'info');
            }
            return false;
        }
    }
    
    // Start the database server
    function startServer() {
        updateStatus('starting');
        console.log('Starting database server...');
        
        // Try multiple methods to start the server
        tryStartServerMethods()
            .then(success => {
                if (success) {
                    // Poll for server availability
                    setTimeout(pollServerStatus, 2000);
                } else {
                    updateStatus('error');
                    if (window.DebugPanel && DebugPanel.log) {
                        DebugPanel.log('Failed to start database server. Please run start_db_server.bat manually.', 'error');
                    }
                }
            });
    }
    
    // Try different methods to start the server
    async function tryStartServerMethods() {
        // Method 1: Use a hidden iframe to load the server starter page
        try {
            const startUrl = `start-db-server.html?timestamp=${Date.now()}`;
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = startUrl;
            document.body.appendChild(iframe);
            
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log('Attempting to start database server via iframe...', 'info');
            }
            
            // Give it a moment to load
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        } catch (error) {
            console.error('Error starting server via iframe:', error);
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Error starting server via iframe: ${error.message}`, 'error');
            }
        }
        
        // Method 2: Try to open the batch file in a new window
        try {
            const result = window.open('start_db_server.bat', '_blank');
            if (result) {
                if (window.DebugPanel && DebugPanel.log) {
                    DebugPanel.log('Attempting to start database server via batch file...', 'info');
                }
                return true;
            }
        } catch (error) {
            console.error('Error starting server via batch file:', error);
            if (window.DebugPanel && DebugPanel.log) {
                DebugPanel.log(`Error starting server via batch file: ${error.message}`, 'error');
            }
        }
        
        // All methods failed
        return false;
    }
    
    // Poll for server status
    function pollServerStatus() {
        checkConnection()
            .then(running => {
                if (running) {
                    updateStatus('connected');
                    isServerRunning = true;
                    console.log('Database server started successfully');
                } else {
                    connectionRetries++;
                    if (connectionRetries < MAX_RETRIES) {
                        console.log(`Retrying connection (${connectionRetries}/${MAX_RETRIES})...`);
                        setTimeout(pollServerStatus, RETRY_DELAY);
                    } else {
                        updateStatus('error');
                        console.error('Failed to start database server after multiple attempts');
                    }
                }
            });
    }
    
    // Public API
    return {
        init,
        isRunning: () => isServerRunning,
        checkConnection
    };
})();
