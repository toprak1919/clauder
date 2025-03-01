import * as THREE from 'three';
import { scene, camera, units, selectedUnits } from '../core/init.js';
import { getIntersects } from '../input/mouse.js';
import { calculatePath } from '../pathfinding/astar.js';

// Add a unit to selection
export function addToSelection(unit) {
    // Check if already selected
    if (selectedUnits.includes(unit)) {
        return;
    }
    
    // Add to selection
    selectedUnits.push(unit);
    
    // Visual selection
    unit.material.emissive.set(0x222222);
}

// Select units in box
export function selectUnitsInBox(start, end) {
    // Calculate screen-space bounds
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    // Check each player unit
    units.player.forEach(unit => {
        // Convert 3D position to screen space
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(unit.matrixWorld);
        vector.project(camera);
        
        const screenX = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Check if unit is in selection box
        if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
            addToSelection(unit);
        }
    });
}

// Move selected units to target position
export function moveSelectedUnits(targetPosition) {
    // Calculate deployment positions
    const unitCount = selectedUnits.length;
    const positions = calculateGroupPositions(targetPosition, unitCount);
    
    // Assign each unit a position
    selectedUnits.forEach((unit, index) => {
        const path = calculatePath(unit, positions[index]);
        
        if (path.length > 0) {
            unit.userData.path = path;
            unit.userData.state = 'moving';
            unit.userData.targetEntity = null;
        }
    });
}

// Calculate positions for group movement (formation)
export function calculateGroupPositions(center, count) {
    const positions = [];
    const spacing = 15; // Space between units
    
    if (count === 1) {
        positions.push(center.clone());
        return positions;
    }
    
    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    
    // Calculate offset to center the formation
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;
    
    let index = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (index < count) {
                positions.push(new THREE.Vector3(
                    center.x + (col * spacing) - offsetX,
                    center.y,
                    center.z + (row * spacing) - offsetZ
                ));
                index++;
            }
        }
    }
    
    return positions;
}