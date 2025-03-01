import * as THREE from 'three';
import { scene } from '../core/init.js';
import { createImpactEffect } from './effects.js';

// Fire projectile from unit to target
export function fireProjectile(unit, target) {
    // Calculate projectile start position (from turret if available)
    const startPosition = new THREE.Vector3();
    if (unit.userData.turret) {
        const barrel = unit.userData.turret.children[0];
        barrel.getWorldPosition(startPosition);
    } else {
        startPosition.copy(unit.position);
        startPosition.y += 5;
    }
    
    // Create projectile
    const projectileGeometry = new THREE.SphereGeometry(1, 8, 8);
    const projectileMaterial = new THREE.MeshBasicMaterial({
        color: unit.userData.faction === 'player' ? 0x44aaff : 0xff4444,
        transparent: true,
        opacity: 0.7
    });
    
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
    projectile.position.copy(startPosition);
    
    // Add light to projectile
    const light = new THREE.PointLight(
        unit.userData.faction === 'player' ? 0x44aaff : 0xff4444,
        1,
        10
    );
    projectile.add(light);
    
    scene.add(projectile);
    
    // Animate projectile
    const targetPosition = target.position.clone();
    targetPosition.y += 5; // Aim at center of target
    
    const direction = new THREE.Vector3().subVectors(targetPosition, startPosition).normalize();
    const distance = startPosition.distanceTo(targetPosition);
    const speed = 3; // Units per frame
    const duration = distance / speed;
    
    // Create trail effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
        color: unit.userData.faction === 'player' ? 0x44aaff : 0xff4444,
        transparent: true,
        opacity: 0.5
    });
    
    const positions = new Float32Array(20 * 3); // 20 points
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    scene.add(trail);
    
    // Animation variables
    let progress = 0;
    let trailIndex = 0;
    
    const animate = () => {
        progress += 0.05;
        
        if (progress >= 1) {
            // Hit target
            scene.remove(projectile);
            scene.remove(trail);
            
            // Create impact effect
            createImpactEffect(targetPosition, unit.userData.faction);
            
            return;
        }
        
        // Update projectile position
        const newPosition = new THREE.Vector3().lerpVectors(startPosition, targetPosition, progress);
        
        // Add slight arc
        newPosition.y += Math.sin(progress * Math.PI) * 5;
        
        projectile.position.copy(newPosition);
        
        // Update trail
        const positions = trail.geometry.attributes.position.array;
        
        positions[trailIndex * 3] = newPosition.x;
        positions[trailIndex * 3 + 1] = newPosition.y;
        positions[trailIndex * 3 + 2] = newPosition.z;
        
        trailIndex = (trailIndex + 1) % 20;
        
        trail.geometry.attributes.position.needsUpdate = true;
        
        requestAnimationFrame(animate);
    };
    
    animate();
}