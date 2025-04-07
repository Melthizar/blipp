#!/usr/bin/env python
# Database Server Test Script

import requests
import json
import time
import os
import sys
import sqlite3
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000/api"
DB_PATH = "game_data.db"

# ANSI Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 50}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(50)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 50}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def test_server_running():
    print_header("Testing Database Server Connection")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=3)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Server is running. Status: {data.get('status')}")
            print_info(f"Timestamp: {data.get('timestamp')}")
            return True
        else:
            print_error(f"Server returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Connection error: Could not connect to the server")
        print_info("Make sure the server is running with 'python game_db.py'")
        return False
    except requests.exceptions.Timeout:
        print_error("Connection timeout: Server took too long to respond")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_server_status():
    print_header("Testing Server Status Endpoint")
    try:
        response = requests.get(f"{API_BASE_URL}/server/status", timeout=3)
        if response.status_code == 200:
            data = response.json()
            print_success("Server status endpoint is working")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Uptime: {data.get('uptime')}")
            print_info(f"Request count: {data.get('request_count')}")
            
            # Database stats
            db_stats = data.get('database_stats', {})
            if 'error' in db_stats:
                print_warning(f"Database error: {db_stats['error']}")
            else:
                print_info(f"Robot state entries: {db_stats.get('robot_state_entries', 0)}")
                print_info(f"Inventory items: {db_stats.get('inventory_items', 0)}")
            return True
        else:
            print_error(f"Server returned status code: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error testing server status: {str(e)}")
        return False

def test_robot_state():
    print_header("Testing Robot State Endpoints")
    
    # Test GET robot state
    try:
        response = requests.get(f"{API_BASE_URL}/robot/state", timeout=3)
        if response.status_code == 200:
            print_success("GET robot state endpoint is working")
        else:
            print_error(f"GET robot state failed with status code: {response.status_code}")
    except Exception as e:
        print_error(f"Error testing GET robot state: {str(e)}")
    
    # Test POST robot state
    try:
        test_data = {
            "x": 100,
            "y": 200,
            "direction": 1,
            "isDigging": False,
            "isJumping": True
        }
        response = requests.post(
            f"{API_BASE_URL}/robot/state", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=3
        )
        if response.status_code == 200:
            print_success("POST robot state endpoint is working")
        else:
            print_error(f"POST robot state failed with status code: {response.status_code}")
    except Exception as e:
        print_error(f"Error testing POST robot state: {str(e)}")

def test_inventory_endpoints():
    print_header("Testing Inventory Endpoints")
    
    # Test add inventory item
    try:
        test_item = {
            "name": "Test Item",
            "type": "test",
            "prefix": "Shiny",
            "color": "#ff00ff",
            "symbol": "T",
            "rarity": "common"
        }
        response = requests.post(
            f"{API_BASE_URL}/inventory/add", 
            json=test_item,
            headers={"Content-Type": "application/json"},
            timeout=3
        )
        if response.status_code == 200:
            print_success("POST inventory/add endpoint is working")
        else:
            print_error(f"POST inventory/add failed with status code: {response.status_code}")
    except Exception as e:
        print_error(f"Error testing POST inventory/add: {str(e)}")
    
    # Test get random item
    try:
        response = requests.get(f"{API_BASE_URL}/inventory/random", timeout=3)
        if response.status_code == 200:
            item = response.json()
            print_success("GET inventory/random endpoint is working")
            print_info(f"Random item: {item.get('name', 'Unknown')}")
        else:
            print_error(f"GET inventory/random failed with status code: {response.status_code}")
    except Exception as e:
        print_error(f"Error testing GET inventory/random: {str(e)}")

def test_database_file():
    print_header("Testing Database File")
    
    # Check if database file exists
    if os.path.exists(DB_PATH):
        size_kb = os.path.getsize(DB_PATH) / 1024
        print_success(f"Database file exists: {DB_PATH}")
        print_info(f"Size: {size_kb:.2f} KB")
        print_info(f"Last modified: {datetime.fromtimestamp(os.path.getmtime(DB_PATH))}")
        
        # Try to open the database
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Check tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print_success(f"Successfully opened database connection")
            print_info(f"Tables found: {len(tables)}")
            
            for table in tables:
                table_name = table[0]
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print_info(f"Table '{table_name}': {count} rows")
            
            conn.close()
        except sqlite3.Error as e:
            print_error(f"SQLite error: {str(e)}")
    else:
        print_error(f"Database file does not exist: {DB_PATH}")
        print_info("The database file will be created when the server starts")

def run_all_tests():
    print_header("BLIPP DATABASE SERVER TEST SUITE")
    print_info(f"Testing server at: {API_BASE_URL}")
    print_info(f"Database path: {os.path.abspath(DB_PATH)}")
    print_info(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n")
    
    # Run tests
    server_running = test_server_running()
    
    if server_running:
        test_server_status()
        test_robot_state()
        test_inventory_endpoints()
    
    test_database_file()
    
    print_header("TEST SUMMARY")
    if server_running:
        print_success("Server is running and responding to requests")
        print_info("Check the detailed test results above for any issues")
    else:
        print_error("Server is not running or not responding")
        print_info("Try starting the server with 'python game_db.py'")
        print_info("Or run 'start_db_server.bat' to start the server")

if __name__ == "__main__":
    run_all_tests()
