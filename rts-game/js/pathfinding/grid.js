import * as THREE from 'three';
import { scene, GAME_SIZE, MAP_SIZE, TILE_SIZE } from '../core/init.js';

// Generate pathfinding grid based on terrain height
export function generatePathfindingGrid(terrainGeometry) {
    // Create a new grid instead of reassigning the imported one
    window.pathfindingGrid = Array(MAP_SIZE).fill().map(() => Array(MAP_SIZE).fill(1)); // 1 means walkable
    
    const vertices = terrainGeometry.attributes.position.array;
    const indices = terrainGeometry.index.array;
    
    // Mark steep areas as unwalkable
    for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3;
        const b = indices[i + 1] * 3;
        const c = indices[i + 2] * 3;
        
        const y1 = vertices[a + 1];
        const y2 = vertices[b + 1];
        const y3 = vertices[c + 1];
        
        // Calculate slope
        const maxDiff = Math.max(Math.abs(y1 - y2), Math.abs(y2 - y3), Math.abs(y1 - y3));
        
        if (maxDiff > 4) { // If slope is too steep
            const x1 = (vertices[a] + GAME_SIZE / 2) / TILE_SIZE;
            const z1 = (vertices[a + 2] + GAME_SIZE / 2) / TILE_SIZE;
            
            const x2 = (vertices[b] + GAME_SIZE / 2) / TILE_SIZE;
            const z2 = (vertices[b + 2] + GAME_SIZE / 2) / TILE_SIZE;
            
            const x3 = (vertices[c] + GAME_SIZE / 2) / TILE_SIZE;
            const z3 = (vertices[c + 2] + GAME_SIZE / 2) / TILE_SIZE;
            
            // Mark area as unwalkable
            markUnwalkableArea(Math.floor(x1), Math.floor(z1));
            markUnwalkableArea(Math.floor(x2), Math.floor(z2));
            markUnwalkableArea(Math.floor(x3), Math.floor(z3));
        }
    }
    
    // Visualize pathfinding grid (for debugging)
    visualizePathfindingGrid();
}

// Mark an area as unwalkable in the pathfinding grid
export function markUnwalkableArea(x, z) {
    if (x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE) {
        window.pathfindingGrid[z][x] = 0; // 0 means unwalkable
    }
}

// Mark building area in pathfinding grid
export function markBuildingArea(building, value) {
    // Get building dimensions
    const size = building.geometry.parameters;
    const width = size.width || size.radiusTop * 2;
    const depth = size.depth || size.radiusTop * 2;
    
    // Get grid coordinates
    const centerX = Math.floor((building.position.x + GAME_SIZE / 2) / TILE_SIZE);
    const centerZ = Math.floor((building.position.z + GAME_SIZE / 2) / TILE_SIZE);
    
    const halfWidthTiles = Math.ceil(width / (2 * TILE_SIZE));
    const halfDepthTiles = Math.ceil(depth / (2 * TILE_SIZE));
    
    // Mark grid cells
    for (let z = centerZ - halfDepthTiles; z <= centerZ + halfDepthTiles; z++) {
        for (let x = centerX - halfWidthTiles; x <= centerX + halfWidthTiles; x++) {
            if (x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE) {
                window.pathfindingGrid[z][x] = value;
            }
        }
    }
}

// Visualize pathfinding grid (for debugging)
export function visualizePathfindingGrid() {
    // This is a debugging function, can be implemented if needed
    // It would create a visual representation of the pathfinding grid
}