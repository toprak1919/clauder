import { buildings } from './init.js';

// Resources state
export let resources = { 
    player: { credits: 2000, power: 100 }, 
    enemy: { credits: 2000, power: 100 } 
};

// Extended debug logging for resources initialization
console.log("Resources module loaded and initialized:", JSON.stringify(resources));

// Add a function to verify resources are valid
export function verifyResources() {
    if (!resources || !resources.player || !resources.enemy) {
        console.error("Resources are invalid:", resources);
        // Re-initialize resources if they're invalid
        resources = { 
            player: { credits: 2000, power: 100 }, 
            enemy: { credits: 2000, power: 100 } 
        };
        console.log("Resources re-initialized:", resources);
    }
    return resources;
}

// Update resources
export function updateResources() {
    // Verify resources are valid before updating
    verifyResources();
    
    // Update resource display
    document.getElementById('credits').textContent = resources.player.credits;
    document.getElementById('power').textContent = resources.player.power;
    
    // Calculate power for each faction
    for (const faction in resources) {
        let powerGeneration = 0;
        let powerConsumption = 0;
        
        buildings[faction].forEach(building => {
            if (!building.userData.isConstructing) {
                powerGeneration += building.userData.powerGeneration;
                powerConsumption += building.userData.powerConsumption;
            }
        });
        
        resources[faction].power = powerGeneration - powerConsumption;
    }
    
    // Handle AI resources (give them a steady income)
    if (frameCount % 60 === 0) { // Once per second
        resources.enemy.credits += 10;
    }
    
    frameCount++;
}

// Get building cost
export function getBuildingCost(buildingType) {
    switch (buildingType) {
        case 'commandCenter':
            return 1500;
        case 'barracks':
            return 500;
        case 'warFactory':
            return 800;
        case 'powerPlant':
            return 300;
        default:
            return 1000;
    }
}

let frameCount = 0;