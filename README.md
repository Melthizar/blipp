# Blipp Robot Game

A game featuring a robot that explores, digs, and collects items in a procedurally generated world.

![Robot Game Screenshot](Screenshot.jpg)

## Overview
This project is based on the original robot platformer game, which has been modularized for better code organization and maintainability. The game features robust physics, procedural generation, and an AI-controlled robot.

## Project Structure
The project has been modularized for better code organization and maintainability:
- `index.html` - Main entry point for the modularized version
- `css/styles.css` - Extracted CSS styles
- `js/` - Contains modularized JavaScript components:
  - `main.js` - Game initialization and main loop
  - `world.js` - World generation and management
  - `robot.js` - Robot entity with physics, AI, and collision detection
  - `inventory.js` - Inventory system with item generation
  - `renderer.js` - Graphics rendering system

## Getting Started
- Clone this repository: `git clone https://github.com/Melthizar/blipp.git`
- Open `index.html` in a web browser to play the game

## Features
- Procedurally generated world with distinct rock layers
- Advanced physics with robust collision detection
- Robot with AI behavior for movement and digging
- Inventory system for collected items
- Infinite world generation with scrolling
- Jetpack system with energy management and visual effects
  - Energy bar display
  - Particle effects for jetpack flames
  - AI-controlled usage
- Clean visual design with solid color blocks and subtle highlights

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Contributions are welcome! Feel free to submit a Pull Request.
