import * as THREE from 'three';
import { getDistance } from '../utils/math.js';
import { calculatePath } from '../pathfinding/astar.js';
import { moveUnitAlongPath } from '../units/unit.js';
import { destroyEntity } from '../units/unit.js';
import { fireProjectile } from './projectile.js';
import { createExplosion } from './effects.js';

// Attack target entity
export function attackTarget(unit) {
    if (!unit.userData.targetEntity) {
        unit.userData.state = 'idle';
        return;
    }
    
    const target = unit.userData.targetEntity;
    
    // Check if target still exists and is visible
    if (!target.parent || (target.userData.faction === 'enemy' && !target.visible)) {
        unit.userData.targetEntity = null;
        unit.userData.state = 'idle';
        return;
    }
    
    // Check if in range
    const distance = getDistance(unit, target);
    
    if (distance > unit.userData.range) {
        // Move closer to target
        if (!unit.userData.path || unit.userData.path.length === 0) {
            const path = calculatePath(unit, target.position);
            unit.userData.path = path;
            unit.userData.state = 'moving';
        } else {
            moveUnitAlongPath(unit);
        }
        return;
    }
    
    // Face target
    const direction = new THREE.Vector3().subVectors(target.position, unit.position).normalize();
    const targetRotation = Math.atan2(direction.x, direction.z);
    unit.rotation.y = targetRotation;
    
    // Attack on cooldown
    const now = Date.now();
    if (now - unit.userData.lastAttackTime >= unit.userData.attackCooldown) {
        // Fire projectile
        fireProjectile(unit, target);
        
        // Apply damage
        applyDamage(target, unit.userData.attack);
        
        // Update last attack time
        unit.userData.lastAttackTime = now;
    }
}

// Handle damage to entities
export function applyDamage(entity, amount) {
    entity.userData.health -= amount;
    
    // Flash the entity red
    const originalMaterial = entity.material.clone();
    entity.material.color.set(0xff0000);
    
    setTimeout(() => {
        if (entity && entity.material) {
            entity.material.color.copy(originalMaterial.color);
        }
    }, 100);
    
    // Check if entity is destroyed
    if (entity.userData.health <= 0) {
        destroyEntity(entity);
    }
}