from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import sqlite3
import json
import os
import logging
import sys
import traceback
import time
from datetime import datetime

app = Flask(__name__)

# Configure logging
log_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Console handler
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(log_format)

# File handler
file_handler = logging.FileHandler('game_db.log')
file_handler.setFormatter(log_format)

# Set up logger
logger = logging.getLogger('game_db')
logger.setLevel(logging.INFO)
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Enable CORS for all routes with more specific configuration
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"]}})

# Track server status
server_start_time = time.time()
request_count = 0

@app.after_request
def after_request(response):
    global request_count
    request_count += 1
    
    # Add CORS headers
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    
    # Log request details
    logger.info(f"Request: {request.path} - Status: {response.status_code}")
    
    return response

@app.errorhandler(Exception)
def handle_exception(e):
    # Log the error
    logger.error(f"Unhandled exception: {str(e)}")
    logger.error(traceback.format_exc())
    
    # Return error response
    return jsonify({
        'error': str(e),
        'status': 'error',
        'timestamp': datetime.now().isoformat()
    }), 500

# Database setup
# Use a relative path with the script directory to ensure consistency
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, 'game_data.db')

# Log the database path for troubleshooting
logger.info(f'Using database at: {DB_PATH}')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS robot_state (
        id INTEGER PRIMARY KEY,
        x REAL,
        y REAL,
        direction INTEGER,
        is_digging BOOLEAN,
        is_jumping BOOLEAN,
        timestamp TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT,
        prefix TEXT,
        color TEXT,
        symbol TEXT,
        rarity TEXT,
        description TEXT,
        category TEXT,
        timestamp TEXT
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS item_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT,
        prefix TEXT,
        rarity TEXT,
        description TEXT,
        category TEXT
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

@app.route('/api/robot/state', methods=['POST'])
def update_robot_state():
    data = request.json
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Update or insert robot state
    cursor.execute('''
    INSERT OR REPLACE INTO robot_state (id, x, y, direction, is_digging, is_jumping, timestamp)
    VALUES (1, ?, ?, ?, ?, ?, datetime('now'))
    ''', (data.get('x'), data.get('y'), data.get('direction'), 
          data.get('isDigging'), data.get('isJumping')))
    
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route('/api/robot/state', methods=['GET'])
def get_robot_state():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM robot_state WHERE id = 1')
    row = cursor.fetchone()
    
    if row:
        state = dict(row)
        conn.close()
        return jsonify(state)
    else:
        conn.close()
        return jsonify({"status": "not_found"})

@app.route('/api/inventory/add', methods=['POST'])
def add_inventory_item():
    item = request.json
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
    INSERT INTO inventory_items (name, type, prefix, color, symbol, rarity, description, category, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ''', (item.get('name'), item.get('type'), item.get('prefix'), 
          item.get('color'), item.get('symbol'), item.get('rarity', 'Common'),
          item.get('description', ''), item.get('category', 'unknown')))
    
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "id": item_id})

@app.route('/api/inventory/random', methods=['GET'])
def get_random_inventory_item():
    # Get query parameters
    category = request.args.get('category', None)
    rarity = request.args.get('rarity', None)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = 'SELECT * FROM inventory_items'
    params = []
    
    # Add filters if provided
    if category or rarity:
        query += ' WHERE'
        
        if category:
            query += ' category = ?'
            params.append(category)
            
        if category and rarity:
            query += ' AND'
            
        if rarity:
            query += ' rarity = ?'
            params.append(rarity)
    
    # Add random order and limit
    query += ' ORDER BY RANDOM() LIMIT 1'
    
    cursor.execute(query, params)
    row = cursor.fetchone()
    
    if row:
        item = dict(row)
        conn.close()
        return jsonify(item)
    else:
        # If no items found, return a default item
        conn.close()
        return jsonify({
            'name': 'Mystery Item',
            'type': 'unknown',
            'prefix': 'Strange',
            'color': '#8855ff',
            'symbol': '?',
            'rarity': 'uncommon',
            'description': 'A mysterious item that appeared when no other items were found.',
            'category': 'misc',
            'timestamp': datetime.now().isoformat()
        })

@app.route('/api/item-templates', methods=['GET'])
def get_item_templates():
    category = request.args.get('category', None)
    rarity = request.args.get('rarity', None)
    limit = request.args.get('limit', 100, type=int)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = 'SELECT * FROM item_templates'
    params = []
    
    # Add filters if provided
    if category or rarity:
        query += ' WHERE'
        
        if category:
            query += ' category = ?'
            params.append(category)
            
        if category and rarity:
            query += ' AND'
            
        if rarity:
            query += ' rarity = ?'
            params.append(rarity)
    
    query += ' ORDER BY RANDOM() LIMIT ?'
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    templates = [dict(row) for row in rows]
    conn.close()
    
    return jsonify(templates)

@app.route('/api/random-item', methods=['GET'])
def get_random_item():
    category = request.args.get('category', None)
    rarity = request.args.get('rarity', None)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = 'SELECT * FROM item_templates'
    params = []
    
    # Add filters if provided
    if category or rarity:
        query += ' WHERE'
        
        if category:
            query += ' category = ?'
            params.append(category)
            
        if category and rarity:
            query += ' AND'
            
        if rarity:
            query += ' rarity = ?'
            params.append(rarity)
    
    query += ' ORDER BY RANDOM() LIMIT 1'
    
    cursor.execute(query, params)
    row = cursor.fetchone()
    
    if row:
        template = dict(row)
        conn.close()
        return jsonify(template)
    else:
        conn.close()
        return jsonify({"status": "not_found"})

@app.route('/api/inventory/items', methods=['GET'])
def get_inventory_items():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM inventory_items ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    
    items = [dict(row) for row in rows]
    conn.close()
    
    return jsonify(items)

@app.route('/api/inventory/stats', methods=['GET'])
def get_inventory_stats():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get total count
    cursor.execute('SELECT COUNT(*) FROM inventory_items')
    total_count = cursor.fetchone()[0]
    
    # Get counts by type
    cursor.execute('SELECT type, COUNT(*) as count FROM inventory_items GROUP BY type')
    type_counts = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Get counts by prefix
    cursor.execute('SELECT prefix, COUNT(*) as count FROM inventory_items GROUP BY prefix')
    prefix_counts = {row[0]: row[1] for row in cursor.fetchall()}
    
    conn.close()
    
    return jsonify({
        "total": total_count,
        "by_type": type_counts,
        "by_prefix": prefix_counts
    })

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    # HTML for a simple dashboard
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Blipp Game Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f0f0; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1, h2, h3 { color: #333; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .chart { height: 200px; margin-top: 20px; }
            .stat-box { display: inline-block; width: 120px; text-align: center; background: #007bff; color: white; padding: 15px; margin: 10px; border-radius: 5px; }
            .stat-box h3 { margin: 0; font-size: 24px; }
            .stat-box p { margin: 5px 0 0 0; }
            .tabs { display: flex; margin-bottom: 20px; }
            .tab { padding: 10px 20px; cursor: pointer; background: #ddd; margin-right: 5px; border-radius: 5px 5px 0 0; }
            .tab.active { background: #007bff; color: white; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .category-filter { margin-bottom: 15px; }
            .category-filter select { padding: 8px; margin-right: 10px; }
            .category-filter button { padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .item-card { display: inline-block; width: 220px; margin: 10px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); vertical-align: top; }
            .item-card h3 { margin-top: 0; font-size: 16px; }
            .item-card p { margin: 5px 0; font-size: 14px; }
            .item-card .rarity { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; margin-top: 5px; }
            .rarity-Common { background: #aaa; color: white; }
            .rarity-Uncommon { background: #2ecc71; color: white; }
            .rarity-Rare { background: #3498db; color: white; }
            .rarity-Epic { background: #9b59b6; color: white; }
            .rarity-Legendary { background: #f39c12; color: white; }
            .rarity-Mythic { background: #e74c3c; color: white; }
            .rarity-Unique { background: #1abc9c; color: white; }
            .pagination { margin-top: 20px; text-align: center; }
            .pagination button { padding: 5px 10px; margin: 0 5px; cursor: pointer; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Blipp Game Dashboard</h1>
            
            <div class="tabs">
                <div class="tab active" data-tab="game-data">Game Data</div>
                <div class="tab" data-tab="item-templates">Item Templates</div>
                <div class="tab" data-tab="item-categories">Item Categories</div>
            </div>
            
            <div id="game-data" class="tab-content active">
                <div class="card">
                    <h2>Robot Status</h2>
                    <div id="robot-status">Loading...</div>
                </div>
                
                <div class="card">
                    <h2>Inventory Statistics</h2>
                    <div id="inventory-stats">
                        <div id="stat-boxes"></div>
                        <div class="chart" id="type-chart"></div>
                        <div class="chart" id="prefix-chart"></div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>Recent Items</h2>
                    <table id="items-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Prefix</th>
                                <th>Rarity</th>
                                <th>Category</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colspan="7">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div id="item-templates" class="tab-content">
                <div class="card">
                    <h2>Item Templates</h2>
                    <div class="category-filter">
                        <select id="template-category">
                            <option value="">All Categories</option>
                            <option value="sci-fi">Sci-Fi</option>
                            <option value="fantasy">Fantasy</option>
                            <option value="mechanical">Mechanical</option>
                            <option value="scientific">Scientific</option>
                            <option value="ancient">Ancient</option>
                            <option value="futuristic">Futuristic</option>
                            <option value="magical">Magical</option>
                            <option value="technological">Technological</option>
                            <option value="alien">Alien</option>
                            <option value="mystical">Mystical</option>
                        </select>
                        <select id="template-rarity">
                            <option value="">All Rarities</option>
                            <option value="Common">Common</option>
                            <option value="Uncommon">Uncommon</option>
                            <option value="Rare">Rare</option>
                            <option value="Epic">Epic</option>
                            <option value="Legendary">Legendary</option>
                            <option value="Mythic">Mythic</option>
                            <option value="Unique">Unique</option>
                        </select>
                        <button id="filter-templates">Filter</button>
                    </div>
                    <div id="templates-container">Loading templates...</div>
                    <div class="pagination">
                        <button id="load-more-templates">Load More</button>
                    </div>
                </div>
            </div>
            
            <div id="item-categories" class="tab-content">
                <div class="card">
                    <h2>Item Categories</h2>
                    <div id="categories-stats">Loading category statistics...</div>
                    
                    <h3>Category Breakdown</h3>
                    <div id="category-breakdown"></div>
                    
                    <h3>Rarity Distribution</h3>
                    <div id="rarity-breakdown"></div>
                </div>
            </div>
        </div>
        
        <script>
            // Tab functionality
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs and content
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab and corresponding content
                    tab.classList.add('active');
                    document.getElementById(tab.dataset.tab).classList.add('active');
                });
            });
            
            // Game data tab functions
            function updateRobotStatus() {
                fetch('/api/robot/state')
                    .then(response => response.json())
                    .then(data => {
                        const statusDiv = document.getElementById('robot-status');
                        if (data.status === 'not_found') {
                            statusDiv.innerHTML = '<p>No robot data recorded yet</p>';
                        } else {
                            statusDiv.innerHTML = `
                                <p><strong>Position:</strong> X: ${data.x.toFixed(2)}, Y: ${data.y.toFixed(2)}</p>
                                <p><strong>Direction:</strong> ${data.direction > 0 ? 'Right' : 'Left'}</p>
                                <p><strong>Status:</strong> 
                                    ${data.is_digging ? 'Digging' : ''} 
                                    ${data.is_jumping ? 'Jumping' : ''}
                                    ${!data.is_digging && !data.is_jumping ? 'Idle' : ''}
                                </p>
                                <p><strong>Last Updated:</strong> ${data.timestamp}</p>
                            `;
                        }
                    })
                    .catch(error => console.error('Error fetching robot state:', error));
            }
            
            function updateInventoryStats() {
                fetch('/api/inventory/stats')
                    .then(response => response.json())
                    .then(data => {
                        // Update stat boxes
                        const statBoxesDiv = document.getElementById('stat-boxes');
                        statBoxesDiv.innerHTML = `
                            <div class="stat-box">
                                <h3>${data.total}</h3>
                                <p>Total Items</p>
                            </div>
                            <div class="stat-box">
                                <h3>${Object.keys(data.by_type).length}</h3>
                                <p>Item Types</p>
                            </div>
                            <div class="stat-box">
                                <h3>${Object.keys(data.by_prefix).length}</h3>
                                <p>Prefixes</p>
                            </div>
                        `;
                    })
                    .catch(error => console.error('Error fetching inventory stats:', error));
            }
            
            function updateItemsTable() {
                fetch('/api/inventory/items')
                    .then(response => response.json())
                    .then(items => {
                        const tableBody = document.querySelector('#items-table tbody');
                        if (items.length === 0) {
                            tableBody.innerHTML = '<tr><td colspan="7">No items collected yet</td></tr>';
                        } else {
                            tableBody.innerHTML = items.slice(0, 10).map(item => `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.name}</td>
                                    <td>${item.type}</td>
                                    <td>${item.prefix}</td>
                                    <td>${item.rarity || 'Common'}</td>
                                    <td>${item.category || 'unknown'}</td>
                                    <td>${item.timestamp}</td>
                                </tr>
                            `).join('');
                        }
                    })
                    .catch(error => console.error('Error fetching items:', error));
            }
            
            // Item templates tab functions
            let templateOffset = 0;
            const templateLimit = 20;
            
            function loadItemTemplates(offset = 0, append = false) {
                const category = document.getElementById('template-category').value;
                const rarity = document.getElementById('template-rarity').value;
                
                let url = `/api/item-templates?limit=${templateLimit}`;
                if (category) url += `&category=${category}`;
                if (rarity) url += `&rarity=${rarity}`;
                
                fetch(url)
                    .then(response => response.json())
                    .then(templates => {
                        const container = document.getElementById('templates-container');
                        
                        if (templates.length === 0) {
                            container.innerHTML = '<p>No item templates found.</p>';
                            return;
                        }
                        
                        const templatesHtml = templates.map(template => `
                            <div class="item-card">
                                <h3>${template.name}</h3>
                                <p><strong>Type:</strong> ${template.type}</p>
                                <p><strong>Category:</strong> ${template.category}</p>
                                <p>${template.description}</p>
                                <span class="rarity rarity-${template.rarity}">${template.rarity}</span>
                            </div>
                        `).join('');
                        
                        if (append) {
                            container.innerHTML += templatesHtml;
                        } else {
                            container.innerHTML = templatesHtml;
                        }
                        
                        // Update offset for pagination
                        templateOffset = offset + templates.length;
                    })
                    .catch(error => console.error('Error fetching item templates:', error));
            }
            
            // Item categories tab functions
            function updateCategoryStats() {
                fetch('/api/item-templates')
                    .then(response => response.json())
                    .then(templates => {
                        const statsDiv = document.getElementById('categories-stats');
                        
                        // Count items by category and rarity
                        const categories = {};
                        const rarities = {};
                        
                        templates.forEach(template => {
                            // Count by category
                            if (!categories[template.category]) {
                                categories[template.category] = 0;
                            }
                            categories[template.category]++;
                            
                            // Count by rarity
                            if (!rarities[template.rarity]) {
                                rarities[template.rarity] = 0;
                            }
                            rarities[template.rarity]++;
                        });
                        
                        // Create stats summary
                        statsDiv.innerHTML = `
                            <p><strong>Total Templates:</strong> ${templates.length}</p>
                            <p><strong>Total Categories:</strong> ${Object.keys(categories).length}</p>
                            <p><strong>Total Rarities:</strong> ${Object.keys(rarities).length}</p>
                        `;
                        
                        // Create category breakdown
                        const categoryDiv = document.getElementById('category-breakdown');
                        categoryDiv.innerHTML = Object.entries(categories)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, count]) => `
                                <div class="stat-box" style="background-color: ${getCategoryColor(category)};">
                                    <h3>${count}</h3>
                                    <p>${category}</p>
                                </div>
                            `).join('');
                        
                        // Create rarity breakdown
                        const rarityDiv = document.getElementById('rarity-breakdown');
                        rarityDiv.innerHTML = Object.entries(rarities)
                            .sort((a, b) => {
                                const rarityOrder = {
                                    'Common': 0,
                                    'Uncommon': 1,
                                    'Rare': 2,
                                    'Epic': 3,
                                    'Legendary': 4,
                                    'Mythic': 5,
                                    'Unique': 6
                                };
                                return rarityOrder[a[0]] - rarityOrder[b[0]];
                            })
                            .map(([rarity, count]) => `
                                <div class="stat-box" style="background-color: ${getRarityColor(rarity)};">
                                    <h3>${count}</h3>
                                    <p>${rarity}</p>
                                </div>
                            `).join('');
                    })
                    .catch(error => console.error('Error fetching category stats:', error));
            }
            
            function getCategoryColor(category) {
                const colors = {
                    'sci-fi': '#3498db',
                    'fantasy': '#9b59b6',
                    'mechanical': '#e67e22',
                    'scientific': '#2ecc71',
                    'ancient': '#f1c40f',
                    'futuristic': '#1abc9c',
                    'magical': '#e84393',
                    'technological': '#0984e3',
                    'alien': '#00b894',
                    'mystical': '#6c5ce7'
                };
                return colors[category] || '#95a5a6';
            }
            
            function getRarityColor(rarity) {
                const colors = {
                    'Common': '#aaa',
                    'Uncommon': '#2ecc71',
                    'Rare': '#3498db',
                    'Epic': '#9b59b6',
                    'Legendary': '#f39c12',
                    'Mythic': '#e74c3c',
                    'Unique': '#1abc9c'
                };
                return colors[rarity] || '#95a5a6';
            }
            
            // Event listeners
            document.getElementById('filter-templates').addEventListener('click', () => {
                templateOffset = 0;
                loadItemTemplates(0, false);
            });
            
            document.getElementById('load-more-templates').addEventListener('click', () => {
                loadItemTemplates(templateOffset, true);
            });
            
            // Initial updates
            updateRobotStatus();
            updateInventoryStats();
            updateItemsTable();
            loadItemTemplates();
            updateCategoryStats();
            
            // Update game data every 5 seconds
            setInterval(() => {
                if (document.querySelector('.tab[data-tab="game-data"]').classList.contains('active')) {
                    updateRobotStatus();
                    updateInventoryStats();
                    updateItemsTable();
                }
            }, 5000);
        </script>
    </body>
    </html>
    '''

# Server status endpoint
@app.route('/api/server/status', methods=['GET'])
def server_status():
    uptime = time.time() - server_start_time
    hours, remainder = divmod(uptime, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    status_data = {
        'status': 'running',
        'uptime': f"{int(hours)}h {int(minutes)}m {int(seconds)}s",
        'uptime_seconds': uptime,
        'request_count': request_count,
        'database_path': os.path.abspath(DB_PATH),
        'database_size': os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0,
        'timestamp': datetime.now().isoformat()
    }
    
    # Get database stats
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get robot state count
        cursor.execute('SELECT COUNT(*) FROM robot_state')
        robot_state_count = cursor.fetchone()[0]
        
        # Get inventory item count
        cursor.execute('SELECT COUNT(*) FROM inventory_items')
        inventory_item_count = cursor.fetchone()[0]
        
        status_data['database_stats'] = {
            'robot_state_entries': robot_state_count,
            'inventory_items': inventory_item_count
        }
        
        conn.close()
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        status_data['database_stats'] = {
            'error': str(e)
        }
    
    return jsonify(status_data)

# Health check endpoint for simple connectivity tests
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    try:
        logger.info("Starting game database server on port 5000...")
        logger.info(f"Database path: {os.path.abspath(DB_PATH)}")
        app.run(host='0.0.0.0', port=5000, threaded=True)
    except Exception as e:
        logger.critical(f"Failed to start server: {str(e)}")
        logger.critical(traceback.format_exc())
        sys.exit(1)
