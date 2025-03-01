# Game Architecture

This document explains the architecture and code organization of the Command & Strategy RTS game.

## Directory Structure
rts-game/
├── assets/
│   ├── textures/
│   ├── models/
│   └── sounds/
├── css/
│   └── styles.css
└── js/
├── core/
│   ├── engine.js
│   ├── init.js
│   └── resources.js
├── terrain/
│   ├── generator.js
│   ├── simplex.js
│   └── fogOfWar.js
├── units/
│   ├── unit.js
│   ├── harvester.js
│   └── tank.js
├── buildings/
│   ├── building.js
│   ├── commandCenter.js
│   ├── warFactory.js
│   └── powerPlant.js
├── combat/
│   ├── combat.js
│   ├── projectile.js
│   └── effects.js
├── ai/
│   ├── ai.js
│   └── behavior.js
├── ui/
│   ├── interface.js
│   ├── minimap.js
│   └── selection.js
├── input/
│   ├── mouse.js
│   └── keyboard.js
├── pathfinding/
│   ├── astar.js
│   └── grid.js
└── utils/
├── math.js
└── helpers.js
Copy
## Core Systems

### Initialization and Game Loop

The game's initialization and main loop are managed by `core/init.js` and `core/engine.js`. The initialization script sets up the Three.js scene, camera, renderer, and basic game state. The engine manages the game loop with the `animate()` function, which updates game logic and renders the scene.

### Resource Management

Resources are managed in `core/resources.js`, which tracks player and AI credits and power. The module handles resource collection, spending, and updating the UI to display current resource values.

## Rendering and Visuals

The game uses Three.js for 3D rendering, with terrain generation using Simplex noise to create natural-looking landscapes. The terrain is divided into a grid for pathfinding and building placement.

### Fog of War

The fog of war system (`terrain/fogOfWar.js`) uses a shader to obscure unexplored areas of the map. It tracks explored and visible areas based on unit positions and vision ranges.

## Game Entities

### Units

Units are managed in the `units/` directory, with a base implementation in `unit.js` and specialized behavior in unit-specific files. Each unit has properties like health, attack, range, and speed, as well as a state machine for controlling behavior.

### Buildings

Buildings are managed in the `buildings/` directory, following a similar pattern to units. The base implementation is in `building.js`, with specialized building types in separate files. Buildings can construct units and provide resources or power.

## Game Systems

### Combat

The combat system (`combat/` directory) handles damage calculation, projectile creation and animation, and visual effects like explosions and impacts.

### Pathfinding

Movement and navigation use the A* pathfinding algorithm (`pathfinding/astar.js`), with a grid-based representation of the terrain. The system handles obstacles, terrain height, and efficient path calculation.

### AI

The AI system (`ai/` directory) controls enemy behavior, with different states for building, expanding, and attacking. The AI manages resources, constructs buildings, produces units, and coordinates attacks on the player.

### User Interface

The UI system (`ui/` directory) manages the game interface, including unit selection, command buttons, resource display, and minimap. It also handles unit health bars and building production interfaces.

### Input Handling

Input handling (`input/` directory) manages mouse and keyboard events, including selection, movement commands, and hotkeys for unit groups.

## Data Flow

1. Input handling captures user actions
2. Game logic processes actions, updating entity states
3. Entities act according to their states (moving, attacking, harvesting)
4. Rendering system displays the current game state
5. AI system processes enemy decisions
6. The game loop continues the cycle

## Extending the Game

The modular architecture makes it easy to extend the game:

- Add new unit types by creating a new file in `units/`
- Add new building types by creating a new file in `buildings/`
- Enhance the AI by modifying behavior in `ai/behavior.js`
- Add new visual effects in `combat/effects.js`

See the [EXTENDING.md](EXTENDING.md) file for detailed instructions on adding new features