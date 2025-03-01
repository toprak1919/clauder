import * as THREE from 'three';
import { aiState } from './ai.js';
import { resources } from '../core/resources.js';
import { buildings, units } from '../core/init.js';
import { isAreaClear } from '../buildings/building.js';
import { createBuilding } from '../buildings/building.js';
import { findNearestResource } from '../utils/helpers.js';

// AI action: Build units and structures
export function aiActionBuild() {
    // Check if we need more harvesters
    if (aiState.harvesters.length < 3 && resources.enemy.credits >= 800) {
        // Find a war factory to build harvester
        const warFactory = buildings.enemy.find(b => 
            b.userData.buildingType === 'warFactory' && !b.userData.isConstructing && !b.userData.isProducing
        );
        
        if (warFactory) {
            warFactory.userData.isProducing = true;
            warFactory.userData.productionType = 'harvester';
            resources.enemy.credits -= 800;
        } else {
            // Build a war factory if we don't have one
            const commandCenter = buildings.enemy.find(b => b.userData.buildingType === 'commandCenter');
            if (commandCenter && resources.enemy.credits >= 800) {
                const position = new THREE.Vector3(
                    commandCenter.position.x + 60,
                    0,
                    commandCenter.position.z
                );
                
                if (isAreaClear(position, 'warFactory')) {
                    createBuilding('warFactory', 'enemy', position);
                    resources.enemy.credits -= 800;
                }
            }
        }
    }
    
    // Build combat units if we have enough resources
    if (resources.enemy.credits >= 500) {
        // Find a war factory to build tanks
        const warFactory = buildings.enemy.find(b => 
            b.userData.buildingType === 'warFactory' && !b.userData.isConstructing && !b.userData.isProducing
        );
        
        if (warFactory) {
            warFactory.userData.isProducing = true;
            warFactory.userData.productionType = Math.random() > 0.3 ? 'lightTank' : 'heavyTank';
            resources.enemy.credits -= warFactory.userData.productionType === 'lightTank' ? 500 : 700;
        }
    }
    
    // Build power plants if low on power
    if (resources.enemy.power < 50 && resources.enemy.credits >= 300) {
        const commandCenter = buildings.enemy.find(b => b.userData.buildingType === 'commandCenter');
        if (commandCenter) {
            const position = new THREE.Vector3(
                commandCenter.position.x,
                0,
                commandCenter.position.z + 60
            );
            
            if (isAreaClear(position, 'powerPlant')) {
                createBuilding('powerPlant', 'enemy', position);
                resources.enemy.credits -= 300;
            }
        }
    }
}

// AI action: Expand base
export function aiActionExpand() {
    // Build new structures to expand base
    if (resources.enemy.credits >= 800) {
        const commandCenter = buildings.enemy.find(b => b.userData.buildingType === 'commandCenter');
        if (commandCenter) {
            // Decide on expansion direction
            let position;
            
            if (!aiState.expansion) {
                // First expansion: Build barracks
                position = new THREE.Vector3(
                    commandCenter.position.x - 60,
                    0,
                    commandCenter.position.z
                );
                
                if (isAreaClear(position, 'barracks')) {
                    createBuilding('barracks', 'enemy', position);
                    resources.enemy.credits -= 500;
                    aiState.expansion = true;
                }
            } else {
                // Second expansion: Build second war factory
                position = new THREE.Vector3(
                    commandCenter.position.x,
                    0,
                    commandCenter.position.z - 60
                );
                
                if (isAreaClear(position, 'warFactory')) {
                    createBuilding('warFactory', 'enemy', position);
                    resources.enemy.credits -= 800;
                }
            }
        }
    }
}

// AI action: Attack player
export function aiActionAttack() {
    // Gather attack force
    if (aiState.defenseForce.length >= 4) {
        // Move 4 units from defense to attack
        for (let i = 0; i < 4; i++) {
            if (i < aiState.defenseForce.length) {
                aiState.attackForce.push(aiState.defenseForce[i]);
                aiState.defenseForce[i].userData.state = 'attacking';
            }
        }
        
        // Order attack on player command center or nearest structure
        const playerCommandCenter = buildings.player.find(b => b.userData.buildingType === 'commandCenter');
        
        if (playerCommandCenter) {
            aiState.targetPlayer = playerCommandCenter;
        } else if (buildings.player.length > 0) {
            // Find nearest player building
            let nearestBuilding = null;
            let nearestDistance = Infinity;
            
            buildings.player.forEach(building => {
                const distance = building.position.distanceTo(aiState.basePosition);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestBuilding = building;
                }
            });
            
            aiState.targetPlayer = nearestBuilding;
        } else if (units.player.length > 0) {
            // If no buildings, attack nearest player unit
            let nearestUnit = null;
            let nearestDistance = Infinity;
            
            units.player.forEach(unit => {
                const distance = unit.position.distanceTo(aiState.basePosition);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestUnit = unit;
                }
            });
            
            aiState.targetPlayer = nearestUnit;
        }
        
        // Send attack force to target
        if (aiState.targetPlayer) {
            aiState.attackForce.forEach(unit => {
                unit.userData.targetEntity = aiState.targetPlayer;
                unit.userData.state = 'attacking';
            });
        }
    }
}

// AI action: Manage resource gathering
export function aiActionManageResources() {
    aiState.harvesters.forEach(harvester => {
        if (harvester.userData.state === 'idle') {
            // If idle, find nearest resource
            const nearestResource = findNearestResource(harvester);
            if (nearestResource) {
                harvester.userData.targetEntity = nearestResource;
                harvester.userData.state = 'movingToResource';
            }
        }
    });
}

// AI update targeting for units
export function aiUpdateTargeting() {
    // Update targeting for attack force
    aiState.attackForce.forEach(unit => {
        // If target is destroyed, find new target
        if (!unit.userData.targetEntity || !unit.userData.targetEntity.parent) {
            // Find nearest player entity
            let nearestTarget = null;
            let nearestDistance = Infinity;
            
            // Prioritize attacking units
            units.player.forEach(playerUnit => {
                const distance = unit.position.distanceTo(playerUnit.position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestTarget = playerUnit;
                }
            });
            
            // If no units in range, attack buildings
            if (!nearestTarget || nearestDistance > 200) {
                buildings.player.forEach(building => {
                    const distance = unit.position.distanceTo(building.position);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTarget = building;
                    }
                });
            }
            
            if (nearestTarget) {
                unit.userData.targetEntity = nearestTarget;
                unit.userData.state = 'attacking';
            } else {
                unit.userData.state = 'idle';
            }
        }
    });
    
    // Update defense force to defend base from nearby player units
    const defendRange = 200; // Range to detect threats
    
    aiState.defenseForce.forEach(unit => {
        if (unit.userData.state === 'idle') {
            // Find player units near our base
            let threat = null;
            let threatDistance = Infinity;
            
            units.player.forEach(playerUnit => {
                const distance = playerUnit.position.distanceTo(aiState.basePosition);
                if (distance < defendRange && distance < threatDistance) {
                    threatDistance = distance;
                    threat = playerUnit;
                }
            });
            
            if (threat) {
                unit.userData.targetEntity = threat;
                unit.userData.state = 'attacking';
            }
        }
    });
}