import * as THREE from 'three';
import { camera, selectedUnits } from '../core/init.js';

// Create a health bar for units and buildings
export function createHealthBar(entity) {
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    healthBar.style.width = `${entity.scale.x * 20}px`;
    healthBar.style.display = 'none';
    
    document.body.appendChild(healthBar);
    
    entity.userData.healthBar = healthBar;
}

// Update health bar position and visibility
export function updateHealthBar(entity) {
    if (!entity.userData.healthBar) return;
    
    if (entity.visible && entity.userData.health < entity.userData.maxHealth) {
        // Calculate screen position
        const vector = new THREE.Vector3();
        vector.setFromMatrixPosition(entity.matrixWorld);
        vector.y += entity.userData.type === 'building' ? 15 : 10;
        
        vector.project(camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        // Update health bar
        const healthBar = entity.userData.healthBar;
        healthBar.style.display = 'block';
        healthBar.style.left = `${x}px`;
        healthBar.style.top = `${y}px`;
        
        // Set width based on health percentage
        const healthPercent = entity.userData.health / entity.userData.maxHealth;
        healthBar.style.width = `${entity.scale.x * 20}px`;
        healthBar.style.transform = `translateX(-50%) scaleX(${healthPercent})`;
        
        // Color based on health percentage
        if (healthPercent > 0.6) {
            healthBar.style.backgroundColor = 'green';
        } else if (healthPercent > 0.3) {
            healthBar.style.backgroundColor = 'yellow';
        } else {
            healthBar.style.backgroundColor = 'red';
        }
    } else {
        entity.userData.healthBar.style.display = 'none';
    }
}

// Update user interface
export function updateUI() {
    // Update selected units info
    const selectedInfo = document.getElementById('selected-info');
    
    if (selectedUnits.length === 0) {
        selectedInfo.textContent = 'No units selected';
    } else if (selectedUnits.length === 1) {
        const unit = selectedUnits[0];
        selectedInfo.innerHTML = `
            ${unit.userData.unitType.toUpperCase()}<br>
            Health: ${Math.floor(unit.userData.health)}/${unit.userData.maxHealth}<br>
            ${unit.userData.state.toUpperCase()}
        `;
    } else {
        selectedInfo.textContent = `${selectedUnits.length} units selected`;
    }
    
    // Update command buttons
    updateCommandButtons();
}

// Update command buttons based on selection
export function updateCommandButtons() {
    const commandsContainer = document.getElementById('commands');
    commandsContainer.innerHTML = '';
    
    if (selectedUnits.length === 0) {
        // Show building options
        const buildings = ['barracks', 'warFactory', 'powerPlant'];
        
        buildings.forEach((buildingType, index) => {
            const button = document.createElement('div');
            button.className = 'command-btn';
            button.textContent = buildingType.charAt(0).toUpperCase();
            button.title = `Build ${buildingType}`;
            
            button.onclick = () => {
                enterBuildMode(buildingType);
            };
            
            commandsContainer.appendChild(button);
        });
    } else {
        // Get first selected unit for commands
        const unit = selectedUnits[0];
        
        if (unit.userData.unitType === 'harvester') {
            // Harvester commands
            const harvestBtn = document.createElement('div');
            harvestBtn.className = 'command-btn';
            harvestBtn.textContent = 'H';
            harvestBtn.title = 'Harvest resources';
            
            harvestBtn.onclick = () => {
                const nearestResource = findNearestResource(unit);
                if (nearestResource) {
                    unit.userData.targetEntity = nearestResource;
                    unit.userData.state = 'movingToResource';
                }
            };
            
            commandsContainer.appendChild(harvestBtn);
            
            const returnBtn = document.createElement('div');
            returnBtn.className = 'command-btn';
            returnBtn.textContent = 'R';
            returnBtn.title = 'Return to base';
            
            returnBtn.onclick = () => {
                const refinery = findNearestRefinery(unit);
                if (refinery) {
                    unit.userData.targetEntity = refinery;
                    unit.userData.state = 'returningToBase';
                }
            };
            
            commandsContainer.appendChild(returnBtn);
        } else if (unit.userData.unitType === 'lightTank' || unit.userData.unitType === 'heavyTank') {
            // Combat unit commands
            const attackBtn = document.createElement('div');
            attackBtn.className = 'command-btn';
            attackBtn.textContent = 'A';
            attackBtn.title = 'Attack';
            
            attackBtn.onclick = () => {
                // Enter attack mode
                document.body.style.cursor = 'crosshair';
                
                const attackHandler = (event) => {
                    const intersects = getIntersects(event);
                    if (intersects.length > 0) {
                        const target = intersects[0].object;
                        
                        if (target.userData.faction === 'enemy') {
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
                    
                    document.body.style.cursor = 'default';
                    document.removeEventListener('mousedown', attackHandler);
                };
                
                document.addEventListener('mousedown', attackHandler);
            };
            
            commandsContainer.appendChild(attackBtn);
        }
        
        // Stop command for all units
        const stopBtn = document.createElement('div');
        stopBtn.className = 'command-btn';
        stopBtn.textContent = 'S';
        stopBtn.title = 'Stop';
        
        stopBtn.onclick = () => {
            selectedUnits.forEach(unit => {
                unit.userData.state = 'idle';
                unit.userData.targetEntity = null;
                unit.userData.path = [];
            });
        };
        
        commandsContainer.appendChild(stopBtn);
    }
}

// Show building options UI
export function showBuildingOptions(building) {
    // Clear existing commands
    const commandsContainer = document.getElementById('commands');
    commandsContainer.innerHTML = '';
    
    // Show different options based on building type
    switch (building.userData.buildingType) {
        case 'commandCenter':
            // Command center can build harvesters
            const harvesterBtn = document.createElement('div');
            harvesterBtn.className = 'command-btn';
            harvesterBtn.textContent = 'H';
            harvesterBtn.title = 'Build Harvester (800)';
            
            harvesterBtn.onclick = () => {
                if (resources.player.credits >= 800) {
                    resources.player.credits -= 800;
                    building.userData.isProducing = true;
                    building.userData.productionType = 'harvester';
                }
            };
            
            commandsContainer.appendChild(harvesterBtn);
            break;
            
        case 'barracks':
            // No units implemented for barracks
            break;
            
            case 'warFactory':
                // War factory can build tanks
                const lightTankBtn = document.createElement('div');
                lightTankBtn.className = 'command-btn';
                lightTankBtn.textContent = 'L';
                lightTankBtn.title = 'Build Light Tank (500)';
                
                lightTankBtn.onclick = () => {
                    if (resources.player.credits >= 500) {
                        resources.player.credits -= 500;
                        building.userData.isProducing = true;
                        building.userData.productionType = 'lightTank';
                    }
                };
                
                commandsContainer.appendChild(lightTankBtn);
                
                const heavyTankBtn = document.createElement('div');
                heavyTankBtn.className = 'command-btn';
                heavyTankBtn.textContent = 'H';
                heavyTankBtn.title = 'Build Heavy Tank (700)';
                
                heavyTankBtn.onclick = () => {
                    if (resources.player.credits >= 700) {
                        resources.player.credits -= 700;
                        building.userData.isProducing = true;
                        building.userData.productionType = 'heavyTank';
                    }
                };
                
                commandsContainer.appendChild(heavyTankBtn);
                break;
        }
        
        // Show production progress if building is producing
        if (building.userData.isProducing) {
            const progressBar = document.createElement('div');
            progressBar.style.width = '100%';
            progressBar.style.height = '10px';
            progressBar.style.backgroundColor = '#333';
            progressBar.style.marginTop = '10px';
            
            const progress = document.createElement('div');
            progress.style.width = `${building.userData.productionProgress}%`;
            progress.style.height = '100%';
            progress.style.backgroundColor = '#4CAF50';
            
            progressBar.appendChild(progress);
            commandsContainer.appendChild(progressBar);
            
            const productionInfo = document.createElement('div');
            productionInfo.textContent = `Building: ${building.userData.productionType}`;
            commandsContainer.appendChild(productionInfo);
        }
        
        // Set rally point button
        const rallyBtn = document.createElement('div');
        rallyBtn.className = 'command-btn';
        rallyBtn.textContent = 'R';
        rallyBtn.title = 'Set Rally Point';
        
        rallyBtn.onclick = () => {
            document.body.style.cursor = 'crosshair';
            
            const setRallyHandler = (event) => {
                const intersects = getIntersects(event);
                if (intersects.length > 0) {
                    building.userData.rallyPoint = intersects[0].point.clone();
                    
                    // Visual indicator
                    const indicator = scene.getObjectByName(`rallyPoint_${building.id}`);
                    if (indicator) {
                        scene.remove(indicator);
                    }
                    
                    const markerGeometry = new THREE.CylinderGeometry(1, 0, 10, 8);
                    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x44ff44 });
                    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                    marker.name = `rallyPoint_${building.id}`;
                    marker.position.copy(building.userData.rallyPoint);
                    marker.position.y += 5;
                    scene.add(marker);
                    
                    // Fade out marker after 3 seconds
                    setTimeout(() => {
                        scene.remove(marker);
                    }, 3000);
                }
                
                document.body.style.cursor = 'default';
                document.removeEventListener('mousedown', setRallyHandler);
            };
            
            document.addEventListener('mousedown', setRallyHandler);
        };
        
        commandsContainer.appendChild(rallyBtn);
    }