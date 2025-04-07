import sqlite3
import json
import os
import random
from datetime import datetime

# Database setup
DB_PATH = 'game_data.db'

# Make sure the database exists
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
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

# Initialize the database
init_db()

# Item categories
CATEGORIES = [
    "sci-fi",
    "fantasy",
    "mechanical",
    "scientific",
    "ancient",
    "futuristic",
    "magical",
    "technological",
    "alien",
    "mystical"
]

# Item types (objects)
ITEM_TYPES = [
    # Sci-Fi Items
    "Quantum Processor", "Plasma Converter", "Neural Interface", "Holographic Projector", "Anti-Gravity Module",
    "Warp Drive Component", "Cloaking Device", "Energy Cell", "Nanite Cluster", "Tachyon Emitter",
    "Fusion Core", "Teleportation Matrix", "Singularity Containment", "Phase Shifter", "Temporal Stabilizer",
    "Photonic Crystal", "Subspace Beacon", "Graviton Lens", "Positronic Brain", "Antimatter Capsule",
    
    # Fantasy Items
    "Dragon Scale", "Phoenix Feather", "Unicorn Horn", "Elven Rune", "Dwarven Gear",
    "Enchanted Gem", "Fairy Dust", "Wizard's Crystal", "Mermaid Pearl", "Goblin Trinket",
    "Troll Tooth", "Witch's Charm", "Spectral Essence", "Druidic Totem", "Celestial Fragment",
    "Arcane Sigil", "Fey Artifact", "Necromantic Relic", "Elemental Core", "Mystic Scroll",
    
    # Mechanical Items
    "Precision Gear", "Hydraulic Piston", "Clockwork Mechanism", "Steam Valve", "Sprocket Wheel",
    "Pressure Gauge", "Flywheel Assembly", "Mechanical Lever", "Tension Spring", "Rotary Encoder",
    "Differential Gear", "Camshaft", "Crankshaft", "Ball Bearing", "Pulley System",
    "Solenoid Actuator", "Turbine Blade", "Piston Ring", "Mechanical Relay", "Harmonic Balancer",
    
    # Scientific Items
    "Microscope Lens", "Chemical Catalyst", "Laboratory Flask", "Experimental Compound", "Research Sample",
    "Spectrum Analyzer", "Isotope Container", "Genetic Sequence", "Crystalline Structure", "Molecular Sieve",
    "Atomic Clock Component", "Laser Crystal", "Superconductor Coil", "Particle Filter", "Vacuum Tube",
    "Radiation Sensor", "Electromagnet Core", "Optical Prism", "Seismic Detector", "Barometric Cell",
    
    # Ancient Items
    "Fossilized Amber", "Hieroglyphic Tablet", "Prehistoric Tool", "Antediluvian Coin", "Primordial Artifact",
    "Ancestral Medallion", "Forgotten Relic", "Tribal Mask", "Stone Age Implement", "Antique Mechanism",
    "Archaic Symbol", "Primitive Circuit", "Lost Technology", "Ancient Power Source", "Timeworn Device",
    "Prehistoric Data Storage", "Proto-Mechanical Part", "First Civilization Tool", "Forgotten Knowledge Crystal", "Ancestral Power Core",
    
    # Alien Items
    "Xenomorph Tissue", "Extraterrestrial Alloy", "Non-Euclidean Object", "Alien Communication Device", "Otherworldly Crystal",
    "Interstellar Spore", "Unknown Element Sample", "Exobiological Specimen", "Alien Navigation Chart", "Xenotech Component",
    "Cosmic Entity Remnant", "Extradimensional Fragment", "Alien Power Source", "Stellar Cartography Tool", "Xenoarchaeological Artifact",
    "Alien Propulsion Part", "Extraterrestrial Data Core", "Unknown Symbiotic Organism", "Alien Terraforming Seed", "Interdimensional Beacon"
]

# Item prefixes
ITEM_PREFIXES = [
    # Common Prefixes
    "Ancient", "Rusty", "Glowing", "Mysterious", "Tiny", "Broken", "Golden", "Crystal", "Dark", "Alien",
    
    # Sci-Fi Prefixes
    "Quantum", "Nano", "Cybernetic", "Holographic", "Plasma", "Ionic", "Gravitonic", "Temporal", "Subspace", "Photonic",
    "Positronic", "Antimatter", "Warp", "Fusion", "Tachyon", "Singularity", "Dimensional", "Hyperspace", "Synthetic", "Bionic",
    
    # Fantasy Prefixes
    "Enchanted", "Arcane", "Magical", "Cursed", "Blessed", "Ethereal", "Spectral", "Eldritch", "Fey", "Celestial",
    "Infernal", "Draconic", "Elemental", "Runic", "Mystic", "Divine", "Demonic", "Astral", "Primordial", "Necromantic",
    
    # Mechanical Prefixes
    "Precision", "Clockwork", "Steam-Powered", "Hydraulic", "Mechanical", "Automated", "Geared", "Articulated", "Reinforced", "Calibrated",
    "Pressurized", "Balanced", "Tensioned", "Motorized", "Pneumatic", "Gyroscopic", "Oscillating", "Reciprocating", "Machined", "Turbocharged",
    
    # Scientific Prefixes
    "Experimental", "Prototype", "Theoretical", "Unstable", "Catalytic", "Radioactive", "Cryogenic", "Molecular", "Chemical", "Crystalline",
    "Isotopic", "Electromagnetic", "Quantum-Entangled", "Superconductive", "Thermodynamic", "Biochemical", "Genetic", "Relativistic", "Particle", "Atomic",
    
    # Condition Prefixes
    "Pristine", "Damaged", "Corroded", "Weathered", "Polished", "Tarnished", "Cracked", "Restored", "Preserved", "Deteriorated",
    
    # Origin Prefixes
    "Forgotten", "Lost", "Recovered", "Unearthed", "Salvaged", "Discovered", "Inherited", "Stolen", "Forbidden", "Legendary",
    "Mythical", "Fabled", "Renowned", "Infamous", "Revered", "Sacred", "Profane", "Contraband", "Classified", "Restricted"
]

# Rarity levels
RARITY_LEVELS = ["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Unique"]

# Description templates
DESCRIPTION_TEMPLATES = [
    "A {prefix} {type} from an unknown civilization.",
    "This {prefix} {type} emits a strange energy signature.",
    "The {prefix} {type} has unusual markings on its surface.",
    "A remarkably well-preserved {prefix} {type}.",
    "This {prefix} {type} appears to be of {category} origin.",
    "The {prefix} {type} hums softly when held.",
    "A {prefix} {type} with intricate designs etched into it.",
    "This {prefix} {type} seems to defy conventional physics.",
    "The {prefix} {type} is warm to the touch despite its environment.",
    "A {prefix} {type} that occasionally flickers in and out of existence.",
    "This {prefix} {type} contains microscopic circuitry of unknown purpose.",
    "The {prefix} {type} appears to be made of an unidentifiable material.",
    "A {prefix} {type} that seems to be much lighter than it should be.",
    "This {prefix} {type} has symbols that rearrange themselves when not observed directly.",
    "The {prefix} {type} gives off a faint scent of ozone.",
    "A {prefix} {type} that appears to be partially phased into another dimension.",
    "This {prefix} {type} has components that move on their own.",
    "The {prefix} {type} contains a liquid that defies gravity.",
    "A {prefix} {type} covered in symbols from a lost language.",
    "This {prefix} {type} changes color depending on who is holding it."
]

# Generate a large number of unique items
def generate_items(count=500):
    items = []
    
    for _ in range(count):
        item_type = random.choice(ITEM_TYPES)
        prefix = random.choice(ITEM_PREFIXES)
        
        # Determine a suitable category based on the item type
        if any(sci_term in item_type.lower() for sci_term in ["quantum", "plasma", "neural", "holographic", "gravity", "warp", "energy", "tachyon", "fusion"]):
            category = "sci-fi"
        elif any(fantasy_term in item_type.lower() for fantasy_term in ["dragon", "phoenix", "unicorn", "elven", "dwarven", "enchanted", "fairy", "wizard", "mermaid"]):
            category = "fantasy"
        elif any(mech_term in item_type.lower() for mech_term in ["gear", "piston", "clockwork", "valve", "wheel", "spring", "bearing", "shaft", "turbine"]):
            category = "mechanical"
        elif any(sci_term in item_type.lower() for sci_term in ["microscope", "chemical", "laboratory", "experimental", "research", "spectrum", "isotope", "genetic", "crystalline"]):
            category = "scientific"
        elif any(ancient_term in item_type.lower() for ancient_term in ["fossilized", "hieroglyphic", "prehistoric", "antediluvian", "primordial", "ancestral", "forgotten", "tribal", "stone", "antique"]):
            category = "ancient"
        elif any(alien_term in item_type.lower() for alien_term in ["xenomorph", "extraterrestrial", "alien", "otherworldly", "interstellar", "cosmic", "stellar", "xenotech", "interdimensional"]):
            category = "alien"
        else:
            category = random.choice(CATEGORIES)
        
        rarity = random.choice(RARITY_LEVELS)
        
        # Generate a description
        description = random.choice(DESCRIPTION_TEMPLATES).format(
            prefix=prefix.lower(),
            type=item_type.lower(),
            category=category
        )
        
        items.append({
            "name": f"{prefix} {item_type}",
            "type": item_type,
            "prefix": prefix,
            "rarity": rarity,
            "description": description,
            "category": category
        })
    
    return items

# Insert items into the database
def populate_database(items):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing items if needed
    cursor.execute('DELETE FROM item_templates')
    
    # Insert new items
    for item in items:
        cursor.execute('''
        INSERT INTO item_templates (name, type, prefix, rarity, description, category)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            item["name"],
            item["type"],
            item["prefix"],
            item["rarity"],
            item["description"],
            item["category"]
        ))
    
    conn.commit()
    print(f"Successfully added {len(items)} items to the database.")
    
    # Show some sample items
    cursor.execute('SELECT * FROM item_templates LIMIT 10')
    sample_items = cursor.fetchall()
    print("\nSample items:")
    for item in sample_items:
        print(f"ID: {item[0]}, Name: {item[1]}, Type: {item[2]}, Prefix: {item[3]}, Rarity: {item[4]}, Category: {item[6]}")
    
    conn.close()

# Generate and populate the database
items = generate_items(500)  # Generate 500 unique items
populate_database(items)

print("\nDatabase population complete!")
print(f"The database now contains {len(items)} unique item templates.")
print("You can now start the game and the database server to see these items in action.")
