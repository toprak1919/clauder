import * as THREE from 'three';
import { scene } from '../core/init.js';

// Create explosion effect
export function createExplosion(position) {
    // Create explosion particles
    const particleCount = 20;
    const particleGeometry = new THREE.SphereGeometry(1, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.8
    });
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        particle.position.copy(position);
        particle.position.y += 5;
        
        // Random velocity
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            ),
            lifetime: 1 + Math.random(),
            age: 0
        };
        
        scene.add(particle);
        setTimeout(() => {
            scene.remove(particle);
        }, particle.userData.lifetime * 1000);
    }
    
    // Add light flash
    const light = new THREE.PointLight(0xff5500, 5, 100);
    light.position.copy(position);
    light.position.y += 10;
    scene.add(light);
    
    // Fade out light
    let intensity = 5;
    const fadeInterval = setInterval(() => {
        intensity -= 0.5;
        if (intensity <= 0) {
            clearInterval(fadeInterval);
            scene.remove(light);
        } else {
            light.intensity = intensity;
        }
    }, 50);
}

// Create impact effect at target position
export function createImpactEffect(position, faction) {
    // Create impact flash
    const impactGeometry = new THREE.SphereGeometry(2, 8, 8);
    const impactMaterial = new THREE.MeshBasicMaterial({
        color: faction === 'player' ? 0x44aaff : 0xff4444,
        transparent: true,
        opacity: 0.8
    });
    
    const impact = new THREE.Mesh(impactGeometry, impactMaterial);
    impact.position.copy(position);
    scene.add(impact);
    
    // Add light
    const light = new THREE.PointLight(
        faction === 'player' ? 0x44aaff : 0xff4444,
        2,
        10
    );
    impact.add(light);
    
    // Animate impact
    let scale = 1;
    let opacity = 0.8;
    
    const animate = () => {
        scale += 0.2;
        opacity -= 0.1;
        
        if (opacity <= 0) {
            scene.remove(impact);
            return;
        }
        
        impact.scale.set(scale, scale, scale);
        impact.material.opacity = opacity;
        light.intensity = opacity * 2;
        
        requestAnimationFrame(animate);
    };
    
    animate();
}