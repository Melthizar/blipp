#!/usr/bin/env python
# Simple Database Connection Test

import requests
import sys
import os
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000/api"

# Color output for Windows command prompt
def print_green(text):
    print(f"[SUCCESS] {text}")

def print_red(text):
    print(f"[ERROR] {text}")

def print_blue(text):
    print(f"[INFO] {text}")

def print_yellow(text):
    print(f"[WARNING] {text}")

def print_header(text):
    print("\n" + "=" * 60)
    print(f"{text.center(60)}")
    print("=" * 60 + "\n")

def check_connection():
    print_header("DATABASE CONNECTION TEST")
    print_blue(f"Testing connection to: {API_BASE_URL}")
    print_blue(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("\n")
    
    # Test basic connection
    try:
        start_time = time.time()
        response = requests.get(f"{API_BASE_URL}/health", timeout=3)
        end_time = time.time()
        response_time = (end_time - start_time) * 1000  # Convert to ms
        
        if response.status_code == 200:
            print_green(f"Connection successful! Response time: {response_time:.2f}ms")
            print_blue(f"Server response: {response.json()}")
            return True
        else:
            print_red(f"Connection failed with status code: {response.status_code}")
            print_yellow("Response content: " + response.text[:100])
            return False
    except requests.exceptions.ConnectionError:
        print_red("Connection error: Could not connect to the server")
        print_blue("Make sure the server is running with 'python game_db.py'")
        return False
    except requests.exceptions.Timeout:
        print_red("Connection timeout: Server took too long to respond")
        return False
    except Exception as e:
        print_red(f"Unexpected error: {str(e)}")
        return False

def check_server_status():
    print_header("SERVER STATUS CHECK")
    try:
        response = requests.get(f"{API_BASE_URL}/server/status", timeout=3)
        if response.status_code == 200:
            data = response.json()
            print_green("Server status check successful!")
            print_blue(f"Status: {data.get('status')}")
            print_blue(f"Uptime: {data.get('uptime')}")
            print_blue(f"Request count: {data.get('request_count')}")
            
            # Database stats
            db_stats = data.get('database_stats', {})
            if 'error' in db_stats:
                print_yellow(f"Database error: {db_stats['error']}")
            else:
                print_blue(f"Robot state entries: {db_stats.get('robot_state_entries', 0)}")
                print_blue(f"Inventory items: {db_stats.get('inventory_items', 0)}")
            return True
        else:
            print_red(f"Status check failed with status code: {response.status_code}")
            return False
    except Exception as e:
        print_red(f"Error checking server status: {str(e)}")
        return False

def main():
    connection_ok = check_connection()
    if connection_ok:
        check_server_status()
    
    print_header("TEST SUMMARY")
    if connection_ok:
        print_green("Database server is running and responding to requests")
        print_blue("You can now use the database in your game")
    else:
        print_red("Could not connect to the database server")
        print_yellow("Please start the server with 'python game_db.py'")
        print_yellow("Or run 'start_db_server.bat' to start the server")

if __name__ == "__main__":
    main()
