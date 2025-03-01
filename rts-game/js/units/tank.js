import * as THREE from 'three';

// Rotate turret to face target
export function rotateTurretToTarget(unit) {
    if (!unit.userData.turret || !unit.userData.targetEntity) return;
    
    const turret = unit.userData.turret;
    const target = unit.userData.targetEntity;
    
    // Calculate direction to target
    const direction = new THREE.Vector3().subVectors(target.position, unit.position).normalize();
    
    // Calculate target rotation (y-axis)
    const targetRotation = Math.atan2(direction.x, direction.z);
    
    // Smooth rotation
    const rotationDiff = targetRotation - turret.rotation.y;
    
    // Normalize angle
    let normalizedDiff = rotationDiff;
    while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
    while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
    
    // Apply rotation with smoothing
    turret.rotation.y += Math.sign(normalizedDiff) * Math.min(0.1, Math.abs(normalizedDiff));
}