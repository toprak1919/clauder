import * as THREE from 'three';
import { GAME_SIZE, TILE_SIZE, MAP_SIZE } from '../core/init.js';

// Calculate path for unit to target
export function calculatePath(unit, targetPosition) {
    const grid = window.pathfindingGrid;
    if (!grid) return [];
    
    // A* pathfinding
    const startX = Math.floor((unit.position.x + GAME_SIZE / 2) / TILE_SIZE);
    const startZ = Math.floor((unit.position.z + GAME_SIZE / 2) / TILE_SIZE);
    
    const endX = Math.floor((targetPosition.x + GAME_SIZE / 2) / TILE_SIZE);
    const endZ = Math.floor((targetPosition.z + GAME_SIZE / 2) / TILE_SIZE);
    
    // Check if start or end are valid
    if (startX < 0 || startX >= MAP_SIZE || startZ < 0 || startZ >= MAP_SIZE ||
        endX < 0 || endX >= MAP_SIZE || endZ < 0 || endZ >= MAP_SIZE) {
        return [];
    }
    
    // Check if end is walkable
    if (grid[endZ][endX] === 0) {
        // Try to find nearest walkable cell
        const nearestWalkable = findNearestWalkableCell(endX, endZ);
        if (nearestWalkable) {
            return aStarPathfinding(startX, startZ, nearestWalkable.x, nearestWalkable.z);
        }
        return [];
    }
    
    return aStarPathfinding(startX, startZ, endX, endZ);
}

// A* Pathfinding algorithm
export function aStarPathfinding(startX, startZ, endX, endZ) {
    const grid = window.pathfindingGrid;
    if (!grid) return [];
    
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = {};
    
    const gScore = {};
    const fScore = {};
    
    // Initialize start node
    gScore[`${startX},${startZ}`] = 0;
    fScore[`${startX},${startZ}`] = heuristic(startX, startZ, endX, endZ);
    
    openSet.push({
        x: startX,
        z: startZ,
        f: fScore[`${startX},${startZ}`]
    });
    
    while (openSet.length > 0) {
        // Sort by fScore and get lowest
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        
        // Check if we reached the goal
        if (current.x === endX && current.z === endZ) {
            // Reconstruct path
            const path = [];
            let currentKey = `${current.x},${current.z}`;
            
            while (cameFrom[currentKey]) {
                const [x, z] = currentKey.split(',').map(Number);
                path.unshift({
                    x: (x * TILE_SIZE) - (GAME_SIZE / 2) + (TILE_SIZE / 2),
                    z: (z * TILE_SIZE) - (GAME_SIZE / 2) + (TILE_SIZE / 2)
                });
                currentKey = cameFrom[currentKey];
            }
            
            return path;
        }
        
        // Add to closed set
        closedSet.add(`${current.x},${current.z}`);
        
        // Check neighbors
        const neighbors = [
            { x: current.x + 1, z: current.z },
            { x: current.x - 1, z: current.z },
            { x: current.x, z: current.z + 1 },
            { x: current.x, z: current.z - 1 },
            // Diagonals
            { x: current.x + 1, z: current.z + 1 },
            { x: current.x + 1, z: current.z - 1 },
            { x: current.x - 1, z: current.z + 1 },
            { x: current.x - 1, z: current.z - 1 }
        ];
        
        for (const neighbor of neighbors) {
            // Skip if out of bounds
            if (neighbor.x < 0 || neighbor.x >= MAP_SIZE || neighbor.z < 0 || neighbor.z >= MAP_SIZE) {
                continue;
            }
            
            // Skip if unwalkable
            if (grid[neighbor.z][neighbor.x] === 0) {
                continue;
            }
            
            // Skip if in closed set
            if (closedSet.has(`${neighbor.x},${neighbor.z}`)) {
                continue;
            }
            
            // Calculate movement cost (diagonal is more expensive)
            const isDiagonal = neighbor.x !== current.x && neighbor.z !== current.z;
            const movementCost = isDiagonal ? 1.414 : 1;
            
            // Calculate tentative gScore
            const tentativeGScore = gScore[`${current.x},${current.z}`] + movementCost;
            
            // If neighbor not in open set, add it
            const neighborKey = `${neighbor.x},${neighbor.z}`;
            const existingGScore = gScore[neighborKey];
            
            if (existingGScore === undefined || tentativeGScore < existingGScore) {
                // This path is better
                cameFrom[neighborKey] = `${current.x},${current.z}`;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = tentativeGScore + heuristic(neighbor.x, neighbor.z, endX, endZ);
                
                // Check if in open set
                const inOpenSet = openSet.find(n => n.x === neighbor.x && n.z === neighbor.z);
                if (!inOpenSet) {
                    openSet.push({
                        x: neighbor.x,
                        z: neighbor.z,
                        f: fScore[neighborKey]
                    });
                }
            }
        }
    }
    
    // No path found
    return [];
}

// Heuristic function for A* (Manhattan distance)
export function heuristic(x1, z1, x2, z2) {
    return Math.abs(x1 - x2) + Math.abs(z1 - z2);
}

// Find nearest walkable cell
export function findNearestWalkableCell(x, z) {
    const grid = window.pathfindingGrid;
    if (!grid) return null;
    
    // Search in expanding circles
    for (let radius = 1; radius < 10; radius++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                // Only check cells at current radius
                if (Math.abs(dx) !== radius && Math.abs(dz) !== radius) {
                    continue;
                }
                
                const nx = x + dx;
                const nz = z + dz;
                
                // Check boundaries
                if (nx < 0 || nx >= MAP_SIZE || nz < 0 || nz >= MAP_SIZE) {
                    continue;
                }
                
                // Check if walkable
                if (grid[nz][nx] === 1) {
                    return { x: nx, z: nz };
                }
            }
        }
    }
    
    return null;
}