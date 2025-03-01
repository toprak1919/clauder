import * as THREE from 'three';
import { units, buildings, GAME_SIZE } from '../core/init.js';
import { gameActive } from '../core/engine.js';
import { aiActionBuild, aiActionExpand, aiActionAttack, aiActionManageResources, aiUpdateTargeting } from './behavior.js';

// AI state
export let aiState;

// Initialize AI
export function initializeAI() {
    // Set initial AI state
    aiState = {
        mode: 'building',
        lastUpdateTime: Date.now(),
        targetPlayer: null,
        attackForce: [],
        defenseForce: [],
        harvesters: [],
        basePosition: new THREE.Vector3(GAME_SIZE/4, 0, GAME_SIZE/4),
        expansion: false
    };
    
    // Categorize initial units
    units.enemy.forEach(unit => {
        if (unit.userData.unitType === 'harvester') {
            aiState.harvesters.push(unit);
        } else {
            aiState.defenseForce.push(unit);
        }
    });
}

// Update AI logic
export function updateAI() {
    // Skip if game is over
    if (!gameActive) return;
    
    // Update AI state based on resources and time
    const now = Date.now();
    const timeSinceLastUpdate = now - aiState.lastUpdateTime;
    
    // Make decisions every 5 seconds
    if (timeSinceLastUpdate > 5000) {
        aiState.lastUpdateTime = now;
        
        // Categorize units
        aiState.harvesters = units.enemy.filter(unit => unit.userData.unitType === 'harvester');
        aiState.defenseForce = units.enemy.filter(unit => unit.userData.unitType !== 'harvester' && unit.userData.state !== 'attacking');
        aiState.attackForce = units.enemy.filter(unit => unit.userData.unitType !== 'harvester' && unit.userData.state === 'attacking');
        
        // Determine AI mode based on situation
        if (resources.enemy.credits < 300) {
            aiState.mode = 'building';
        } else if (aiState.defenseForce.length + aiState.attackForce.length >= 6) {
            aiState.mode = 'attacking';
        } else if (buildings.enemy.length < 4) {
            aiState.mode = 'expanding';
        } else {
            aiState.mode = 'building';
        }
        
        // Execute AI actions based on mode
        switch (aiState.mode) {
            case 'building':
                aiActionBuild();
                break;
                
            case 'expanding':
                aiActionExpand();
                break;
                
            case 'attacking':
                aiActionAttack();
                break;
        }
        
        // Always manage resource gathering
        aiActionManageResources();
    }
    
    // Continuously update unit targeting
    aiUpdateTargeting();
}