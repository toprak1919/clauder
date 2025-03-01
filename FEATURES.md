# Game Features

This document details the features and game mechanics of Command & Strategy.

## Terrain System

### Terrain Generation

The terrain is procedurally generated using Simplex noise, creating varied heights and natural-looking landscapes. The generation ensures:

- Natural elevation changes with hills and valleys
- Flatter areas in the center for base building
- Steeper terrain near the edges for strategic opportunities

### Terrain Interaction

- Units automatically adjust their height to the terrain
- Steep slopes are marked as unwalkable
- Buildings require flat areas for placement

## Resource System

### Resource Types

- **Credits**: Primary resource used for construction and unit production
- **Power**: Secondary resource provided by power plants, required for building operations

### Resource Collection

- Harvester units gather resources from Tiberium fields
- Harvesters have a capacity limit and must return to a Command Center to unload
- Resource nodes deplete over time and visually shrink

## Base Building

### Building Types

- **Command Center**: Main structure, can produce harvesters
- **Power Plant**: Generates power for your base
- **Barracks**: Produces infantry units (placeholder for future implementation)
- **War Factory**: Produces vehicles like tanks

### Building Mechanics

- Buildings require sufficient credits to construct
- Buildings have construction progress and visual feedback
- Completed buildings can be assigned rally points for produced units
- Buildings contribute to fog of war visibility

## Unit System

### Unit Types

- **Harvester**: Gathers resources from resource nodes
- **Light Tank**: Fast but lightly armored combat unit
- **Heavy Tank**: Slower but more powerful combat unit

### Unit Properties

- **Health**: Unit's hitpoints, displayed as a health bar
- **Attack**: Damage dealt in combat
- **Range**: Maximum attack distance
- **Speed**: Movement speed
- **Vision Range**: How far the unit can see

### Unit States

Units operate using a state machine with states including:
- Idle
- Moving
- Attacking
- Harvesting
- Returning to base
- Unloading resources

## Combat System

### Damage Calculation

Units deal damage based on their attack value, with no damage types or resistances in the current implementation.

### Visual Effects

- Projectiles with trails
- Impact effects
- Explosions for destroyed units/buildings
- Health bars that change color based on remaining health

## Fog of War

### Visibility Mechanics

- Unexplored areas are completely black
- Explored but not currently visible areas are darkened
- Areas in unit/building vision range are fully visible
- Enemy units are only visible when in your vision range

### Strategic Implications

- Encourages scouting and map exploration
- Enemy bases and resource nodes are hidden until discovered
- Provides opportunity for surprise attacks

## User Interface

### Main UI Elements

- Resource display (credits and power)
- Selected unit/building information
- Command buttons
- Minimap

### Selection System

- Individual unit selection
- Box selection for multiple units
- Unit groups for quick recall (Ctrl+1-9)

### Command System

- Movement commands
- Attack commands
- Harvest commands
- Building construction
- Unit production

## AI System

### AI Behavior States

- **Building**: Focus on infrastructure and resource collection
- **Expanding**: Construct additional structures
- **Attacking**: Target player structures and units

### AI Decision Making

The AI evaluates:
- Current resources
- Number of units
- Base infrastructure
- Tactical opportunities

### AI Unit Management

- Creates harvesters for resource collection
- Builds combat units for defense and offense
- Forms attack groups to target player base

## Pathfinding

### A* Algorithm

The game uses A* pathfinding for unit movement, considering:
- Terrain obstacles
- Building placement
- Other units (basic avoidance)

### Path Optimization

- Path smoothing for more natural movement
- Performance optimizations for handling multiple units
- Formation movement for groups

## Win Conditions

The victory condition is destruction of the enemy Command Center, while defeat occurs if your Command Center is destroyed.