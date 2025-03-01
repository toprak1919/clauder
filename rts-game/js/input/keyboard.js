import { buildMode, unitGroups, selectedUnits } from '../core/init.js';
import { exitBuildMode } from '../buildings/building.js';

// Handle key down event
export function onKeyDown(event) {
    // Cancel build mode with Escape
    if (event.key === 'Escape' && buildMode.active) {
        exitBuildMode();
    }
    
    // Hotkeys for unit groups
    if (event.ctrlKey && event.key >= '1' && event.key <= '9') {
        // Save selection to group
        const groupNum = parseInt(event.key);
        unitGroups[groupNum] = [...selectedUnits];
    } else if (event.key >= '1' && event.key <= '9') {
        // Recall group
        const groupNum = parseInt(event.key);
        if (unitGroups[groupNum] && unitGroups[groupNum].length > 0) {
            // Clear current selection
            selectedUnits.forEach(unit => {
                unit.material.emissive.set(0x000000);
            });
            
            // Select units from group (filtering out destroyed units)
            selectedUnits = unitGroups[groupNum].filter(unit => unit.parent);
            
            // Visual selection
            selectedUnits.forEach(unit => {
                unit.material.emissive.set(0x222222);
            });
        }
    }
}