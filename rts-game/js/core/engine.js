import * as THREE from 'three';
import { camera, scene, renderer, controls, buildings } from './init.js';
import { updateUnits } from '../units/unit.js';
import { updateBuildings } from '../buildings/building.js';
import { updateResources } from './resources.js';
import { updateFogOfWar } from '../terrain/fogOfWar.js';
import { updateUI } from '../ui/interface.js';
import { updateAI } from '../ai/ai.js';
import { renderMinimap } from '../ui/minimap.js';

// Game state
export let gameActive = true;
export let frameCount = 0;

// Animation loop
export function animate() {
    requestAnimationFrame(animate);
    
    controls.update();
    
    // Update game logic
    updateUnits();
    updateBuildings();
    updateResources();
    updateFogOfWar();
    updateUI();
    
    // Update AI
    if (frameCount % 60 === 0) { // Run AI logic once per second
        updateAI();
    }
    
    // Render scene
    renderer.render(scene, camera);
    
    // Render minimap
    renderMinimap();
    
    frameCount++;
}

// Show game over message
export function showGameOverMessage(result, message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = 'white';
    overlay.style.fontSize = '36px';
    overlay.style.fontWeight = 'bold';
    overlay.style.zIndex = '1000';
    
    const resultDiv = document.createElement('div');
    resultDiv.textContent = result;
    resultDiv.style.fontSize = '72px';
    resultDiv.style.marginBottom = '20px';
    resultDiv.style.color = result === 'VICTORY' ? '#44ff44' : (result === 'DEFEAT' ? '#ff4444' : '#ffff44');
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Restart Game';
    restartButton.style.marginTop = '30px';
    restartButton.style.padding = '10px 20px';
    restartButton.style.fontSize = '24px';
    restartButton.style.cursor = 'pointer';
    restartButton.onclick = () => {
        location.reload();
    };
    
    overlay.appendChild(resultDiv);
    overlay.appendChild(messageDiv);
    overlay.appendChild(restartButton);
    document.body.appendChild(overlay);
    
    // Pause game
    gameActive = false;
}

// Check win condition
export function checkWinCondition() {
    // Check if all command centers of one faction are destroyed
    const playerCommandCenter = buildings.player.find(b => b.userData.buildingType === 'commandCenter');
    const enemyCommandCenter = buildings.enemy.find(b => b.userData.buildingType === 'commandCenter');
    
    if (!playerCommandCenter && enemyCommandCenter) {
        showGameOverMessage('DEFEAT', 'Your command center has been destroyed!');
    } else if (playerCommandCenter && !enemyCommandCenter) {
        showGameOverMessage('VICTORY', 'Enemy command center destroyed!');
    } else if (!playerCommandCenter && !enemyCommandCenter) {
        showGameOverMessage('DRAW', 'Both command centers have been destroyed!');
    }
}