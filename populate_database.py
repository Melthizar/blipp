#!/usr/bin/env python
# Database Population Script for Blipp Robot Game

import sqlite3
import os
import json
import random
from datetime import datetime

# Use the same database path as the server
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(SCRIPT_DIR, 'game_data.db')

print(f"Using database at: {DB_PATH}")

# Item categories
CATEGORIES = [
    "mineral", "tech", "artifact", "fossil", "crystal", "tool", "gem", "relic"
]

# Item rarities with weights
RARITIES = {
    "common": 60,
    "uncommon": 25,
    "rare": 10,
    "epic": 4,
    "legendary": 1
}

# Item colors by rarity
COLORS = {
    "common": ["#aaaaaa", "#cccccc", "#dddddd"],
    "uncommon": ["#55cc55", "#77dd77", "#88ee88"],
    "rare": ["#5555ff", "#7777ff", "#8888ff"],
    "epic": ["#aa55cc", "#bb66dd", "#cc77ee"],
    "legendary": ["#ffaa00", "#ffbb33", "#ffcc55"]
}

# Item prefixes by rarity
PREFIXES = {
    "common": ["Basic", "Simple", "Crude", "Plain", "Ordinary"],
    "uncommon": ["Decent", "Solid", "Sturdy", "Refined", "Quality"],
    "rare": ["Superior", "Exceptional", "Remarkable", "Excellent", "Valuable"],
    "epic": ["Exquisite", "Magnificent", "Astounding", "Wondrous", "Mythical"],
    "legendary": ["Ancient", "Legendary", "Divine", "Celestial", "Transcendent"]
}

# Item templates by category
ITEM_TEMPLATES = {
    "mineral": [
        {"name": "Iron Ore", "symbol": "⛏", "description": "A common metal ore"},
        {"name": "Copper Ore", "symbol": "⛏", "description": "A conductive metal ore"},
        {"name": "Gold Nugget", "symbol": "⛏", "description": "A precious metal"},
        {"name": "Silver Chunk", "symbol": "⛏", "description": "A shiny metal"},
        {"name": "Coal", "symbol": "⛏", "description": "A fossil fuel"},
        {"name": "Uranium", "symbol": "☢", "description": "A radioactive element"}
    ],
    "tech": [
        {"name": "Circuit Board", "symbol": "⚙", "description": "Electronic component"},
        {"name": "Power Cell", "symbol": "🔋", "description": "Energy storage device"},
        {"name": "Memory Chip", "symbol": "⚙", "description": "Data storage component"},
        {"name": "Quantum Processor", "symbol": "⚙", "description": "Advanced computing unit"},
        {"name": "Nano Fabricator", "symbol": "⚙", "description": "Microscopic manufacturing device"}
    ],
    "artifact": [
        {"name": "Ancient Tablet", "symbol": "📜", "description": "Inscribed with unknown symbols"},
        {"name": "Strange Device", "symbol": "🔮", "description": "Purpose unknown"},
        {"name": "Alien Relic", "symbol": "👽", "description": "Not of this world"},
        {"name": "Lost Technology", "symbol": "⚙", "description": "Advanced beyond current understanding"},
        {"name": "Time Capsule", "symbol": "⏱", "description": "Contains items from another era"}
    ],
    "fossil": [
        {"name": "Dinosaur Bone", "symbol": "🦴", "description": "Prehistoric remains"},
        {"name": "Amber", "symbol": "💎", "description": "Fossilized tree resin"},
        {"name": "Petrified Wood", "symbol": "🌳", "description": "Wood turned to stone"},
        {"name": "Ancient Shell", "symbol": "🐚", "description": "Remains of prehistoric sea creature"},
        {"name": "Trilobite", "symbol": "🦂", "description": "Ancient arthropod"}
    ],
    "crystal": [
        {"name": "Quartz", "symbol": "💎", "description": "Common crystal"},
        {"name": "Amethyst", "symbol": "💎", "description": "Purple variety of quartz"},
        {"name": "Emerald", "symbol": "💎", "description": "Green gemstone"},
        {"name": "Ruby", "symbol": "💎", "description": "Red gemstone"},
        {"name": "Sapphire", "symbol": "💎", "description": "Blue gemstone"},
        {"name": "Diamond", "symbol": "💎", "description": "Hardest natural substance"}
    ],
    "tool": [
        {"name": "Wrench", "symbol": "🔧", "description": "Mechanical tool"},
        {"name": "Hammer", "symbol": "🔨", "description": "Striking tool"},
        {"name": "Screwdriver", "symbol": "🔩", "description": "Fastening tool"},
        {"name": "Drill", "symbol": "⚒", "description": "Boring tool"},
        {"name": "Saw", "symbol": "⚒", "description": "Cutting tool"}
    ],
    "gem": [
        {"name": "Ruby", "symbol": "💎", "description": "Red precious stone"},
        {"name": "Sapphire", "symbol": "💎", "description": "Blue precious stone"},
        {"name": "Emerald", "symbol": "💎", "description": "Green precious stone"},
        {"name": "Diamond", "symbol": "💎", "description": "Clear precious stone"},
        {"name": "Topaz", "symbol": "💎", "description": "Yellow precious stone"}
    ],
    "relic": [
        {"name": "Ancient Coin", "symbol": "🪙", "description": "Currency from a lost civilization"},
        {"name": "Mysterious Key", "symbol": "🔑", "description": "Opens an unknown lock"},
        {"name": "Sacred Amulet", "symbol": "📿", "description": "Holds unknown powers"},
        {"name": "Forgotten Crown", "symbol": "👑", "description": "Once worn by royalty"},
        {"name": "Ancient Scroll", "symbol": "📜", "description": "Contains lost knowledge"}
    ]
}

def generate_random_item():
    """Generate a random item based on templates"""
    # Select category and rarity
    category = random.choice(CATEGORIES)
    rarity = random.choices(list(RARITIES.keys()), weights=list(RARITIES.values()))[0]
    
    # Select a template from the category
    template = random.choice(ITEM_TEMPLATES[category])
    
    # Select prefix and color based on rarity
    prefix = random.choice(PREFIXES[rarity])
    color = random.choice(COLORS[rarity])
    
    # Create the item
    item = {
        "name": f"{template['name']}",
        "prefix": prefix,
        "type": category,
        "symbol": template["symbol"],
        "color": color,
        "rarity": rarity,
        "description": template["description"],
        "category": category,
        "timestamp": datetime.now().isoformat()
    }
    
    return item

def populate_database(num_items=50):
    """Populate the database with random items"""
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_items'")
    if not cursor.fetchone():
        print("Error: Database tables not initialized. Run the game_db.py server first.")
        conn.close()
        return False
    
    # Generate and insert items
    items_added = 0
    for _ in range(num_items):
        item = generate_random_item()
        
        try:
            cursor.execute('''
            INSERT INTO inventory_items (name, type, prefix, color, symbol, rarity, description, category, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item["name"], 
                item["type"], 
                item["prefix"], 
                item["color"], 
                item["symbol"], 
                item["rarity"],
                item["description"],
                item["category"],
                item["timestamp"]
            ))
            items_added += 1
        except sqlite3.Error as e:
            print(f"Error adding item: {e}")
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"Successfully added {items_added} items to the database.")
    return True

def check_database_contents():
    """Check what's in the database"""
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check inventory items
    cursor.execute("SELECT COUNT(*) FROM inventory_items")
    item_count = cursor.fetchone()[0]
    print(f"\nInventory items in database: {item_count}")
    
    # Get rarity distribution
    cursor.execute("SELECT rarity, COUNT(*) as count FROM inventory_items GROUP BY rarity ORDER BY count DESC")
    rarities = cursor.fetchall()
    if rarities:
        print("\nRarity distribution:")
        for rarity in rarities:
            print(f"  {rarity['rarity']}: {rarity['count']} items")
    
    # Get category distribution
    cursor.execute("SELECT category, COUNT(*) as count FROM inventory_items GROUP BY category ORDER BY count DESC")
    categories = cursor.fetchall()
    if categories:
        print("\nCategory distribution:")
        for category in categories:
            print(f"  {category['category']}: {category['count']} items")
    
    # Sample some items
    cursor.execute("SELECT * FROM inventory_items ORDER BY RANDOM() LIMIT 5")
    sample_items = cursor.fetchall()
    if sample_items:
        print("\nSample items:")
        for item in sample_items:
            print(f"  {item['prefix']} {item['name']} ({item['rarity']})")
    
    conn.close()

def main():
    print("==== Blipp Robot Game Database Population Tool ====\n")
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print("Database file not found. Make sure the game_db.py server has been run at least once.")
        return
    
    # Use default number of items
    num_items = 50
    print(f"Adding {num_items} items to the database...")
    
    # Populate the database
    if populate_database(num_items):
        # Check the database contents
        check_database_contents()

if __name__ == "__main__":
    main()
