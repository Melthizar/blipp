from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import os

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Database setup
DB_PATH = 'game_data.db'

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
        timestamp TEXT
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
    INSERT INTO inventory_items (name, type, prefix, color, symbol, timestamp)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ''', (item.get('name'), item.get('type'), item.get('prefix'), 
          item.get('color'), item.get('symbol')))
    
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "id": item_id})

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
            h1, h2 { color: #333; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
            .chart { height: 200px; margin-top: 20px; }
            .stat-box { display: inline-block; width: 120px; text-align: center; background: #007bff; color: white; padding: 15px; margin: 10px; border-radius: 5px; }
            .stat-box h3 { margin: 0; font-size: 24px; }
            .stat-box p { margin: 5px 0 0 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Blipp Game Dashboard</h1>
            
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
                            <th>Color</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="6">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <script>
            // Fetch and update data
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
                        
                        // Simple bar charts could be added here
                        // For a real implementation, you might want to use a library like Chart.js
                    })
                    .catch(error => console.error('Error fetching inventory stats:', error));
            }
            
            function updateItemsTable() {
                fetch('/api/inventory/items')
                    .then(response => response.json())
                    .then(items => {
                        const tableBody = document.querySelector('#items-table tbody');
                        if (items.length === 0) {
                            tableBody.innerHTML = '<tr><td colspan="6">No items collected yet</td></tr>';
                        } else {
                            tableBody.innerHTML = items.slice(0, 10).map(item => `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.name}</td>
                                    <td>${item.type}</td>
                                    <td>${item.prefix}</td>
                                    <td><span style="display:inline-block; width:20px; height:20px; background-color:${item.color}; border-radius:3px;"></span></td>
                                    <td>${item.timestamp}</td>
                                </tr>
                            `).join('');
                        }
                    })
                    .catch(error => console.error('Error fetching items:', error));
            }
            
            // Initial update
            updateRobotStatus();
            updateInventoryStats();
            updateItemsTable();
            
            // Update every 5 seconds
            setInterval(() => {
                updateRobotStatus();
                updateInventoryStats();
                updateItemsTable();
            }, 5000);
        </script>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(debug=True, port=5000)
