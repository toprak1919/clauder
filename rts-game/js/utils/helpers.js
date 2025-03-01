import { units, buildings, resourceNodes } from '../core/init.js';
import { getDistance } from './math.js';

// Find nearest enemy to a unit
export function findNearestEnemy(unit) {
    const enemyFaction = unit.userData.faction === 'player' ? 'enemy' : 'player';
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    // Check enemy units
    units[enemyFaction].forEach(enemy => {
        if (!enemy.visible) return; // Skip if not visible (fog of war)
        
        const distance = getDistance(unit, enemy);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    // Check enemy buildings
    buildings[enemyFaction].forEach(building => {
        if (!building.visible) return; // Skip if not visible (fog of war)
        
        const distance = getDistance(unit, building);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = building;
        }
    });
    
    return nearestEnemy;
}

// Find nearest resource node for harvester
export function findNearestResource(unit) {
    let nearestResource = null;
    let nearestDistance = Infinity;
    
    resourceNodes.forEach(node => {
        if (node.userData.amount <= 0) return; // Skip depleted nodes
        
        const distance = getDistance(unit, node);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestResource = node;
        }
    });
    
    return nearestResource;
}

// Find nearest refinery (command center or refinery building)
export function findNearestRefinery(unit) {
    const faction = unit.userData.faction;
    let nearestRefinery = null;
    let nearestDistance = Infinity;
    
    buildings[faction].forEach(building => {
        if (building.userData.buildingType === 'commandCenter' || 
            building.userData.buildingType === 'refinery') {
            
            const distance = getDistance(unit, building);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestRefinery = building;
            }
        }
    });
    
    return nearestRefinery;
}