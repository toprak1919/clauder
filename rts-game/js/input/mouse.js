import * as THREE from 'three';
import { scene, camera, selectedUnits, buildMode } from '../core/init.js';
import { onWindowResize } from '../core/init.js';
import { addToSelection, selectUnitsInBox, moveSelectedUnits } from '../ui/selection.js';
import { showBuildingOptions } from '../ui/interface.js';
import { updateBuildingPreview, exitBuildMode, placeBuildingHandler } from '../buildings/building.js';
import { enterBuildMode } from '../buildings/building.js';
import { onKeyDown } from './keyboard.js';

// Mouse state
let mouseDown = false;
let selectionStart = { x: 0, y: 0 };
let currentMousePosition = { x: 0, y: 0 };
// Track the currently highlighted object locally in this file
let currentHighlightedObject = null;

// Setup event listeners for user input
export function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Handle mouse down event
export function onMouseDown(event) {
    console.log("Mouse down event fired");
    
    if (event.button === 0) { // Left mouse button
        mouseDown = true;
        selectionStart.x = event.clientX;
        selectionStart.y = event.clientY;
        
        // Clear selection on new click (unless shift is held)
        if (!event.shiftKey) {
            console.log("Clearing selection (shift not held)");
            selectedUnits.forEach(unit => {
                // Visual deselection
                unit.material.emissive.set(0x000000);
            });
            selectedUnits = [];
        }
        
        // Show selection box
        const selectionBox = document.getElementById('selection-box');
        selectionBox.style.left = `${selectionStart.x}px`;
        selectionBox.style.top = `${selectionStart.y}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
        
        try {
            // Check for direct unit/building selection
            const intersects = getIntersects(event);
            
            if (intersects.length > 0) {
                const selected = intersects[0].object;
                console.log("Selected object:", selected);
                
                // Handle building in build mode
                if (buildMode.active && selected.name === 'terrain') {
                    console.log("Placing building on terrain");
                    placeBuildingHandler(event);
                    return;
                }
                
                // Select player units and buildings
                if (selected.userData.faction === 'player') {
                    if (selected.userData.type === 'unit') {
                        console.log("Adding unit to selection");
                        addToSelection(selected);
                    } else if (selected.userData.type === 'building') {
                        console.log("Showing building options");
                        // Show building production options
                        showBuildingOptions(selected);
                    }
                }
            }
        } catch (error) {
            console.error("Error in onMouseDown:", error);
        }
    } else if (event.button === 2) { // Right mouse button
        // Handle right-click actions
        if (selectedUnits.length > 0) {
            try {
                const intersects = getIntersects(event);
                
                if (intersects.length > 0) {
                    const target = intersects[0].object;
                    
                    if (target.userData.faction === 'enemy') {
                        // Attack enemy
                        selectedUnits.forEach(unit => {
                            unit.userData.targetEntity = target;
                            unit.userData.state = 'attacking';
                        });
                    } else {
                        // Move to position
                        const targetPosition = intersects[0].point;
                        moveSelectedUnits(targetPosition);
                    }
                }
            } catch (error) {
                console.error("Error in right-click handling:", error);
            }
        }
        
        // Exit build mode on right-click
        if (buildMode.active) {
            exitBuildMode();
        }
    }
}

// Handle mouse up event
export function onMouseUp(event) {
    if (event.button === 0) { // Left mouse button
        mouseDown = false;
        
        // Hide selection box
        const selectionBox = document.getElementById('selection-box');
        selectionBox.style.display = 'none';
        
        // If box selection
        if (Math.abs(event.clientX - selectionStart.x) > 10 || Math.abs(event.clientY - selectionStart.y) > 10) {
            // Get units in selection box
            selectUnitsInBox(selectionStart, { x: event.clientX, y: event.clientY });
        }
    }
}

// Handle mouse move event
export function onMouseMove(event) {
    currentMousePosition.x = event.clientX;
    currentMousePosition.y = event.clientY;
    
    // Update selection box if dragging
    if (mouseDown) {
        const selectionBox = document.getElementById('selection-box');
        const width = event.clientX - selectionStart.x;
        const height = event.clientY - selectionStart.y;
        
        selectionBox.style.width = `${Math.abs(width)}px`;
        selectionBox.style.height = `${Math.abs(height)}px`;
        selectionBox.style.left = `${width > 0 ? selectionStart.x : event.clientX}px`;
        selectionBox.style.top = `${height > 0 ? selectionStart.y : event.clientY}px`;
    }
    
    // Update building preview in build mode
    if (buildMode.active) {
        updateBuildingPreview(event);
    }
    
    // Update hovering
    try {
        updateObjectHighlighting(event);
    } catch (error) {
        console.error("Error in hover effect:", error);
    }
}

// Get intersected objects from mouse event
export function getIntersects(event) {
    try {
        // Create raycaster
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Convert mouse position to normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        // Get intersected objects - use a copy to avoid modification of original array
        return [...raycaster.intersectObjects(scene.children, true)];
    } catch (error) {
        console.error("Error in getIntersects:", error);
        return [];
    }
}

// Update object highlighting directly without shared state
function updateObjectHighlighting(event) {
    // First, remove highlight from the current object if it exists
    if (currentHighlightedObject && currentHighlightedObject.material) {
        currentHighlightedObject.material.opacity = 1;
        currentHighlightedObject = null;
    }
    
    try {
        // Get object under cursor
        const intersects = getIntersects(event);
        
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Only highlight selectable objects
            if (object && (object.userData.type === 'unit' || object.userData.type === 'building')) {
                currentHighlightedObject = object;
                
                // Apply hover effect directly to the object
                if (currentHighlightedObject.material) {
                    currentHighlightedObject.material.transparent = true;
                    currentHighlightedObject.material.opacity = 0.8;
                }
            }
        }
    } catch (error) {
        console.error("Error updating object highlighting:", error);
    }
}

// Rename updateHoveredObject to avoid any confusion or calls to old function
export function updateHoveredObject(event) {
    updateObjectHighlighting(event);
}