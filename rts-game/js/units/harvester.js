import * as THREE from 'three';
import { resources } from '../core/resources.js';
import { resourceNodes } from '../core/init.js';
import { findNearestResource, findNearestRefinery } from '../utils/helpers.js';

// Harvest resource
export function harvestResource(unit) {
    if (!unit.userData.targetEntity || unit.userData.targetEntity.userData.amount <= 0) {
        // Find new resource if current one is depleted
        const nearestResource = findNearestResource(unit);
        if (nearestResource) {
            unit.userData.targetEntity = nearestResource;
            unit.userData.state = 'movingToResource';
        } else {
            unit.userData.state = 'idle';
        }
        return;
    }
    
    // Check if we're at resource capacity
    if (unit.userData.harvestedResources >= unit.userData.harvestCapacity) {
        // Return to base
        const refinery = findNearestRefinery(unit);
        if (refinery) {
            unit.userData.targetEntity = refinery;
            unit.userData.state = 'returningToBase';
        } else {
            unit.userData.state = 'idle';
        }
        return;
    }
    
    // Harvest resources
    const resource = unit.userData.targetEntity;
    const harvestAmount = Math.min(
        unit.userData.harvestRate,
        resource.userData.amount,
        unit.userData.harvestCapacity - unit.userData.harvestedResources
    );
    
    resource.userData.amount -= harvestAmount;
    unit.userData.harvestedResources += harvestAmount;
    
    // Shrink resource node as it depletes
    const depletion = 1 - (resource.userData.amount / 5000);
    resource.scale.set(1 - (depletion * 0.5), 1 - (depletion * 0.5), 1 - (depletion * 0.5));
    
    // Remove resource if depleted
    if (resource.userData.amount <= 0) {
        scene.remove(resource);
        const index = resourceNodes.indexOf(resource);
        if (index !== -1) {
            resourceNodes.splice(index, 1);
        }
        
        unit.userData.targetEntity = null;
        unit.userData.state = 'returningToBase';
    }
}

// Unload harvested resources at refinery
export function unloadResources(unit) {
    if (unit.userData.harvestedResources <= 0) {
        // Go back to harvesting
        const nearestResource = findNearestResource(unit);
        if (nearestResource) {
            unit.userData.targetEntity = nearestResource;
            unit.userData.state = 'movingToResource';
        } else {
            unit.userData.state = 'idle';
        }
        return;
    }
    
    // Add resources to player
    resources[unit.userData.faction].credits += unit.userData.harvestedResources;
    
    // Reset harvested resources
    unit.userData.harvestedResources = 0;
    
    // Go back to harvesting
    const nearestResource = findNearestResource(unit);
    if (nearestResource) {
        unit.userData.targetEntity = nearestResource;
        unit.userData.state = 'movingToResource';
    } else {
        unit.userData.state = 'idle';
    }
}