import * as THREE from 'three';
import { scene, buildings, GAME_SIZE, TILE_SIZE, MAP_SIZE } from '../core/init.js';
import { getTerrainHeight } from '../core/init.js';
import { createHealthBar, updateHealthBar } from '../ui/interface.js';
import { markBuildingArea } from '../pathfinding/grid.js';
import { createUnit } from '../units/unit.js';

// Update buildings
export function updateBuildings() {
    for (const faction in buildings) {
        buildings[faction].forEach(building => {
            // Handle construction
            if (building.userData.isConstructing) {
                building.userData.constructionProgress += 0.2;
                
                // Update visual appearance
                const progress = building.userData.constructionProgress / 100;
                building.scale.y = progress;
                building.position.y = getTerrainHeight(building.position.x, building.position.z) + (building.geometry.parameters.height / 2) * progress;
                
                if (building.userData.constructionProgress >= 100) {
                    building.userData.isConstructing = false;
                    building.scale.y = 1;
                    building.position.y = getTerrainHeight(building.position.x, building.position.z) + building.geometry.parameters.height / 2;
                }
            }
            
            // Handle production
            if (!building.userData.isConstructing && building.userData.isProducing) {
                building.userData.productionProgress += 0.5;
                
                if (building.userData.productionProgress >= 100) {
                    building.userData.isProducing = false;
                    building.userData.productionProgress = 0;
                    
                    // Create produced unit/building
                    const rallyPoint = building.userData.rallyPoint;
                    createUnit(building.userData.productionType, building.userData.faction, rallyPoint);
                    
                    // Start next production if queue exists
                    if (building.userData.productionQueue.length > 0) {
                        const nextProduction = building.userData.productionQueue.shift();
                        building.userData.productionType = nextProduction;
                        building.userData.isProducing = true;
                    }
                }
            }
            
            // Update health bar
            updateHealthBar(building);
            
            // Animate special building features
            if (building.userData.animateRadar) {
                const radarBase = building.children[0];
                radarBase.rotation.y += 0.01;
            }
        });
    }
}

// Create a building
export function createBuilding(type, faction, position) {
    let geometry, material, scale = 1, health = 500, buildTime = 5000, cost = 1000;
    const buildingHeight = 20;
    
    // Adjust position to terrain height
    position.y = getTerrainHeight(position.x, position.z);
    
    // Define building types
    switch (type) {
        case 'commandCenter':
            geometry = new THREE.BoxGeometry(40, buildingHeight, 40);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x3333ff : 0xff3333,
                roughness: 0.8,
                metalness: 0.2
            });
            health = 1000;
            break;
            
        case 'barracks':
            geometry = new THREE.BoxGeometry(30, buildingHeight, 30);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x6666ff : 0xff6666,
                roughness: 0.7,
                metalness: 0.3
            });
            health = 500;
            cost = 500;
            break;
            
        case 'warFactory':
            geometry = new THREE.BoxGeometry(35, buildingHeight, 45);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x4444ff : 0xff4444,
                roughness: 0.6,
                metalness: 0.4
            });
            health = 800;
            cost = 800;
            break;
            
        case 'powerPlant':
            geometry = new THREE.CylinderGeometry(15, 15, buildingHeight, 16);
            material = new THREE.MeshStandardMaterial({
                color: faction === 'player' ? 0x88aaff : 0xffaa88,
                roughness: 0.5,
                metalness: 0.5
            });
            health = 300;
            cost = 300;
            break;
    }
    
    const building = new THREE.Mesh(geometry, material);
    building.position.copy(position);
    building.position.y += buildingHeight / 2; // Place on ground
    building.castShadow = true;
    building.receiveShadow = true;
    
    // Add details based on building type
    if (type === 'commandCenter') {
        // Add radar dish
        const radarBase = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 5, 16),
            new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.5,
                metalness: 0.7
            })
        );
        radarBase.position.y = buildingHeight / 2 + 2.5;
        building.add(radarBase);
        
        const radarDish = new THREE.Mesh(
            new THREE.SphereGeometry(10, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 0.3,
                metalness: 0.8
            })
        );
        radarDish.rotation.x = Math.PI / 4;
        radarDish.position.y = 5;
        radarBase.add(radarDish);
        
        // Animate radar dish rotation
        building.userData.animateRadar = true;
    } else if (type === 'powerPlant') {
        // Add cooling towers
        for (let i = 0; i < 2; i++) {
            const tower = new THREE.Mesh(
                new THREE.CylinderGeometry(5, 7, 15, 16),
                new THREE.MeshStandardMaterial({
                    color: 0xdddddd,
                    roughness: 0.7,
                    metalness: 0.1
                })
            );
            tower.position.set(i === 0 ? -10 : 10, 0, 0);
            building.add(tower);
        }
    } else if (type === 'warFactory') {
        // Add factory details
        const roofDetail = new THREE.Mesh(
            new THREE.BoxGeometry(30, 5, 40),
            new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.6,
                metalness: 0.5
            })
        );
        roofDetail.position.y = buildingHeight / 2 + 2.5;
        building.add(roofDetail);
        
        // Add smokestacks
        for (let i = 0; i < 2; i++) {
            const smokestack = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 10, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.7,
                    metalness: 0.3
                })
            );
            smokestack.position.set(i === 0 ? -12 : 12, buildingHeight / 2 + 5, -15);
            building.add(smokestack);
        }
    }
    
    // Add building data
    building.userData = {
        type: 'building',
        buildingType: type,
        faction: faction,
        health: health,
        maxHealth: health,
        constructionProgress: type === 'commandCenter' ? 100 : 0, // Command center starts complete
        isConstructing: type !== 'commandCenter',
        isProducing: false,
        productionQueue: [],
        productionProgress: 0,
        productionType: null,
        powerGeneration: type === 'powerPlant' ? 100 : 0,
        powerConsumption: type === 'powerPlant' ? 0 : 25,
        rallyPoint: position.clone().add(new THREE.Vector3(0, 0, 50)),
        visionRange: 10
    };
    
    // Create health bar
    createHealthBar(building);
    
    // Mark area as unwalkable in pathfinding grid
    markBuildingArea(building, 0);
    
    scene.add(building);
    buildings[faction].push(building);
    
    return building;
}

// Create initial base for player/enemy
export function createInitialBase(faction, position) {
    // Create command center
    createBuilding('commandCenter', faction, position);
    
    // Create initial units
    if (faction === 'player') {
        createUnit('harvester', faction, position.clone().add(new THREE.Vector3(30, 0, 0)));
        createUnit('lightTank', faction, position.clone().add(new THREE.Vector3(0, 0, 30)));
        createUnit('lightTank', faction, position.clone().add(new THREE.Vector3(-30, 0, 0)));
    } else {
        createUnit('harvester', faction, position.clone().add(new THREE.Vector3(-30, 0, 0)));
        createUnit('lightTank', faction, position.clone().add(new THREE.Vector3(0, 0, -30)));
        createUnit('lightTank', faction, position.clone().add(new THREE.Vector3(30, 0, 0)));
    }
}
export function updateBuildingPreview(mousePosition) {
    if (!buildMode.active) return;
    
    const previewMesh = scene.getObjectByName('buildingPreview');
    if (!previewMesh) return;
    
    const intersects = getIntersects(mousePosition);
    if (intersects.length > 0) {
        const position = intersects[0].point;
        previewMesh.position.copy(position);
        previewMesh.position.y = getTerrainHeight(position.x, position.z) + 10;
        
        // Change color based on valid placement
        if (isAreaClear(position, buildMode.building)) {
            previewMesh.material.color.set(0x44ff44); // Green for valid
        } else {
            previewMesh.material.color.set(0xff4444); // Red for invalid
        }
    }
}

// Enter build mode for construction
export function enterBuildMode(buildingType) {
    buildMode.active = true;
    buildMode.building = buildingType;
    
    document.body.style.cursor = 'cell';
    
    // Show preview mesh
    const previewGeometry = new THREE.BoxGeometry(
        buildingType === 'powerPlant' ? 30 : (buildingType === 'warFactory' ? 35 : 30),
        20,
        buildingType === 'powerPlant' ? 30 : (buildingType === 'warFactory' ? 45 : 30)
    );
    
    const previewMaterial = new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    
    const previewMesh = new THREE.Mesh(previewGeometry, previewMaterial);
    previewMesh.name = 'buildingPreview';
    scene.add(previewMesh);
    
    // Event handler for placing building is handled in mouse.js
}

// Exit build mode
export function exitBuildMode() {
    buildMode.active = false;
    buildMode.building = null;
    document.body.style.cursor = 'default';
    
    // Remove preview mesh
    const previewMesh = scene.getObjectByName('buildingPreview');
    if (previewMesh) {
        scene.remove(previewMesh);
    }
    
    document.removeEventListener('mousedown', placeBuildingHandler);
}

// Handler for placing building
export function placeBuildingHandler(event) {
    if (event.button === 0) { // Left mouse button
        const intersects = getIntersects(event);
        if (intersects.length > 0) {
            const position = intersects[0].point;
            
            // Check if area is clear
            if (isAreaClear(position, buildMode.building)) {
                // Check if player has enough resources
                const buildingCost = getBuildingCost(buildMode.building);
                
                if (resources.player.credits >= buildingCost) {
                    // Deduct cost
                    resources.player.credits -= buildingCost;
                    
                    // Create building
                    createBuilding(buildMode.building, 'player', position);
                    
                    // Exit build mode
                    exitBuildMode();
                }
            }
        }
    }
}

// Get building dimensions based on type
function getBuildingSize(buildingType) {
    switch (buildingType) {
        case 'commandCenter':
            return { width: 40, depth: 40 };
        case 'powerPlant':
            return { width: 30, depth: 30 };
        case 'barracks':
            return { width: 35, depth: 35 };
        case 'warFactory':
            return { width: 40, depth: 45 };
        case 'refinery':
            return { width: 35, depth: 40 };
        default:
            return { width: 30, depth: 30 };
    }
}

// Check if an area is clear for building placement
export function isAreaClear(position, buildingType) {
    // Get building size
    const size = getBuildingSize(buildingType);
    
    // Check for collisions with other buildings
    for (const faction in buildings) {
        for (const building of buildings[faction]) {
            const buildingSize = getBuildingSize(building.userData.buildingType);
            const dx = Math.abs(position.x - building.position.x);
            const dz = Math.abs(position.z - building.position.z);
            
            if (dx < (size.width + buildingSize.width) / 2 + 10 && 
                dz < (size.depth + buildingSize.depth) / 2 + 10) {
                return false;
            }
        }
    }
    
    // Check if area is walkable (not on steep terrain)
    const grid = window.pathfindingGrid;
    if (!grid) return false;
    
    const centerX = Math.floor((position.x + GAME_SIZE / 2) / TILE_SIZE);
    const centerZ = Math.floor((position.z + GAME_SIZE / 2) / TILE_SIZE);
    
    const halfWidthTiles = Math.ceil(size.width / (2 * TILE_SIZE));
    const halfDepthTiles = Math.ceil(size.depth / (2 * TILE_SIZE));
    
    for (let z = centerZ - halfDepthTiles; z <= centerZ + halfDepthTiles; z++) {
        for (let x = centerX - halfWidthTiles; x <= centerX + halfWidthTiles; x++) {
            if (x < 0 || x >= MAP_SIZE || z < 0 || z >= MAP_SIZE || grid[z][x] === 0) {
                return false;
            }
        }
    }
    
    return true;
}