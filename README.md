# Command & Strategy: 3D RTS Game

A real-time strategy game inspired by the Command & Conquer series, built with Three.js for 3D rendering in the browser.

![Game Screenshot](screenshot.jpg)

## Overview

Command & Strategy is a browser-based RTS game featuring base building, resource gathering, unit production, and combat mechanics. The game includes an isometric camera view, fog of war, basic AI, and support for various unit types.

## Features

- **3D Terrain**: Dynamically generated terrain with varied heights and features
- **Base Building**: Construct different buildings to expand your capabilities
- **Resource Gathering**: Collect resources with harvester units
- **Unit Production**: Train different unit types with unique abilities
- **Combat System**: Engage in tactical battles with projectiles and special effects
- **Fog of War**: Unexplored areas remain hidden until scouted
- **AI Opponent**: Computer-controlled enemy that builds a base and attacks
- **Pathfinding**: Units intelligently navigate around obstacles
- **Control Groups**: Group units for easier management

## Setup Instructions

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge recommended)
- No server needed - runs entirely in the browser

### Running the Game

1. Clone this repository:
git clone https://github.com/yourusername/command-strategy.git
cd command-strategy
Copy
2. Open `index.html` in your browser:
- Double-click the file
- Or use a simple local server:
  ```
  npx http-server
  ```
  Then navigate to `http://localhost:8080`

## Game Controls

- **Left Click**: Select units or buildings
- **Left Click + Drag**: Box select multiple units
- **Right Click**: Move selected units or attack enemy
- **Shift + Left Click**: Add to selection
- **Ctrl + 1-9**: Assign selection to control group
- **1-9 Keys**: Select control group
- **Escape**: Cancel building placement

## Credits

- Built with [Three.js](https://threejs.org/)
- Inspired by the Command & Conquer series

## License

MIT License