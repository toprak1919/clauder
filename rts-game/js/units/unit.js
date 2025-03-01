import * as THREE from 'three';
import { scene, units, selectedUnits } from '../core/init.js';
import { getTerrainHeight } from '../core/init.js';
import { calculatePath } from '../pathfinding/astar.js';
import { findNearestEnemy, findNearestResource, findNearestRefinery } from '../utils/helpers.js';
import { getDistance } from '../utils/math.js';
import { attackTarget } from '../combat/combat.js';
import { applyDamage } from '../combat/combat.js';
import { harvestResource, unloadResources } from './harvester.js';
import { checkWinCondition } from '../core/engine.js';
import { createHealthBar, updateHealthBar } from '../ui/interface.js';
import { rotateTurretToTarget } from './tank.js';

// Update all units
export function updateUnits() {
    for (const faction in units) {
        units[faction].forEach(unit => {
            // Handle different unit states
            switch (unit.userData.state) {
                case 'idle':
                    // Auto-attack enemy units that come within range
                    if (unit.userData.unitType !== 'harvester' && unit.userData.faction === 'player') {
                        const nearestEnemy = findNearestEnemy(unit);
                        if (nearestEnemy && getDistance(unit, nearestEnemy) <= unit.userData.range) {
                            unit.userData.targetEntity = nearestEnemy;
                            unit.userData.state = 'attacking';
                        }
                    }
                    
                    // Harvesters should find resources when idle
                    if (unit.userData.unitType === 'harvester' && unit.userData.harvestedResources < unit.userData.harvestCapacity) {
                        const nearestResource = findNearestResource(unit);
                        if (nearestResource) {
                            unit.userData.targetEntity = nearestResource;
                            unit.userData.state = 'movingToResource';
                        }
                    }
                    break;
                    
                case 'moving':
                    moveUnitAlongPath(unit);
                    break;
                    
                case 'attacking':
                    attackTarget(unit);
                    break;
                    
                case 'movingToResource':
                    moveToResource(unit);
                    break;
                    
                case 'harvesting':
                    harvestResource(unit);
                    break;
                    
                case 'returningToBase':
                    returnToBase(unit);
                    break;
                    
                case 'unloading':
                    unloadResources(unit);
                    break;
            }
            
            // Update health bar
            updateHealthBar(unit);
            
            // Animate turret if unit has one and is attacking
            if (unit.userData.turret && unit.userData.targetEntity && 
                (unit.userData.state === 'attacking' || unit.userData.state === 'moving')) {
                rotateTurretToTarget(unit);
            }
        });
    }
}

// Move unit along calculated path
export function moveUnitAlongPath(unit) {
    if (!unit.userData.path || unit.userData.path.length === 0) {
        unit.userData.state = 'idle';
        return;
    }
    
    const nextPoint = unit.userData.path[0];
    const targetPosition = new THREE.Vector3(nextPoint.x, 0, nextPoint.z);
    
    // Set height based on terrain
    targetPosition.y = getTerrainHeight(targetPosition.x, targetPosition.z);
    
    // Calculate direction and distance
    const direction = new THREE.Vector3().subVectors(targetPosition, unit.position).normalize();
    const distance = unit.position.distanceTo(targetPosition);
    
    // If close enough to waypoint, move to next one
    if (distance < 5) {
        unit.userData.path.shift();
        
        // If path is empty and we have a target entity, transition to appropriate state
        if (unit.userData.path.length === 0) {
            if (unit.userData.targetEntity) {
                if (unit.userData.targetEntity.userData.type === 'resource') {
                    unit.userData.state = 'harvesting';
                } else if (unit.userData.targetEntity.userData.faction !== unit.userData.faction) {
                    unit.userData.state = 'attacking';
                } else {
                    unit.userData.state = 'idle';
                }
            } else {
                unit.userData.state = 'idle';
            }
            
            return;
        }
    }
    
    // Move unit
    const speed = unit.userData.speed;
    unit.position.add(direction.multiplyScalar(speed));
    
    // Orient unit to face movement direction
    if (direction.length() > 0) {
        const targetRotation = Math.atan2(direction.x, direction.z);
        
        // Smooth rotation
        let currentRotation = unit.rotation.y;
        const rotationDiff = targetRotation - currentRotation;
        
        // Normalize angle to -PI to PI
        let normalizedDiff = rotationDiff;
        while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
        while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
        
        // Apply rotation with smoothing
        unit.rotation.y += Math.sign(normalizedDiff) * Math.min(0.1, Math.abs(normalizedDiff));
    }
    
    // Check for enemies while moving (for combat units)
    if (unit.userData.attack > 0 && unit.userData.faction === 'player') {
        const nearestEnemy = findNearestEnemy(unit);
        if (nearestEnemy && getDistance(unit, nearestEnemy) <= unit.userData.range) {
            unit.userData.targetEntity = nearestEnemy;
            unit.userData.state = 'attacking';
        }
    }
}

// Create a new unit
export function createUnit(type, faction, position) {
    let geometry, material, scale = 1, health = 100, attack = 10, range = 100, speed = 1, visionRange = 8;
    
    // Adjust position to terrain height
    position.y = getTerrainHeight(position.x, position.z);
    
    // Define unit types
    switch (type) {
        case 'harvester':
            geometry = new THREE.BoxGeometry(8, 6, 12);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x3333ff : 0xff3333,
                roughness: 0.7,
                metalness: 0.3
            });
            health = 150;
            attack = 0;
            speed = 0.5;
            break;
            
        case 'lightTank':
            geometry = new THREE.BoxGeometry(8, 5, 12);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x2222dd : 0xdd2222,
                roughness: 0.5,
                metalness: 0.5
            });
            health = 120;
            attack = 15;
            range = 150;
            speed = 0.8;
            break;
            
        case 'heavyTank':
            geometry = new THREE.BoxGeometry(10, 6, 15);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x1111aa : 0xaa1111,
                roughness: 0.3,
                metalness: 0.7
            });
            health = 200;
            attack = 25;
            range = 120;
            speed = 0.5;
            visionRange = 6;
            break;
    }
    
    const unit = new THREE.Mesh(geometry, material);
    unit.position.copy(position);
    unit.castShadow = true;
    unit.receiveShadow = true;
    
    // Add turret for combat units
    if (type !== 'harvester') {
        const turretGeometry = new THREE.CylinderGeometry(3, 3, 3, 8);
        const turretMaterial = new THREE.MeshStandardMaterial({
            color: faction === 'player' ? 0x4444ff : 0xff4444,
            roughness: 0.5,
            metalness: 0.5
        });
        const turret = new THREE.Mesh(turretGeometry, turretMaterial);
        turret.position.y = 3;
        unit.add(turret);
        
        const barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        barrelGeometry.rotateZ(Math.PI / 2);
        const barrelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.3,
            metalness: 0.8
        });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(4, 0, 0);
        turret.add(barrel);
        
        unit.userData.turret = turret;
    } else {
        // Add harvester-specific geometry
        const scoop = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 8),
            new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.7,
                metalness: 0.5
            })
        );
        scoop.position.set(0, -3, 6);
        unit.add(scoop);
    }
    
    // Add unit data
    unit.userData = {
        type: 'unit',
        unitType: type,
        faction: faction,
        health: health,
        maxHealth: health,
        attack: attack,
        range: range,
        speed: speed,
        state: 'idle',
        targetPosition: null,
        targetEntity: null,
        path: [],
        lastAttackTime: 0,
        attackCooldown: 1000, // ms
        visionRange: visionRange,
        harvestedResources: 0,
        harvestCapacity: type === 'harvester' ? 500 : 0,
        harvestRate: type === 'harvester' ? 5 : 0
    };
    
    // Create health bar
    createHealthBar(unit);
    
    scene.add(unit);
    units[faction].push(unit);
    
    return unit;
}

// Move to resource node
export function moveToResource(unit) {
    if (!unit.userData.targetEntity) {
        unit.userData.state = 'idle';
        return;
    }
    
    const resource = unit.userData.targetEntity;
    const distance = getDistance(unit, resource);
    
    if (distance > 15) {
        // If we don't have a path or are far from resource, calculate a new path
        if (!unit.userData.path || unit.userData.path.length === 0) {
            const path = calculatePath(unit, resource.position);
            unit.userData.path = path;
            unit.userData.state = 'moving';
        } else {
            moveUnitAlongPath(unit);
        }
    } else {
        // Close enough to harvest
        unit.userData.state = 'harvesting';
    }
}

// Return to base with harvested resources
export function returnToBase(unit) {
    if (!unit.userData.targetEntity) {
        // If no target, find nearest refinery
        const refinery = findNearestRefinery(unit);
        if (refinery) {
            unit.userData.targetEntity = refinery;
        } else {
            unit.userData.state = 'idle';
            return;
        }
    }
    
    const refinery = unit.userData.targetEntity;
    const distance = getDistance(unit, refinery);
    
    if (distance > 20) {
        // If we don't have a path or are far from refinery, calculate a new path
        if (!unit.userData.path || unit.userData.path.length === 0) {
            const path = calculatePath(unit, refinery.position);
            unit.userData.path = path;
            unit.userData.state = 'moving';
        } else {
            moveUnitAlongPath(unit);
        }
    } else {
        // Close enough to unload
        unit.userData.state = 'unloading';
    }
}

// Handle damage to entities
export function destroyEntity(entity) {
    // Create explosion effect
    createExplosion(entity.position);
    
    // Remove from scene
    scene.remove(entity);
    
    // Remove from arrays
    const faction = entity.userData.faction;
    const type = entity.userData.type;
    
    if (type === 'unit') {
        const index = units[faction].indexOf(entity);
        if (index !== -1) {
            units[faction].splice(index, 1);
        }
        
        // Remove from selected units
        const selectedIndex = selectedUnits.indexOf(entity);
        if (selectedIndex !== -1) {
            selectedUnits.splice(selectedIndex, 1);
        }
    } else if (type === 'building') {
        const index = buildings[faction].indexOf(entity);
        if (index !== -1) {
            buildings[faction].splice(index, 1);
        }
        
        // Make area walkable again in pathfinding grid
        markBuildingArea(entity, 1);
    }
    
    // Remove health bar
    if (entity.userData.healthBar) {
        document.body.removeChild(entity.userData.healthBar);
    }
    
    // Check win condition
    checkWinCondition();
}